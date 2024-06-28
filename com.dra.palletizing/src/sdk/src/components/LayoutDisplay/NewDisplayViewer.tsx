/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Context } from 'dart-api';
import React from 'react';

import classes from './DisplayViewer.module.css';
import Constants from '../../shared/constants';
import { generateId } from '../../shared/utils';
import URDFManipulator from '../../urdf-util/urdf-manipulator-element';
import ViewerManager from '../../ViewerManager';
import DirectionSetButton from './DirectionSetButton/DirectionSetBtn/DirectionSetBtn';
import RotateMoveButtons from './DirectionSetButton/RotateMoveButtons/RotateMoveButtons';
import ZoomButtons from './DirectionSetButton/ZoomButtons/ZoomButtons';
import ProductIndex from './ProductIndex/ProductIndex';

export interface Dimmension {
  length: number;
  width: number;
  height: number;
}
export interface Position {
  x: number;
  y: number;
  z: number;
}
export interface Rotation {
  a: number;
  b: number;
  c: number;
}

export interface ObjectInfo {
  position: Position;
  positionArr?: Position[];
  rotation: Rotation;
  dimmension: Dimmension;
  margin?: number;
  type: 'product' | 'pallet' | 'depthWrite';
}

export interface TCPInfo {
  position: Position;
  rotation: Rotation;
}

export interface SDKProps {
  context: Context;
  moduleRootPath: string;
  robotModel: string;
  showDirection?: boolean;
  showProductIndex?: boolean;
  showRobot?: boolean;
  objectData?: {
    [id: string]: ObjectInfo;
  };
  monitorMotion?: boolean;
  tcp?: TCPInfo;
  inPalletIndex?: number | string;
  outPalletIndex?: number | string;
  inPalletIndexProps?: (index: number | string) => React.ReactNode | string;
  outPalletIndexProps?: (index: number | string) => React.ReactNode | string;
  onTCPRelease?: () => void;
  onTCPCollised?: (
    collisedKeys: string[],
    graspedKey: string[]
  ) => { grapseKeys: string[]; releaseDestination?: number[] };
  camPosition?: Position;
  camTarget?: Position;
  showTCP?: boolean;
  refObject?: any;
  onlyContainsPallets?: boolean;
  isForceRender?: boolean;
}

