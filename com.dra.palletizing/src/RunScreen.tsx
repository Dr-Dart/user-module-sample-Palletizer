/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Container, Grid, Typography } from '@mui/material';
import { Context, IProgramManager, ProgramState } from 'dart-api';
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Coordinate, IN_PALLET_PRODUCT_PREFIX, NUMBER_OF_DECIMAL_DEGREE, OUT_PALLET_PRODUCT_PREFIX } from './consts';
import { DRL_TEMPLATE } from './drlScript';
import { setRunning } from './redux/RunSlice';
import { ObjectInfo, SDKViewer } from './sdk';
import {
  calculatorSimulation,
  checkErrorOnCalib,
  checkErrorOnInPallet,
  checkErrorOnProductInfo,
  generateInFeederPallet,
  generateOutFeederPallet,
  isKeyForError,
  parseStringToFloat
} from './util';
import { RunMapStateToProps } from './type';
import { calcAppRetPosArr } from './CoorCalculation';
import { ModuleContext } from './ModuleContext';
import { TFunction, withTranslation } from 'react-i18next';
import PalletStyles from './assets/styles/style.scss';
import SetDeviceStyles from './assets/styles/setDeviceScreen.scss';
export interface RunProps {
  isHidden: boolean;
  productInformation: any;
  inPalletInformation: any;
  outPalletInformation: any;
  calibrationInformation: any;
  gripperInformation: any;
  pickPlaceInformation: any;
  setRunning: (action: {
    payload: {
      running: boolean;
    };
  }) => void;
  runProgram: (data: any) => void;
  moduleRootPath: string;
  robotModel: string;
  projectId: string;
  isShowSDK: boolean;
  t: TFunction;
}
interface RunState {
  requestRun: boolean;
  allTopCenterIn: {
    [key: string]: ObjectInfo;
  };
  allTopCenterOut: {
    [key: string]: ObjectInfo;
  };
  previousProgramState: ProgramState;
  currentProductKey: string;
  placedItems: string[];
  canGrasp: boolean;
  graspIndex: number;
  running: boolean;
}
class RunScreen extends React.Component<RunProps, RunState> {
  private programManager: IProgramManager;
  private SDKViewerScreen: React.RefObject<any>;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: RunProps) {
    super(props);
    this.state = {
      requestRun: false,
      allTopCenterIn: {},
      allTopCenterOut: {},
      previousProgramState: ProgramState.STOP,
      currentProductKey: '',
      placedItems: [],
      canGrasp: false,
      graspIndex: 0,
      running: false
    };
    this.SDKViewerScreen = React.createRef();
  }
  componentDidMount() {
    this.programManager = this.context.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;
    this.programManager.programState.register(this.context, this.programStateCallback);
    this.programManager.userLog.register(this.context, this.userLogCallBack);
  }
  componentWillUnmount() {
    this.programManager.programState.unregister(this.context, this.programStateCallback);
    this.programManager.userLog.unregister(this.context, this.userLogCallBack);
  }
  userLogCallBack = (data: string) => {
    const index = Object.keys(this.state.allTopCenterIn).length - 1 - this.state.graspIndex;
    if (data === 'grasp_gripper') {
      this.SDKViewerScreen.current.grasp(`${IN_PALLET_PRODUCT_PREFIX}${index}`);
    } else if (data === 'release_gripper') {
      const objectRelease = this.state.allTopCenterOut[`${OUT_PALLET_PRODUCT_PREFIX}${this.state.graspIndex + 1}`];
      this.SDKViewerScreen.current.release(
        `${IN_PALLET_PRODUCT_PREFIX}${index}`,
        objectRelease.position.x,
        objectRelease.position.y,
        objectRelease.position.z
      );
      this.setState({
        graspIndex: this.state.graspIndex + 1,
        currentProductKey: `${IN_PALLET_PRODUCT_PREFIX}${index - 1}`
      });
    }
  };

  programStateCallback = (data: ProgramState) => {
    if (data === ProgramState.PLAY && this.state.previousProgramState !== ProgramState.HOLD) {
      // TODO Resumse
      this.setState({
        graspIndex: 0
      });
    } else if (data === ProgramState.STOP || data === ProgramState.NONE) {
      this.setState(
        {
          requestRun: false,
          canGrasp: false,
          running: false
        },
        () => {
          this.props.setRunning({
            payload: {
              running: false
            }
          });
        }
      );
    }
    this.setState({
      previousProgramState: data
    });
  };

  componentDidUpdate(prevProps: RunProps, _: RunState) {
    if (prevProps.isHidden !== this.props.isHidden && !this.props.isHidden) {
      this.programManager.getProgramState().then((programState) => {
        // Sometime ProgramState = 3, it's reason not check equal STOP
        if (programState !== ProgramState.PLAY && programState !== ProgramState.HOLD) {
          let allTopCenterIn = {};
          let allTopCenterInKeys = [] as string[];
          let currentProductKey = '';
          let allTopCenterOut = {};
          const { loadedProduct } = calculatorSimulation(
            this.props.productInformation,
            this.props.outPalletInformation,
            this.props.inPalletInformation
          );
          if (
            !checkErrorOnInPallet(this.props.inPalletInformation) &&
            !checkErrorOnProductInfo(this.props.productInformation)
          ) {
            allTopCenterIn = generateInFeederPallet(this.props.productInformation, this.props.inPalletInformation);
            allTopCenterInKeys = Object.keys(allTopCenterIn);
            currentProductKey = allTopCenterInKeys[allTopCenterInKeys.length - 1];
          }
          if (
            loadedProduct !== 'N/A' &&
            !checkErrorOnProductInfo(this.props.productInformation) &&
            !checkErrorOnCalib(this.props.calibrationInformation)
          ) {
            allTopCenterOut = generateOutFeederPallet(
              this.props.productInformation,
              this.props.inPalletInformation,
              this.props.outPalletInformation,
              this.props.calibrationInformation
            );
          }
          this.setState({
            allTopCenterIn,
            currentProductKey,
            allTopCenterOut
          });
        }
      });
    }
  }
  isGripperError = () => {
    const { gripperInformation } = this.props;
    for (const [key, value] of Object.entries(gripperInformation)) {
      if (isKeyForError(key) && value !== '') {
        return true;
      }
    }
    return false;
  };

  isOutPalletError = () => {
    let hasError =
      this.props.outPalletInformation.lengthError !== '' ||
      this.props.outPalletInformation.widthError !== '' ||
      this.props.outPalletInformation.boxPaddingError !== '' ||
      this.props.outPalletInformation.maxLayerError !== '';
    if (this.props.outPalletInformation.useOverhangUnderhang) {
      if (this.props.outPalletInformation.isOverhang) {
        hasError = hasError || this.props.outPalletInformation.overhangError !== '';
      } else {
        hasError = hasError || this.props.outPalletInformation.underhangError !== '';
      }
    }
    return hasError;
  };

  isProductError = () => {
    const { productInformation } = this.props;
    for (const [key, value] of Object.entries(productInformation)) {
      if (isKeyForError(key) && value !== '') {
        return true;
      }
    }
    return false;
  };

  isInPalletError = () => {
    type InPalletErrorAttribute =
      | 'lengthError'
      | 'widthError'
      | 'rowError'
      | 'columnError'
      | 'layerError'
      | 'x1Error'
      | 'x2Error'
      | 'x3Error'
      | 'y1Error'
      | 'y2Error'
      | 'y3Error'
      | 'z1Error'
      | 'z2Error'
      | 'z3Error'
      | 'a1Error'
      | 'a2Error'
      | 'a3Error'
      | 'b1Error'
      | 'b2Error'
      | 'b3Error'
      | 'c1Error'
      | 'c2Error'
      | 'c3Error';
    type InPalletAttribute =
      | 'posX1'
      | 'posX2'
      | 'posX3'
      | 'posY1'
      | 'posY2'
      | 'posY3'
      | 'posZ2'
      | 'posZ3'
      | 'posA1'
      | 'posA2'
      | 'posA3'
      | 'posB1'
      | 'posB2'
      | 'posB3'
      | 'posC1'
      | 'posC2'
      | 'posC3';
    const inPalletErrorAttribute: InPalletErrorAttribute[] = [
      'lengthError',
      'widthError',
      'rowError',
      'columnError',
      'layerError',
      'x1Error',
      'x2Error',
      'x3Error',
      'y1Error',
      'y2Error',
      'y3Error',
      'z1Error',
      'z2Error',
      'z3Error',
      'a1Error',
      'a2Error',
      'a3Error',
      'b1Error',
      'b2Error',
      'b3Error',
      'c1Error',
      'c2Error',
      'c3Error'
    ];
    const inPalletAttribute: InPalletAttribute[] = [
      'posX1',
      'posX2',
      'posX3',
      'posY1',
      'posY2',
      'posY3',
      'posZ2',
      'posZ3',
      'posA1',
      'posA2',
      'posA3',
      'posB1',
      'posB2',
      'posB3',
      'posC1',
      'posC2',
      'posC3'
    ];
    return (
      inPalletAttribute.some((item: InPalletAttribute) => {
        return this.props.inPalletInformation[item]?.length === 0;
      }) ||
      inPalletErrorAttribute.some((item: InPalletErrorAttribute) => {
        return this.props.inPalletInformation[item].length > 0;
      })
    );
  };
  isErrorOriginPosition = () => {
    return (
      this.props.calibrationInformation.calibPosXMsg.length > 0 ||
      this.props.calibrationInformation.calibPosYMsg.length > 0 ||
      this.props.calibrationInformation.calibPosZMsg.length > 0
    );
  };

  isAnyOriginEmptyValue = () => {
    return (
      this.props.calibrationInformation.calibPosX === '' ||
      this.props.calibrationInformation.calibPosY === '' ||
      this.props.calibrationInformation.calibPosZ === ''
    );
  };

  isOriginError = () => {
    return this.isErrorOriginPosition() || this.isAnyOriginEmptyValue();
  };
  isMsgPoint1HasValue = () => {
    return (
      this.props.calibrationInformation.calibOptX1Msg.length > 0 ||
      this.props.calibrationInformation.calibOptY1Msg.length > 0 ||
      this.props.calibrationInformation.calibOptZ1Msg.length > 0
    );
  };

  isAnyPoint1EmptyValue = () => {
    return (
      this.props.calibrationInformation.calibOptX1 === '' ||
      this.props.calibrationInformation.calibOptY1 === '' ||
      this.props.calibrationInformation.calibOptZ1 === ''
    );
  };

  isPoint1Error = () => {
    return this.isMsgPoint1HasValue() || this.isAnyPoint1EmptyValue();
  };
  isMsgPoint2HasValue = () => {
    return (
      this.props.calibrationInformation.calibOptX2Msg.length > 0 ||
      this.props.calibrationInformation.calibOptY2Msg.length > 0 ||
      this.props.calibrationInformation.calibOptZ2Msg.length > 0
    );
  };
  isAnyPoint2EmptyValue = () => {
    return (
      this.props.calibrationInformation.calibOptX2 === '' ||
      this.props.calibrationInformation.calibOptY2 === '' ||
      this.props.calibrationInformation.calibOptZ2 === ''
    );
  };
  isPoint2Error = () => {
    return this.isPoint1Error() || this.isAnyPoint2EmptyValue();
  };

  isCalibrationError = () => {
    return this.isOriginError() || this.isPoint1Error() || this.isPoint2Error();
  };

  isPosJMsgFirstGroupHasValue = () => {
    return (
      this.props.pickPlaceInformation.iniPosJ1Msg.length > 0 ||
      this.props.pickPlaceInformation.iniPosJ2Msg.length > 0 ||
      this.props.pickPlaceInformation.iniPosJ3Msg.length > 0
    );
  };

  isPosJMsgSecondGroupHasValue = () => {
    return (
      this.props.pickPlaceInformation.iniPosJ4Msg.length > 0 ||
      this.props.pickPlaceInformation.iniPosJ5Msg.length > 0 ||
      this.props.pickPlaceInformation.iniPosJ6Msg.length > 0
    );
  };

  isIniPosJMsgHasValue = () => {
    return this.isPosJMsgFirstGroupHasValue() || this.isPosJMsgSecondGroupHasValue();
  };
  isPickApproachError = () => {
    return (
      this.props.pickPlaceInformation.pickCustomApproachPosXMsg.length > 0 ||
      this.props.pickPlaceInformation.pickCustomApproachPosYMsg.length > 0 ||
      this.props.pickPlaceInformation.pickCustomApproachPosZMsg.length > 0
    );
  };
  isPickRetractError = () => {
    return (
      this.props.pickPlaceInformation.pickCustomRetractPosXMsg.length > 0 ||
      this.props.pickPlaceInformation.pickCustomRetractPosYMsg.length > 0 ||
      this.props.pickPlaceInformation.pickCustomRetractPosZMsg.length > 0
    );
  };
  isPickError = () => {
    return this.isPickApproachError() || this.isPickRetractError();
  };
  isPlaceApproachError = () => {
    return (
      this.props.pickPlaceInformation.placeCustomApproachPosXMsg.length > 0 ||
      this.props.pickPlaceInformation.placeCustomApproachPosYMsg.length > 0 ||
      this.props.pickPlaceInformation.placeCustomApproachPosZMsg.length > 0
    );
  };
  isPlaceRetractError = () => {
    return (
      this.props.pickPlaceInformation.placeCustomRetractPosXMsg.length > 0 ||
      this.props.pickPlaceInformation.placeCustomRetractPosYMsg.length > 0 ||
      this.props.pickPlaceInformation.placeCustomRetractPosZMsg.length > 0
    );
  };

  isPlaceError = () => {
    return this.isPlaceApproachError() || this.isPlaceRetractError();
  };
  isPickPlaceError = () => {
    return this.isIniPosJMsgHasValue() || this.isPickError() || this.isPlaceError();
  };
  isPosJFirstGroupHasValue = () => {
    return (
      this.props.pickPlaceInformation.iniPosJ1 !== '' &&
      this.props.pickPlaceInformation.iniPosJ2 !== '' &&
      this.props.pickPlaceInformation.iniPosJ3 !== ''
    );
  };

  isPosJSecondGroupHasValue = () => {
    return (
      this.props.pickPlaceInformation.iniPosJ4 !== '' &&
      this.props.pickPlaceInformation.iniPosJ5 !== '' &&
      this.props.pickPlaceInformation.iniPosJ6 !== ''
    );
  };

  isFullOriginPose = () => {
    return this.isPosJFirstGroupHasValue() && this.isPosJSecondGroupHasValue();
  };
  isReadyToRun = () => {
    return (
      !(
        this.isGripperError() ||
        this.isOutPalletError() ||
        this.isProductError() ||
        this.isInPalletError() ||
        this.isCalibrationError() ||
        this.isPickPlaceError()
      ) && this.isFullOriginPose()
    );
  };

  runProgram = () => {
    const data = this.genDRLScript();
    const timeOut = 3000;
    const heightDefault = 150;

    setTimeout(() => {
      this.setState({
        canGrasp: true,
        running: true
      });
    }, timeOut);

    this.props.setRunning({
      payload: {
        running: true
      }
    });

    this.props.runProgram(data);
  };

  getInitialPose = () => {
    if (
      this.props.pickPlaceInformation.iniPosJ1 &&
      this.props.pickPlaceInformation.iniPosJ2 &&
      this.props.pickPlaceInformation.iniPosJ3 &&
      this.props.pickPlaceInformation.iniPosJ4 &&
      this.props.pickPlaceInformation.iniPosJ5 &&
      this.props.pickPlaceInformation.iniPosJ6
    ) {
      return [
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ1, NUMBER_OF_DECIMAL_DEGREE),
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ2, NUMBER_OF_DECIMAL_DEGREE),
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ3, NUMBER_OF_DECIMAL_DEGREE),
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ4, NUMBER_OF_DECIMAL_DEGREE),
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ5, NUMBER_OF_DECIMAL_DEGREE),
        parseStringToFloat(this.props.pickPlaceInformation.iniPosJ6, NUMBER_OF_DECIMAL_DEGREE)
      ];
    }
    return null;
  };
  getPickCustomApproachPosition = (tcpArr: Coordinate[]) => {
    if (
      this.props.pickPlaceInformation.pickCustomApproachPosX &&
      this.props.pickPlaceInformation.pickCustomApproachPosY &&
      this.props.pickPlaceInformation.pickCustomApproachPosZ
    ) {
      const distance = {
        x: Number(this.props.pickPlaceInformation.pickCustomApproachPosX),
        y: Number(this.props.pickPlaceInformation.pickCustomApproachPosY),
        z: Number(this.props.pickPlaceInformation.pickCustomApproachPosZ)
      };
      return calcAppRetPosArr(this.context, tcpArr, distance);
    }
    return [];
  };
  getPickCustomRetractPosition = (tcpArr: Coordinate[]) => {
    if (
      this.props.pickPlaceInformation.pickCustomRetractPosX &&
      this.props.pickPlaceInformation.pickCustomRetractPosY &&
      this.props.pickPlaceInformation.pickCustomRetractPosZ
    ) {
      const distance = {
        x: Number(this.props.pickPlaceInformation.pickCustomRetractPosX),
        y: Number(this.props.pickPlaceInformation.pickCustomRetractPosY),
        z: Number(this.props.pickPlaceInformation.pickCustomRetractPosZ)
      };
      return calcAppRetPosArr(this.context, tcpArr, distance);
    }
    return [];
  };
  getPlaceCustomApproachPosition = (tcpArr: Coordinate[]) => {
    if (
      this.props.pickPlaceInformation.placeCustomApproachPosX &&
      this.props.pickPlaceInformation.placeCustomApproachPosY &&
      this.props.pickPlaceInformation.placeCustomApproachPosZ
    ) {
      const distance = {
        x: Number(this.props.pickPlaceInformation.placeCustomApproachPosX),
        y: Number(this.props.pickPlaceInformation.placeCustomApproachPosY),
        z: Number(this.props.pickPlaceInformation.placeCustomApproachPosZ)
      };
      return calcAppRetPosArr(this.context, tcpArr, distance);
    }
    return [];
  };
  getPlaceCustomRetractPosition = (tcpArr: Coordinate[]) => {
    if (
      this.props.pickPlaceInformation.placeCustomRetractPosX &&
      this.props.pickPlaceInformation.placeCustomRetractPosY &&
      this.props.pickPlaceInformation.placeCustomRetractPosZ
    ) {
      const distance = {
        x: Number(this.props.pickPlaceInformation.placeCustomRetractPosX),
        y: Number(this.props.pickPlaceInformation.placeCustomRetractPosY),
        z: Number(this.props.pickPlaceInformation.placeCustomRetractPosZ)
      };
      return calcAppRetPosArr(this.context, tcpArr, distance);
    }
    return [];
  };

  /**
   * Convert ObjectInfo to position (x,y,z,A,B,C) for DRL script
   */
  getTCPGripper = (objectTopCenter: { [key: string]: ObjectInfo }) => {
    const result = [];
    const HAFT_CIRCLE = 180;
    const QUARTER_CIRCLE = 90;
    for (const [key, value] of Object.entries(objectTopCenter)) {
      // To exclude key "in-pallet" and "out-pallet" in object
      if (key.startsWith(IN_PALLET_PRODUCT_PREFIX) || key.startsWith(OUT_PALLET_PRODUCT_PREFIX)) {
        let b = value.rotation.b + HAFT_CIRCLE;
        if (value.rotation.b > 0) {
          b = value.rotation.b - HAFT_CIRCLE;
        }
        result.push({
          x: value.position.x,
          y: value.position.y,
          z: value.position.z,
          a: value.rotation.a,
          b: b,
          c: -1 * value.rotation.c + QUARTER_CIRCLE
        });
      }
    }
    return result;
  };
  genDRLScript() {
    const initialPose = this.getInitialPose();

    // Get TCP product object
    const allTopCenterIn = generateInFeederPallet(this.props.productInformation, this.props.inPalletInformation);
    const allTopCenterOut = generateOutFeederPallet(
      this.props.productInformation,
      this.props.inPalletInformation,
      this.props.outPalletInformation,
      this.props.calibrationInformation
    );
    this.setState(
      {
        placedItems: [],
        currentProductKey: '',
        allTopCenterIn: {}
      },
      () => {
        const itemKeys = Object.keys(allTopCenterIn);
        this.setState({
          currentProductKey: itemKeys.pop() || '',
          allTopCenterIn: {
            ...allTopCenterIn
          }
        });
      }
    );
    // Convert TCP product to gripper
    const lstTCPIn = this.getTCPGripper(allTopCenterIn).reverse();
    const lstTCPOut = this.getTCPGripper(allTopCenterOut);

    // Ensure Max Out Product is not greater than Max In Product
    const minProduct = Math.min(lstTCPIn.length, lstTCPOut.length);
    lstTCPIn.splice(minProduct);
    lstTCPOut.splice(minProduct);
    const pickCustomApproachPosition = this.getPickCustomApproachPosition(lstTCPIn);
    const pickCustomRetractPosition = this.getPickCustomRetractPosition(lstTCPIn);
    const placeCustomApproachPosition = this.getPlaceCustomApproachPosition(lstTCPOut);
    const placeCustomRetractPosition = this.getPlaceCustomRetractPosition(lstTCPOut);
    const data = {
      initial_pose: initialPose,
      pick_custom_approach_position: pickCustomApproachPosition,
      pick_custom_retract_position: pickCustomRetractPosition,
      place_custom_approach_position: placeCustomApproachPosition,
      place_custom_retract_position: placeCustomRetractPosition,
      pick_product_position: lstTCPIn,
      place_product_position: lstTCPOut
    };
    const drlScript = DRL_TEMPLATE.replace('palletizingData', 'data = ' + JSON.stringify(data));
    // console.log('drlScript: ' + drlScript);
    return drlScript;
  }
  render(): React.ReactNode {
    // Get info render 3d (pallet, product)
    const objectData: {
      [key: string]: ObjectInfo;
    } = {};

    // Render in pallet and all product in
    Object.keys(this.state.allTopCenterIn).forEach((key) => {
      objectData[key] = this.state.allTopCenterIn[key];
    });

    // Just render
    Object.keys(this.state.allTopCenterOut).forEach((key) => {
      if (key === 'out-pallet') {
        objectData[key] = this.state.allTopCenterOut[key];
      }
    });
    return (
      <>
        <Grid
          item
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${SetDeviceStyles['device-screen']} ${PalletStyles['space-bottom']}`}
          hidden={this.props.isHidden}
        >
          <Container maxWidth={false} className={SetDeviceStyles['set-device-container']}>
            <Typography variant="h6" className={PalletStyles['title']}>
              {this.props.t('run')}
            </Typography>
            <Grid item container xs>
              <Grid item xs={12} md={12} lg={12} height="600px">
                {this.props.isShowSDK && (!this.props.isHidden || this.state.running) && (
                  <SDKViewer
                    context={this.context}
                    moduleRootPath={this.props.moduleRootPath}
                    robotModel={this.props.robotModel}
                    monitorMotion={true}
                    showDirection={true}
                    showRobot={true}
                    showProductIndex={true}
                    objectData={objectData}
                    showTCP={this.props.gripperInformation.showTCP}
                    outPalletIndex={this.state.graspIndex}
                    inPalletIndex={this.state.currentProductKey}
                    inPalletIndexProps={(index) => {
                      if (typeof index === 'number') {
                        return index;
                      } else {
                        return index.substring(
                          index.indexOf(IN_PALLET_PRODUCT_PREFIX) + IN_PALLET_PRODUCT_PREFIX.length,
                          index.length
                        );
                      }
                    }}
                    refObject={this.SDKViewerScreen}
                    isForceRender={this.state.running}
                  ></SDKViewer>
                )}
              </Grid>
            </Grid>
          </Container>
        </Grid>
      </>
    );
  }
}
function mapStateToProps(state: RunMapStateToProps) {
  return {
    gripperInformation: state.gripper,
    productInformation: state.product,
    inPalletInformation: state.inPallet,
    outPalletInformation: state.outPallet,
    calibrationInformation: state.calibration,
    pickPlaceInformation: state.checkPickPlace
  };
}
function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setRunning: (action: {
      payload: {
        running: boolean;
      };
    }) => dispatch(setRunning(action.payload))
  };
}
export default connect(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true
})(
  withTranslation('com.dra.palletizing', {
    withRef: true
  })(RunScreen)
);
if ('DEV_MODE' in globalThis) {
  const DUMMY_PROPS_DATA = {
    isHidden: false,
    productInformation: {},
    inPalletInformation: {},
    outPalletInformation: {},
    calibrationInformation: {},
    gripperInformation: {},
    pickPlaceInformation: {},
    setRunning: (action: {
      payload: {
        running: boolean;
      };
    }) => {},
    runProgram: (data: any) => {},
    moduleRootPath: 'aaaa',
    robotModel: 'aaaa',
    projectId: 'sssss',
    isShowSDK: true
  };
}
