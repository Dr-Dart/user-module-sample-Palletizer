/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import LegacyUtils from './legacy/utils.js';
import { CONSTANTS, CONSTANTS as LEGACY_CONSTANT } from './legacy/const.js';
import { STLCustomLoader } from './urdf-util/STLCustomLoader.js';
import { Dimmension, ObjectInfo, Position } from './components/LayoutDisplay/NewDisplayViewer.js';
import { AuthorityState, Context, IAuthorityManager, IPositionManager, IProgramManager, IRobotManager, ProgramState, RobotModel, SixNumArray } from 'dart-api';
import { IMathLibrary } from 'dart-api/dart-api-math';
import {
  Box3, BoxGeometry,
  BufferGeometry, Color, DoubleSide,
  EdgesGeometry, FrontSide, GridHelper,
  Group, LineBasicMaterial, LineSegments,
  Mesh, MeshLambertMaterial,
  MeshPhongMaterial, Object3D, Sphere, Vector3
}
  from 'three';
import Utils from './legacy/utils.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

const urlParams = new URLSearchParams(window.location.search);
const positionParam = urlParams.get('position');
const xyzParam = positionParam ? positionParam.split(',').map(v => parseFloat(v)) : [0, 0, 0];
const DEG2RAD = Math.PI / 180;

class ViewerManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private viewer: any;
  private robotCenter: Vector3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sliders: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private originalNoAutoRecenter: any;
  private visibleRobot: boolean;

  private ids: { [key: string]: number };
  private initData: { [key: string]: ObjectInfo };
  private monitorMotion: boolean;
  private positionManager: IPositionManager;
  private programManager: IProgramManager;
  private mathLibrary: IMathLibrary;

  private graspedKey: string[];
  private highlightIds: (string | number)[];
  private topTcp: Object3D | undefined;
  private topTcpAxes: Object3D | undefined;
  private topTcpGroup: Object3D | undefined;
  private initialDistance: number;
  private preMinLimit: number | undefined;
  private preMaxLimit: number | undefined;
  private didGetPreMinLimit: boolean;
  private didGetPreMaxLimit: boolean;
  private didRotateCamera: boolean;
  private isCamOnTop: boolean;
  private cameraDefaultTarget: number[];
  private topTCPPosition: Vector3;
  private eventZoomIn: WheelEvent;
  private eventZoomOut: WheelEvent;
  private isCheckInitial: boolean;
  private isShowTCP: boolean;
  private isForceRender?: boolean;
  private context: Context;
  private keepCurrentCamPos?: Position | null;
  private keepCurrentCamTarget?: Position | null;
  private robotManager?: IRobotManager;
  private authorityManager ?: IAuthorityManager;
	private timeInterval?: NodeJS.Timer;
  onTCPCollised?:
  (collisedKeys: string[], graspedKey: string[]) => { grapseKeys: string[], releaseDestination?: number[] }
  onTCPRelease?: () => void
  private releaseDestination: number[] | undefined;

  constructor(context: Context) {
    this.robotCenter = new Vector3(0, 0, 0)

    this.sliders = {};
    this.visibleRobot = true;
    this.ids = {}
    this.initData = {};
    this.monitorMotion = false;
    this.context = context;
    this.positionManager = context.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
    this.programManager = context.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;
    this.mathLibrary = context.getSystemLibrary(Context.MATH_LIBRARY) as IMathLibrary;
    this.graspedKey = []
    this.highlightIds = []
    this.initialDistance = 0
    this.preMinLimit = undefined
    this.preMaxLimit = undefined
    this.didGetPreMinLimit = false
    this.didGetPreMaxLimit = false
    this.didRotateCamera = false
    this.isCamOnTop = false
    this.cameraDefaultTarget = []
    this.topTCPPosition = new Vector3()
    this.isForceRender = false;
    this.eventZoomIn = new WheelEvent('wheel', {
      deltaY: -LEGACY_CONSTANT.ZOOM_STEP,
    });
    this.eventZoomOut = new WheelEvent('wheel', {
      deltaY: LEGACY_CONSTANT.ZOOM_STEP,
    });
    this.isCheckInitial = true;
    this.isShowTCP = true;
    this.robotManager = this.context.getSystemManager(
      Context.ROBOT_MANAGER
    ) as IRobotManager;
    this.authorityManager = this.context.getSystemManager(
      Context.AUTHORITY_MANGER
      ) as IAuthorityManager;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initViewer = (viewer: any, initData: { [key: string]: ObjectInfo }, monitorMotion?: boolean, showRobot?: boolean, isForceRender = false) => {
    this.viewer = viewer;
    this.viewer.controls.enableZoom = true;
    this.viewer.controls.enableRotate = false;
    this.viewer.controls.enablePan = false;
    this.viewer.autoRedraw = true;
    this.viewer.highlightColor = '#' + (new Color(0xffffff)).lerp(new Color('#B2B2B2'), 1).getHexString()
    this.initData = initData;
    this.monitorMotion = monitorMotion || false;
    this.visibleRobot = showRobot || false;
    this.isForceRender = isForceRender || false;
    // Disable Panning by RightMouse
    this.viewer.controls.mouseButtons.RIGHT = LEGACY_CONSTANT.DISABLE_MOUSE_MODE;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.viewer.loadMeshFunc = (path: any, manager: any, done: any) => {
      const ext = path.split(/\./g).pop().toLowerCase();
      switch (ext) {
        case 'gltf':
        case 'glb':
          new GLTFLoader(manager).load(
            path,
            result => done(result.scene),
            () => undefined,
            err => done(null, err),
          );
          break;
        case 'obj':
          new OBJLoader(manager).load(
            path,
            result => done(result),
            () => undefined,
            err => done(null, err),
          );
          break;
        case 'dae':
          new ColladaLoader(manager).load(
            path,
            result => done(result.scene),
            () => undefined,
            err => done(null, err),
          );
          break;
        case 'stl':
          new STLCustomLoader(manager).load(
            path,
            (result: BufferGeometry) => {
              const material = new MeshPhongMaterial();
              const mesh = new Mesh(result, material);
              done(mesh);
            },
            () => undefined,
            (err: ErrorEvent) => done(null, err),
          );
          break;
      }
    };
    if (/javascript\/example\/bundle/i.test(window.location)) {
      viewer.package = 'urdf';
    }
    this.viewer.addEventListener('urdf-processed', this.onUrdfProcessed);

    // this.viewer.dragControls.setGrabbed = () => {};
    // this.viewer.dragControls.onHover = () => {};
    // this.viewer.dragControls.onUnhover = () => {};

    this.viewer._updateEnvironment = () => {
      if (!viewer.robot || !viewer.robot.visible) return;
      viewer.world.updateMatrixWorld();
      const bbox = new Box3();
      bbox.setFromObject(viewer.robot);
      const center = this.robotCenter;
      // viewer.controls.target.y = center.y;
      viewer.plane.position.y = bbox.min.y - 1e-3;

      const dirLight = viewer.directionalLight;
      dirLight.castShadow = viewer.displayShadow;

      if (viewer.displayShadow) {

        // Update the shadow camera rendering bounds to encapsulate the
        // model. We use the bounding sphere of the bounding box for
        // simplicity -- this could be a tighter fit.
        const sphere = bbox.getBoundingSphere(new Sphere());
        const minmax = sphere.radius;
        const cam = dirLight.shadow.camera;
        cam.left = cam.bottom = -minmax;
        cam.right = cam.top = minmax;

        // Update the camera to focus on the center of the model so the
        // shadow can encapsulate it
        const offset = dirLight.position.clone().sub(dirLight.target.position);
        dirLight.target.position.copy(center);
        dirLight.position.copy(center).add(offset);

        cam.updateProjectionMatrix();

      }

    };

    // HaoLA3 & HoangDCV - DCIDOOSANDRP-5080/5081 - 16/6/2022 - start
    // Handle Zoom in/Zoom out
    // Listen to Camera change event
    this.viewer.controls.addEventListener('change', () => {
      // set target to camera
      if (this.isCamOnTop) {
        this.topTcp?.getWorldPosition(this.topTCPPosition);
        this.viewer.controls.target.y = this.topTCPPosition.y;
        this.isCamOnTop = false;
      }
      // Get Default Camera target
      if (this.isCheckInitial) {
        this.cameraDefaultTarget = [this.viewer.controls.target.x,
          this.viewer.controls.target.y, this.viewer.controls.target.z];
        this.isCheckInitial = false;
      }

      if (this.didRotateCamera) {
        this.didRotateCamera = false;

        // reset all
        this.initialDistance = this.viewer.controls.getDistance();
        // Max zoom out is 10% which mean: size of max zoom out robot = 0.1 x size of default zoom robot
        // Max zoom in is 400% which mean: size of max zoom in robot = 4 x size of default zoom robot
        // The following summary formula is obtained after proving the manual problem.
        this.viewer.controls.minDistance = this.initialDistance * LEGACY_CONSTANT.RATIO_TO_GET_MIN_ZOOM;
        this.viewer.controls.maxDistance = this.initialDistance * LEGACY_CONSTANT.RATIO_TO_GET_MAX_ZOOM;

        this.preMinLimit = undefined;
        this.preMaxLimit = undefined;
        this.didGetPreMinLimit = false;
        this.didGetPreMaxLimit = false;
      }

      // For store the position before min limit
      if (!this.didGetPreMinLimit &&
          this.viewer.controls.getDistance().toFixed(LEGACY_CONSTANT.AFTER_POINT)
            === this.viewer.controls.minDistance.toFixed(LEGACY_CONSTANT.AFTER_POINT)) {
        this.didGetPreMinLimit = true;
      }
      if (!this.didGetPreMinLimit) {
        this.preMinLimit = this.viewer.controls.getDistance();
      }

      // For store the position before max limit
      if (!this.didGetPreMaxLimit &&
          this.viewer.controls.getDistance().toFixed(LEGACY_CONSTANT.AFTER_POINT)
            === this.viewer.controls.maxDistance.toFixed(LEGACY_CONSTANT.AFTER_POINT)) {
        this.didGetPreMaxLimit = true;
      }
      if (!this.didGetPreMaxLimit) {
        this.preMaxLimit = this.viewer.controls.getDistance();
      }

      // Logic to comeback the position before min/max limit
      if (this.viewer.controls.getDistance().toFixed(LEGACY_CONSTANT.AFTER_POINT)
            === this.viewer.controls.minDistance.toFixed(LEGACY_CONSTANT.AFTER_POINT)
          && this.preMinLimit) {
        const minDivPreMin = this.viewer.controls.minDistance / this.preMinLimit;
        const speedAtMinLimit = Math.log(minDivPreMin) / Math.log(LEGACY_CONSTANT.LIB_BASE_SPEED);
        this.viewer.controls.zoomSpeed = speedAtMinLimit;
      } else if (this.viewer.controls.getDistance().toFixed(LEGACY_CONSTANT.AFTER_POINT)
                  === this.viewer.controls.maxDistance.toFixed(LEGACY_CONSTANT.AFTER_POINT)
                && this.preMaxLimit) {
        const maxDivMaxDis = this.preMaxLimit / this.viewer.controls.maxDistance;
        const speedAtMaxLimit = Math.log(maxDivMaxDis) / Math.log(LEGACY_CONSTANT.LIB_BASE_SPEED);
        this.viewer.controls.zoomSpeed = speedAtMaxLimit;
      } else {
        this.viewer.controls.zoomSpeed = LEGACY_CONSTANT.DEFAULT_SPEED;
      }
      // For Tester
      console.log('Current Zoom: ' +
        (this.initialDistance / this.viewer.controls.getDistance() * 100).toFixed(2) + '%');
    });
    this.viewer.triggerRequestFrame();
    this.authorityManager?.authorityState.register(this.context, this.authorityCallback);
    this.changeModel(this.robotManager?.getRobotModel() || 'M0609');
  }

  authorityCallback = (data: AuthorityState) => {
    if (data === AuthorityState.GRANT) {
      let robotModelStr = this.robotManager?.getRobotModel();
      this.timeInterval = setInterval(() => {
        robotModelStr = this.robotManager?.getRobotModel();
        if (robotModelStr !== '') {
          clearInterval(this.timeInterval);
          this.changeModel(robotModelStr);
        }
      }, 500);
    }
  };

  changeModel = (modelName = 'M0609') => {
    let urdfPath = this.robotManager?.getModelFilePath(modelName as RobotModel);
    if (!urdfPath) {
      return;
      }
    urdfPath = `file:///${urdfPath}`;
    this.viewer.urdf = urdfPath;
  };

  // Sync wheel and click
  clickZoomIn = () => {
    this.viewer.controls.domElement.dispatchEvent(this.eventZoomIn);
  };
  clickZoomOut = () => {
    this.viewer.controls.domElement.dispatchEvent(this.eventZoomOut);
  };

  // HoangDCV - DCIDOOSANDRP-5082 US-046 Rotate - Start
  enableRotate = (isRotate: boolean) => {
    this.viewer.controls.enableRotate = isRotate;
    this.viewer.controls.mouseButtons.LEFT =
      isRotate ? LEGACY_CONSTANT.ROTATE_MOUSE_MODE : LEGACY_CONSTANT.DISABLE_MOUSE_MODE;
  };
  enableMove = (isMove: boolean) => {
    this.viewer.controls.enablePan = isMove;
    this.viewer.controls.mouseButtons.LEFT =
      isMove ? LEGACY_CONSTANT.MOVE_MOUSE_MODE : LEGACY_CONSTANT.DISABLE_MOUSE_MODE;
  };
  setDefaultTarget = () => {
    if (!this.isCheckInitial) {
      this.viewer.controls.target =
        new Vector3(this.cameraDefaultTarget[0], this.cameraDefaultTarget[1], this.cameraDefaultTarget[2]);
    }
  };
  changeCursor = (typeCursor: string, path: string) => {
    if (typeCursor === LEGACY_CONSTANT.MOVE) {
      this.viewer.style.cursor =
        `url("../../../${path}/assets/cursors/Panning.cur"), auto`;
    } else if (typeCursor === LEGACY_CONSTANT.ROTATE) {
      this.viewer.style.cursor =
        `url("../../../${path}/assets/cursors/Rotation.cur"), auto`;
    } else {
      this.viewer.style.cursor = 'default';
    }
  };
  // HoangDCV - DCIDOOSANDRP-5082 US-046 Rotate - End


  programStateCallback = (data: ProgramState) => {
    if (data === ProgramState.STOP) {
      this.graspedKey = [];
    }
  }
  clearViewer = () => {
    this.viewer.removeEventListener('urdf-processed', this.onUrdfProcessed)
  }
  private onUrdfProcessed = () => {
    this.robotCenter = this.getRobotCenter();
    const r = this.viewer.robot;
    r.visible = this.visibleRobot;
    r.position.set(xyzParam[0] * LEGACY_CONSTANT.SCALE,
      xyzParam[1] * LEGACY_CONSTANT.SCALE,
      xyzParam[2] * LEGACY_CONSTANT.SCALE
    );
    this.onOffGrid(true);
    if (this.visibleRobot) {
      this.createBaseTCP();
      this.updateTCP(this.positionManager.getToolPos())
      this.showHideTCP(this.isShowTCP);
      this.positionManager.toolPosition.register(this.context, this.updateTCP);
    }
    this.setAlignment(LEGACY_CONSTANT.FRONT_DIR);
    Object.keys(this.initData).forEach(key => this.renderObject(key, this.initData[key]));
    if (this.monitorMotion) {
      this.positionManager.jointPose.register(this.context, this.updateAngles)
      this.programManager.programState.register(this.context, this.programStateCallback);
    }
    this.positionManager.getCurrentPos(0).then((targetPosj: SixNumArray) => {
      this.updateAngles(Object.values(targetPosj as unknown as { [key: string]: number }) as SixNumArray);
    });
    this.viewer.controls.target.y = this.robotCenter.y;
  }
  private updateAngles = (targetPosj: SixNumArray) => {
    targetPosj.forEach((joinAngle: number, index: number) => {
      this.viewer.setJointValue(`J${index + 1}`, joinAngle * Math.PI / 180);
    });
    if (document.hidden && this.isForceRender) {
      this.viewer.forceRender(this.isForceRender);
    }
  };
  private createBaseTCP = () => {
    const baseMesh = this.viewer.world.getObjectByName('base');
    this.viewer['baseAxis'] = LegacyUtils.buildAxes(baseMesh.position,
      LEGACY_CONSTANT.TCP_LENGTH_LONG,
      LEGACY_CONSTANT.TCP_LENGTH_LONG,
      LEGACY_CONSTANT.TCP_LENGTH_SHORT
    );
    this.viewer['baseAxis'].position.z += 0.01;
    baseMesh.add(this.viewer['baseAxis']);
  };

  private getRobotCenter = () => {
    const bbox = new Box3();
    bbox.setFromObject(this.viewer.robot);
    return bbox.getCenter(new Vector3());
  };

  setCameraTarget = (x: number, y: number, z: number) => {
    this.viewer.controls.target.set(x, y, z);
    this.viewer.camera.lookAt(x, y, z);
  };

  setCameraPos = (x: number, y: number, z: number) => {
    this.viewer.camera.position.set(x, y, z);
    this.didRotateCamera = true;
  };

  showRobot = () => {
    this.visibleRobot = true;
    if (this.viewer.robot) {
      this.viewer.robot.visible = true;
    }
  };

  onOffGrid = (isOn: boolean) => {
    if (!this.viewer.grid) {
      this.viewer.grid = new GridHelper(200, 20, '#878787', '#878787');
    }
    if (isOn) {
      this.viewer.scene.add(this.viewer.grid);
    } else {
      this.viewer.scene.remove(this.viewer.grid);
    }
    this.viewer.redraw();
  };

  // changeModel = (modelName: string, path: string) => {
  //   const urdfPath = `${path}urdf/${modelName}/urdf/${modelName}_flipped.URDF`;
  //   this.viewer.urdf = urdfPath;
  // };

  setKeepCamPos = (x: number, y: number, z: number, xT: number, yT: number, zT: number) => {
    this.keepCurrentCamPos = { x, y, z };
    this.keepCurrentCamTarget = { x: xT, y: yT, z: zT };
  }

  setAlignment = (direction: string, dontSetCamPos?: boolean) => {
    switch (direction) {
      case LEGACY_CONSTANT.RIGHT_DIR:
        this.setCameraPos(0, this.robotCenter.y + 1 + LEGACY_CONSTANT.TCP_LENGTH_SHORT, LEGACY_CONSTANT.CAMERA_POS_Z);
        this.setDefaultTarget();
        this.isCamOnTop = false;
        break;
      case LEGACY_CONSTANT.LEFT_DIR:
        this.setCameraPos(0, this.robotCenter.y + 1 + LEGACY_CONSTANT.TCP_LENGTH_SHORT, -LEGACY_CONSTANT.CAMERA_POS_Z);
        this.setDefaultTarget();
        this.isCamOnTop = false;
        break;
      case LEGACY_CONSTANT.REAR_DIR:
        this.setCameraPos(-LEGACY_CONSTANT.CAMERA_POS_X, this.robotCenter.y + 1 + LEGACY_CONSTANT.TCP_LENGTH_SHORT, 0);
        this.setDefaultTarget();
        this.isCamOnTop = false;
        break;
      case LEGACY_CONSTANT.TOP_DIR:
        this.setCameraPos(0.01, (this.robotCenter.y + 1.5 + LEGACY_CONSTANT.TCP_LENGTH_SHORT) * 2, 0);
        this.viewer.controls.target = new Vector3(0, this.robotCenter.y, 0);
        this.isCamOnTop = true;
        break;
      case LEGACY_CONSTANT.FRONT_DIR:
      default:
        this.setCameraPos(LEGACY_CONSTANT.CAMERA_POS_X, this.robotCenter.y + 1 + LEGACY_CONSTANT.TCP_LENGTH_SHORT, 0);
        this.setDefaultTarget();
        this.isCamOnTop = false;
        if (this.keepCurrentCamPos && this.keepCurrentCamTarget) {
          setTimeout(() => {
            if (this.keepCurrentCamPos && this.keepCurrentCamTarget) {
              this.setCameraPos(this.keepCurrentCamPos.x, this.keepCurrentCamPos.y, this.keepCurrentCamPos.z);
              this.setCameraTarget(this.keepCurrentCamTarget.x, this.keepCurrentCamTarget.y, this.keepCurrentCamTarget.z);
              this.keepCurrentCamPos = null;
              this.keepCurrentCamTarget = null;
            }
          }, 50);
        }
        break;
    }
  };

  //#endregion VuLN1 - 09/06/2022 - Window function - End
  private createGeometry = (objectInfo: ObjectInfo): BoxGeometry => {
    const geo = new BoxGeometry(objectInfo.dimmension.width * LEGACY_CONSTANT.SCALE,
      objectInfo.dimmension.length * LEGACY_CONSTANT.SCALE,
      objectInfo.dimmension.height * LEGACY_CONSTANT.SCALE);
    if (objectInfo.type === 'product') {
      geo.translate(0, 0, - objectInfo.dimmension.height / 2 * LEGACY_CONSTANT.SCALE)
    } else if (objectInfo.type === 'pallet') {
      geo.translate(objectInfo.dimmension.width / 2 * LEGACY_CONSTANT.SCALE,
        objectInfo.dimmension.length / 2 * LEGACY_CONSTANT.SCALE,
        - objectInfo.dimmension.height / 2 * LEGACY_CONSTANT.SCALE)
    }
    return geo
  }

  private createMarginLine = (dimension: Dimmension, lineColor: string) => {
    const dashedBorder = Utils.drawTopBorder(
      dimension.width * LEGACY_CONSTANT.SCALE,
      dimension.length * LEGACY_CONSTANT.SCALE,
      dimension.height * LEGACY_CONSTANT.SCALE,
      lineColor,
      true
    );

    const border = Utils.drawTopBorder(
      dimension.width * LEGACY_CONSTANT.SCALE,
      dimension.length * LEGACY_CONSTANT.SCALE,
      dimension.height * LEGACY_CONSTANT.SCALE,
      lineColor,
      false
    );
    return [dashedBorder, border];
  }

  private addMarginLineToOutPallet = (objectInfo: ObjectInfo, objectCube: Mesh) => {
    if (objectInfo.margin) {
      let lineColor: string;
      if (objectInfo.margin > 0) {
        lineColor = CONSTANTS.OVERHANG_LINE_COLOR;
      } else {
        lineColor = CONSTANTS.UNDERHANG_LINE_COLOR;
      }
      const marginLineDimension = {
        height: objectInfo.dimmension.height,
        width: objectInfo.dimmension.width + objectInfo.margin * 2 + 1,
        length: objectInfo.dimmension.length + objectInfo.margin * 2 + 1,
      }
      const [dashedBorder, border] = this.createMarginLine(
        marginLineDimension,
        lineColor
      );

      dashedBorder.forEach(item => {
        item.translateX(objectInfo.dimmension.width / 2 * LEGACY_CONSTANT.SCALE);
        item.translateY(objectInfo.dimmension.length / 2 * LEGACY_CONSTANT.SCALE);
        item.translateZ(-objectInfo.dimmension.height / 2 * LEGACY_CONSTANT.SCALE + 0.01);
        item.renderOrder = 1;
        objectCube.add(item);
      });

      border.forEach(item => {
        item.translateX(objectInfo.dimmension.width / 2 * LEGACY_CONSTANT.SCALE);
        item.translateY(objectInfo.dimmension.length / 2 * LEGACY_CONSTANT.SCALE);
        item.translateZ(-objectInfo.dimmension.height / 2 * LEGACY_CONSTANT.SCALE + 0.01);
        objectCube.add(item);
      });

      console.log('Line color: ', lineColor);

    }
  }

  private removeMarginLine = (objectCube: Mesh) => {
    while(objectCube.children.length !== 1) {
      objectCube.children.pop();
    }
  }

  renderObject = (id: string, objectInfo: ObjectInfo) => {
    if (id in this.ids) {
      return;
    }
    const productGeometry = this.createGeometry(objectInfo);
    const material = new MeshLambertMaterial();
    if (objectInfo.type === 'product') {
      if (this.highlightIds.includes(id)) {
        material.color = new Color(LEGACY_CONSTANT.FILL_COLOR);
        material.transparent = true;
        material.opacity = 0.8;
        material.side = DoubleSide;
      } else {
        material.color = LEGACY_CONSTANT.PRODUCT_COLOR;
        material.transparent = false;
        material.opacity = 1;
        material.side = FrontSide;
      }
    } else if (objectInfo.type === 'pallet') {
      material.color = LEGACY_CONSTANT.PALLET_COLOR;
    }
    const objectCube = new Mesh(productGeometry, material);
    if (objectInfo.type === 'pallet') {
      const axes = LegacyUtils.buildAxes(new Vector3(0, 0, 0),
        LEGACY_CONSTANT.TCP_LENGTH_SHORT,
        LEGACY_CONSTANT.TCP_LENGTH_SHORT,
        LEGACY_CONSTANT.TCP_LENGTH_SHORT);
      objectCube.add(axes);
      this.removeMarginLine(objectCube);
      if (objectInfo.margin) {
        this.addMarginLineToOutPallet(objectInfo, objectCube);
      }
    } else if (objectInfo.type === 'product') {
      const edges = new EdgesGeometry(productGeometry);
      const line = new LineSegments(edges,
        new LineBasicMaterial({
          color: new Color('grey'),
          linewidth: 30,
          linecap: 'round',
          linejoin: 'round',
          fog: true,
          alphaToCoverage: true,
        }));
      line.name = LEGACY_CONSTANT.DEFAULT_LINE;
      objectCube.add(line);
      const topCenterPoint = LegacyUtils.buildDot(LEGACY_CONSTANT.TCP_COLOR);
      topCenterPoint.name = `${LEGACY_CONSTANT.TOP_CENTER_POINT}${id}`;
      topCenterPoint.visible = false;
      objectCube.add(topCenterPoint);
    }
    objectCube.position.set(objectInfo.position.x * LEGACY_CONSTANT.SCALE,
      objectInfo.position.y * LEGACY_CONSTANT.SCALE,
      objectInfo.position.z * LEGACY_CONSTANT.SCALE);
    objectCube.rotateZ(objectInfo.rotation.a * (Math.PI / 180))
    objectCube.rotateY(objectInfo.rotation.b * (Math.PI / 180))
    objectCube.rotateZ(objectInfo.rotation.c * (Math.PI / 180))
    objectCube.name = id;
    this.viewer.world.add(objectCube);
    this.ids[id] = objectCube.id;
  }
  removeObject = (id: string) => {
    this.viewer.world.getObjectById(this.ids[id])?.removeFromParent();
    delete this.ids[id];
  }
  updateObject = (id: string, objectInfo: ObjectInfo) => {
    if (id in this.ids) {
      const objectCube = this.viewer.world.getObjectById(this.ids[id]);
      objectCube.position.set(objectInfo.position.x * LEGACY_CONSTANT.SCALE,
        objectInfo.position.y * LEGACY_CONSTANT.SCALE,
        objectInfo.position.z * LEGACY_CONSTANT.SCALE);
      objectCube.rotation.set(0, 0, 0);
      objectCube.rotateZ(objectInfo.rotation.a * (Math.PI / 180))
      objectCube.rotateY(objectInfo.rotation.b * (Math.PI / 180))
      objectCube.rotateZ(objectInfo.rotation.c * (Math.PI / 180))
      objectCube.geometry = this.createGeometry(objectInfo);
      if (objectInfo.type === 'product') {
        objectCube.getObjectByName(LEGACY_CONSTANT.DEFAULT_LINE)?.removeFromParent();
        const edges = new EdgesGeometry(objectCube.geometry);
        const line = new LineSegments(edges,
          new LineBasicMaterial({
            color: new Color('grey'),
            linewidth: 30,
            linecap: 'round',
            linejoin: 'round',
            fog: true,
            alphaToCoverage: true,
          }));
        line.name = LEGACY_CONSTANT.DEFAULT_LINE;
        objectCube.add(line);
      }
      if (objectInfo.type === 'product') {
        if (this.highlightIds.includes(id)) {
          objectCube.material.color = new Color(LEGACY_CONSTANT.FILL_COLOR);
          objectCube.material.transparent = true;
          objectCube.material.opacity = 0.8;
          objectCube.material.side = DoubleSide;
        } else {
          objectCube.material.color = LEGACY_CONSTANT.PRODUCT_COLOR;
          objectCube.material.transparent = false;
          objectCube.material.opacity = 1;
          objectCube.material.side = FrontSide;
        }
      } else if (objectInfo.type === 'pallet') {
        objectCube.material.color = LEGACY_CONSTANT.PALLET_COLOR;
        this.removeMarginLine(objectCube);
        if (objectInfo.margin) {
          this.addMarginLineToOutPallet(objectInfo, objectCube);
        }
      }
    } else {
      this.renderObject(id, objectInfo);
    }
  }
  updateTCP = (currentTCP: SixNumArray) => {
    if (!this.topTcpGroup) {
      this.topTcpGroup = new Group();
      this.viewer.world.add(this.topTcpGroup);
    }
    if (!this.topTcp) {
      const obj = LegacyUtils.buildDot('#9a9a9a');
      this.topTcp = obj;
      this.topTcpGroup.add(this.topTcp)
      // this.viewer.world.add(new Box3Helper(new Box3().setFromObject(obj),LEGACY_CONSTANT.PALLET_COLOR))
    }
    if (!this.topTcpAxes) {
      const axes = LegacyUtils.buildAxes(new Vector3(0, 0, 0),
        LEGACY_CONSTANT.TCP_LENGTH_SHORT,
        LEGACY_CONSTANT.TCP_LENGTH_SHORT,
        LEGACY_CONSTANT.TCP_LENGTH_SHORT
      );
      this.topTcpAxes = axes;
      this.topTcpGroup.add(axes);
    }
    this.topTcpGroup.position.set(currentTCP[0] * LEGACY_CONSTANT.SCALE,
      currentTCP[1] * LEGACY_CONSTANT.SCALE,
      currentTCP[2] * LEGACY_CONSTANT.SCALE);
    this.topTcpGroup.rotation.set(0, 0, 0);
    this.topTcpGroup.rotateZ(currentTCP[3] * DEG2RAD);
    this.topTcpGroup.rotateY(currentTCP[4] * DEG2RAD);
    this.topTcpGroup.rotateX(currentTCP[5] * DEG2RAD);
  }
  unRegister = () => {
    this.positionManager.jointPose.unregister(this.context, this.updateAngles)
    this.positionManager.toolPosition.unregister(this.context, this.updateTCP)
    this.programManager.programState.unregister(this.context, this.programStateCallback);
  }
  removeHighlight = () => {
    this.highlightIds.forEach(id => {
      const obj = this.viewer.world.getObjectById(this.ids[id]);
      if (obj) {
        obj.material.color = LEGACY_CONSTANT.PRODUCT_COLOR;
        obj.material.transparent = false;
        obj.material.opacity = 1;
        obj.material.side = FrontSide;
        const topCenter = this.viewer.world.getObjectByName(`${LEGACY_CONSTANT.TOP_CENTER_POINT}${obj.name}`)
        topCenter.visible = false;
      }
    })
    this.highlightIds = [];
  }
  setHighlight = (...objectIds: (string | number)[]) => {
    objectIds.forEach((id) => {
      const obj = this.viewer.world.getObjectById(this.ids[id]);
      if (obj) {
        obj.material.color = new Color(LEGACY_CONSTANT.FILL_COLOR);
        obj.material.transparent = true;
        obj.material.opacity = 0.8;
        obj.material.side = DoubleSide;
        if(obj.name.indexOf('in-product') !== -1) {
          const topCenter = this.viewer.world.getObjectByName(`${LEGACY_CONSTANT.TOP_CENTER_POINT}${obj.name}`)
          topCenter.visible = true;
        }
      }
    });
    this.highlightIds = objectIds;
  }

  showHideTCP = (isShow: boolean) => {
    this.isShowTCP = isShow;
    if(this.topTcpGroup) {
      this.topTcpGroup.visible = isShow;
    }
  }

  grasp = (objectId:string)=>{
    const obj = this.viewer.world.getObjectById(this.ids[objectId]);
    if(obj){
      this.topTcp?.attach(obj);
    }
  }

  release = (objectId:string, x: number, y: number, z: number)=>{
    const obj = this.topTcp?.getObjectById(this.ids[objectId]);
    if(obj){
      this.viewer.world.attach(obj);
      obj.position.set(
        x * LEGACY_CONSTANT.SCALE,
        y * LEGACY_CONSTANT.SCALE,
        z * LEGACY_CONSTANT.SCALE
      );
    }

  }

  cleanUpMesh = (obj: any) => {
    if (!obj) {
      return;
    }
    if (obj.children.length > 0) {
      for (let x = obj.children.length - 1; x >= 0; x--) {
        this.cleanUpMesh(obj.children[x]);
      }
    }
    obj.geometry && obj.geometry.dispose();
    obj.material && obj.material.dispose();
    obj.dispose && obj.dispose();
    obj.parent?.remove(obj);
    this.viewer?.redraw();
  };

  updateSize = () => {
    if (this.viewer)
      this.viewer.updateSize();
  }

  getScene = () => {
    return this.viewer?.scene;
  }
}
export default ViewerManager;