type SDKState = {
  alignmentStatus: { name: string; isSelect: boolean }[];
  rotateMoveStatus: { isRotate: boolean; isMove: boolean };
};
const initAlignmentStatus = [
  { name: Constants.DIRECTION.FRONT, isSelect: true },
  { name: Constants.DIRECTION.RIGHT, isSelect: false },
  { name: Constants.DIRECTION.LEFT, isSelect: false },
  { name: Constants.DIRECTION.REAR, isSelect: false },
  { name: Constants.DIRECTION.TOP, isSelect: false },
];
const initRotateMoveStatus = { isRotate: false, isMove: false };
export default class NewDisplayViewer extends React.Component<SDKProps, SDKState> {
  private viewer: ViewerManager;
  private urdfTagName: string;
  private viewerRef: React.RefObject<HTMLElement>;
  private resizeObserver: ResizeObserver|null = null;
  constructor(props: SDKProps) {
    super(props);
    this.urdfTagName = `sdk-${generateId(10)}`;
    if (!customElements.get(this.urdfTagName)) {
      customElements.define(this.urdfTagName, class extends URDFManipulator {});
    }
    this.viewerRef = React.createRef();
    this.state = { alignmentStatus: initAlignmentStatus, rotateMoveStatus: initRotateMoveStatus };
  }
  componentDidMount() {
    this.viewer = new ViewerManager(this.props.context);
    this.viewer.initViewer(
      this.viewerRef?.current,
      this.props.objectData || {},
      this.props.monitorMotion,
      this.props.showRobot,
      this.props.isForceRender
    );
    this.viewer.onTCPRelease = this.props.onTCPRelease;
    this.viewer.onTCPCollised = this.props.onTCPCollised;
    this.viewer.changeModel(this.props.robotModel || 'M0609');
    this.setCamera();
    this.viewer.showHideTCP(this.props.showTCP ?? true);
    setTimeout(() => {
      this.resizeObserver = new ResizeObserver(((_) => {
        this.updateDimensionView();
      }).bind(this));

      if(this.viewerRef?.current?.parentElement)
        this.resizeObserver.observe(this.viewerRef?.current?.parentElement);
    },500)
  }
  updateDimensionView = () => {
    if (this.viewerRef?.current?.parentElement) {
      this.viewerRef.current.style.height = this.viewerRef.current?.parentElement.clientHeight + "px"

      if (this.viewer)
        this.viewer.updateSize();
    }
  };
  grasp = (objectId: string) => {
    this.viewer.grasp(objectId);
  };
  release = (objectId: string, x: number, y: number, z: number) => {
    this.viewer.release(objectId, x, y, z);
  };
  componentDidUpdate(prevProps: SDKProps) {
    if (prevProps.robotModel !== this.props.robotModel && this.props.robotModel !== '') {
      this.viewer.changeModel(this.props.robotModel);
    }
    this.viewer.removeHighlight();
    if (prevProps.objectData && this.props.objectData) {
      this.renderObjects(prevProps.objectData, this.props.objectData);
    }
    this.viewer.setHighlight(this.props.inPalletIndex || '', this.props.outPalletIndex || '');
    if (prevProps.camPosition !== this.props.camPosition) {
      this.setCamera();
    }
    if (prevProps.showTCP !== this.props.showTCP) {
      this.viewer.showHideTCP(this.props.showTCP ?? true);
    }
  }
  componentWillUnmount() {
    this.viewer.cleanUpMesh(this.viewer.getScene());
    this.viewer.unRegister();
  }
  renderObjects = (
    lastObjectData: {
      [id: string]: ObjectInfo;
    },
    currentObjectData: {
      [id: string]: ObjectInfo;
    }
  ) => {
    const objectKeyToRemove = Object.keys(lastObjectData).filter((key) => !(key in currentObjectData));
    objectKeyToRemove.forEach((key) => {
      this.viewer.removeObject(key);
    });
    Object.keys(currentObjectData).forEach((key) => {
      if (
        !(key in lastObjectData) ||
        lastObjectData[key].position.x !== currentObjectData[key].position.x ||
        lastObjectData[key].position.y !== currentObjectData[key].position.y ||
        lastObjectData[key].position.z !== currentObjectData[key].position.z ||
        lastObjectData[key].rotation.a !== currentObjectData[key].rotation.a ||
        lastObjectData[key].rotation.b !== currentObjectData[key].rotation.b ||
        lastObjectData[key].rotation.c !== currentObjectData[key].rotation.c ||
        lastObjectData[key].type !== currentObjectData[key].type ||
        lastObjectData[key].dimmension.width !== currentObjectData[key].dimmension.width ||
        lastObjectData[key].dimmension.length !== currentObjectData[key].dimmension.length ||
        lastObjectData[key].dimmension.height !== currentObjectData[key].dimmension.height ||
        lastObjectData[key].margin !== currentObjectData[key].margin
      ) {
        this.viewer.updateObject(key, currentObjectData[key]);
      }
    });
  };

  setAlignment = (name: string) => {
    this.viewer.setAlignment(name);
  };

  setCamera = () => {
    if (this.props.camPosition) {
      this.viewer.setCameraPos(
        this.props.camPosition.x / 100,
        this.props.camPosition.z / 100,
        -this.props.camPosition.y / 100
      );
    }
    if (this.props.camTarget) {
      this.viewer.setCameraTarget(
        this.props.camTarget.x / 100,
        this.props.camTarget.z / 100,
        -this.props.camTarget.y / 100
      );
    }
  };

  handleZoom = (mode: typeof Constants.ZOOM_MODE.IN | typeof Constants.ZOOM_MODE.OUT) => {
    if (mode === Constants.ZOOM_MODE.OUT) {
      this.viewer.clickZoomOut();
    } else {
      this.viewer.clickZoomIn();
    }
  };
  handleClickRotateMove = (type: typeof Constants.MOVE_ROTATE_MODE.MOVE | typeof Constants.MOVE_ROTATE_MODE.ROTATE) => {
    this.setState({
      alignmentStatus: [
        { name: Constants.DIRECTION.FRONT, isSelect: false },
        { name: Constants.DIRECTION.RIGHT, isSelect: false },
        { name: Constants.DIRECTION.LEFT, isSelect: false },
        { name: Constants.DIRECTION.REAR, isSelect: false },
        { name: Constants.DIRECTION.TOP, isSelect: false },
      ],
    });
    if (type === Constants.MOVE_ROTATE_MODE.MOVE) {
      this.viewer.enableRotate(false);
      this.viewer.enableMove(!this.state.rotateMoveStatus.isMove);
      if (this.state.rotateMoveStatus.isMove) {
        this.viewer.changeCursor('default', this.props.moduleRootPath);
      } else {
        this.viewer.changeCursor(Constants.MOVE_ROTATE_MODE.MOVE, this.props.moduleRootPath);
      }
      this.setState((prev) => ({
        rotateMoveStatus: { isRotate: false, isMove: !prev.rotateMoveStatus.isMove },
      }));
    } else {
      this.viewer.enableMove(false);
      this.viewer.enableRotate(!this.state.rotateMoveStatus.isRotate);
      if (this.state.rotateMoveStatus.isRotate) {
        this.viewer.changeCursor('default', this.props.moduleRootPath);
      } else {
        this.viewer.changeCursor(Constants.MOVE_ROTATE_MODE.ROTATE, this.props.moduleRootPath);
      }
      this.setState((prev) => ({
        rotateMoveStatus: { isRotate: !prev.rotateMoveStatus.isRotate, isMove: false },
      }));
    }
  };
  // Set state for Alignment button
  handleClickDirection = (dir: string) => {
    this.setState({ rotateMoveStatus: { ...initRotateMoveStatus } });
    this.viewer.enableMove(false);
    this.viewer.enableRotate(false);
    this.viewer.changeCursor('default', this.props.moduleRootPath);
    const newState = [...this.state.alignmentStatus];
    newState.forEach((item) => {
      if (item.name === dir) {
        item.isSelect = true;
      } else {
        item.isSelect = false;
      }
    });
    this.setState({ alignmentStatus: newState });
    this.viewer.setAlignment(dir);
  };

  render(): React.ReactNode {
    const urdfViewer = React.createElement(this.urdfTagName, {
      ref: this.viewerRef,
      up: 'Z+',
      'display-shadow': true,
      tabindex: 0,
      'ambient-color': '#FAFAFA',
      style: {
        backgroundColor: 'rgba(178,178,178, 1)',
        width: '100%',
        height: '100%',
      },
    });
    const urdfViewerTag = document.querySelector(`#Palletizing_Viewer ${this.urdfTagName}`);
      if (urdfViewerTag) {
        let urdfPath = urdfViewerTag.getAttribute('urdf');
        if (window.navigator.userAgent.toLowerCase().includes('mac os')) {
          if(urdfPath?.includes('../../../') && !urdfPath?.includes('ReplacedMacOs')) {
            urdfPath = urdfPath.replace(/file:\/\/\/\.{2}\/\.{2}\/\.{2}\//, '');
            urdfPath = urdfPath.replace(/\.{2}\/\.{2}\/\.{2}\//, '');
            urdfPath = `file://${urdfPath}?ReplacedMacOs`;
            urdfViewerTag.setAttribute('urdf', urdfPath);
            // Fix bug: urdf-processed event ran after componentDidUpdate so the Pos and target of camera is showing incorrect 
            if (this.props.onlyContainsPallets) {
              setTimeout(() => {
                if (this.props.camPosition && this.props.camTarget) {
                  this.viewer.setKeepCamPos(
                    this.props.camPosition.x / 100,
                    this.props.camPosition.z / 100,
                    -this.props.camPosition.y / 100,
                    this.props.camTarget.x / 100,
                    this.props.camTarget.z / 100,
                    -this.props.camTarget.y / 100,
                  );
                }
              }, 20);
              setTimeout(() => {
                this.setCamera();
              }, 50);
            }            
          }
        }
      }
    return (
      <div
        id={'Palletizing_Viewer'}
        className={classes.background}
      >
        <RotateMoveButtons selectedRotateMove={this.state.rotateMoveStatus} handleClick={this.handleClickRotateMove} />
        <ZoomButtons onZoom={this.handleZoom} />
        {this.props.showProductIndex && (
          <ProductIndex
            indexIn={this.props.inPalletIndex || 0}
            indexOut={this.props.outPalletIndex || 0}
            inPalletIndexProps={this.props.inPalletIndexProps}
            outPalletIndexProps={this.props.outPalletIndexProps}
          />
        )}
        {this.props.showDirection && (
          <DirectionSetButton
            selectedStatus={this.state.alignmentStatus}
            handleClickDirection={this.handleClickDirection}
          />
        )}
        <div id="menu" className="hidden"></div>
        {urdfViewer || ''}
      </div>
    );
  }
}
