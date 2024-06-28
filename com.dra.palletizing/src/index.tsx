/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

/* istanbul ignore file */
import { Grid } from '@mui/material';
import {
  BaseModule,
  SixNumArray,
  logger,
  ModuleScreen,
  ModuleScreenProps,
  RobotSpace,
  System,
  IProgramManager,
  RobotState,
  Message,
  IDartFileSystem,
  IMotionManager,
  Monitorable,
  TableRow,
  StopType,
  Context,
  IRobotManager,
  IPositionManager,
  IDartDatabase,
  ICommunicationManager,
  GpioTypeIndex,
  GpioControlBoxDigitalIndex,
  ProgramState,
  IConfigurationManager,
  IRobotParameterManager,
} from 'dart-api';
import React from 'react';
import PalletStyles from './assets/styles/style.scss';
import {
  DEFAULT_VALUE,
  GRIPPER_TCP,
  MOVE_J,
  MOVE_L,
  NUMBER_SELECT_DEVEICE,
  NUMBER_SELECT_PROCESS,
  NUMBER_SELECT_SETTING_STEP,
  STRING_EMPTY,
  TABLE_CHECK_POSITION,
  TABLE_GRIPPER,
  TABLE_INFEEDER_PALLET,
  TABLE_OUTFEEDER_POSITION,
  TABLE_OUT_PALLET,
  TABLE_PRODUCT,
  TABLE_PROJECT,
  TYPE_MESSAGE,
} from './consts';
import AppMain from './AppMain';
import SetDeviceSreen from './SetDeviceScreen';
import GripperScreen from './GripperScreen';
import ProductInformationScreen from './ProductInformationScreen';
import RobotInformationScreen from './RobotInformationScreen';
import LeftMenu from './LeftMenu';
import { ProjectInformation, HoldButton } from './type';
import { getCurrentTime, getCurrentTimeClone } from './util';
import { SetPosition } from './type';
import RunScreen from './RunScreen';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import InPalletScreen from './InPalletScreen';
import OutPalletScreen from './OutPalletScreen';
import CalibrateOutFeederScreen from './CalibrateOutFeederScreen';
import CheckPickPlaceScreen from './CheckPickPlaceScreen';
import DialogCommon from './DialogCommon';
import { ModuleContext } from './ModuleContext';
import { setRunning } from './redux/RunSlice';
import i18next from 'i18next';
import ApiManager_IUH3459EDG from './ApiManager';
import { EulerType } from 'dart-api/dart-api-math';
import DrlUtils from './DrlUtils';

// IIFE for register a function to create an instance of main class which is inherited BaseModule.
(() => {
  System.registerModuleMainClassCreator((packageInfo) => new Module(packageInfo));
})();
class Module extends BaseModule {
  getModuleScreen(componentId: string) {
    return MainScreen;
  }
}

declare const window: any;
class MainScreen extends ModuleScreen {
  private readonly productScreen: React.RefObject<any>;
  private readonly outPalletScreen: React.RefObject<any>;
  private readonly inPalletScreen: React.RefObject<any>;
  private readonly gripperScreen: React.RefObject<any>;
  private readonly calibrateOutFeederScreen: React.RefObject<any>;
  private readonly checkPickPlaceScreen: React.RefObject<any>;
  private readonly runScreen: React.RefObject<any>;
  private robotParameterManager: IRobotParameterManager;
  private communicationManager: ICommunicationManager;
  private positionManage: IPositionManager;
  private generalManage: IRobotManager;
  private motionManager: IMotionManager;
  private robotManager: IRobotManager;
  private programManager: IProgramManager;
  private fileSystem: IDartFileSystem;
  private db: IDartDatabase;
  private iConfigurationManager!: IConfigurationManager;
  private inputRef: any;
  // private timeBackup?: NodeJS.Timer;
  private interval?: NodeJS.Timer;

  constructor(props: ModuleScreenProps) {
    super(props);
    this.inputRef = React.createRef();
    this.positionManage = this.moduleContext.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
    this.generalManage = this.moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
    this.motionManager = this.moduleContext.getSystemManager(Context.MOTION_MANAGER) as IMotionManager;
    this.robotManager = this.moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
    this.programManager = this.moduleContext.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;
    this.iConfigurationManager = this.moduleContext.getSystemManager(
      Context.CONFIGURATION_MANAGER,
    ) as IConfigurationManager;
    this.communicationManager = this.moduleContext.getSystemManager(
      Context.COMMUNICATION_MANAGER,
    ) as ICommunicationManager;
    this.fileSystem = this.moduleContext.getSystemLibrary(Context.DART_FILE_SYSTEM) as IDartFileSystem;
    this.robotParameterManager = this.moduleContext.getSystemManager(
      Context.ROBOT_PARAMETER_MANAGER,
    ) as IRobotParameterManager;
    this.handleGoToSet = this.handleGoToSet.bind(this);

    this.state = {
      readyToRun: false,
      projectName: '',
      tabsParent: 0,
      tabProcessIndex: 0,
      tabDeviceIndex: 0,
      processStep: 1,
      settingStep: 1,
      deviceStep: 1,
      projectId: '',
      projectList: [],
      calculatorChange: false,

      isServoOn: this.generalManage.isServoOn(),
      dialogProvider: {
        type: 'error',
        isOpen: false,
        content: '',
        onClose: () => ({}),
        onSubmit: () => ({}),
        children: <></>,
      },
      holdButton: '',
      isRenderedOutFeeder: false,
      robotState: this.generalManage.getRobotState(),
      dbInitialized: false,
      calibSettingChanged: true,
      connectSDK: false,
      dataRobotModel: '',
      dataChanged: false,
      store: store.getState(),
    };
    this.initDatabase().then(() => {
      this.setState({
        dbInitialized: true,
      });
    });

    this.productScreen = React.createRef();
    this.outPalletScreen = React.createRef();
    this.inPalletScreen = React.createRef();
    this.gripperScreen = React.createRef();
    this.calibrateOutFeederScreen = React.createRef();
    this.checkPickPlaceScreen = React.createRef();
    this.runScreen = React.createRef();
    this.initialize();
    this.changeLanguage();
  }

  setStyle = (element: HTMLElement, style: string) => {
    element.style.display = style;
  };

  onTabFocused = (focused: boolean) => {
    const basicMenu = document.getElementById('basic-menu');
    const dialogCommon = document.getElementById('dialog-common');
    const palletDropdown = Array.from(
      document.getElementsByClassName('standard-pallet-select') as HTMLCollectionOf<HTMLElement>,
    );
    const graspReleaseDropdown = Array.from(
      document.getElementsByClassName('grasp-release-select') as HTMLCollectionOf<HTMLElement>,
    );
    const tcpDropdown = Array.from(document.getElementsByClassName('tcp-select') as HTMLCollectionOf<HTMLElement>);
    if (!focused) {
      if (basicMenu != undefined) {
        this.setStyle(basicMenu, 'none');
      }
      if (dialogCommon != undefined) {
        this.setStyle(dialogCommon, 'none');
      }
      if (palletDropdown.length > 0) {
        this.setStyle(palletDropdown[0], 'none');
      }
      if (graspReleaseDropdown.length > 0) {
        this.setStyle(graspReleaseDropdown[0], 'none');
      }
      if (tcpDropdown.length > 0) {
        this.setStyle(tcpDropdown[0], 'none');
      }
    } else {
      if (basicMenu != undefined) {
        this.setStyle(basicMenu, '');
      }
      if (dialogCommon != undefined) {
        this.setStyle(dialogCommon, '');
      }
      if (palletDropdown.length > 0) {
        this.setStyle(palletDropdown[0], '');
      }
      if (graspReleaseDropdown.length > 0) {
        this.setStyle(graspReleaseDropdown[0], '');
      }
      if (tcpDropdown.length > 0) {
        this.setStyle(tcpDropdown[0], '');
      }
    }
  };

  changeLanguage = () => {
    const curLang = this.iConfigurationManager.languageCode.value;
    if (curLang) {
      i18next.changeLanguage(curLang);
    }
  };

  async initialize() {
    const dataRobotModel = await this.robotManager.getRobotModel();
    this.setState({ dataRobotModel });
  }
  onNewMessage(message: Message): Promise<boolean> {
    return new Promise((resolve, _) => {
      if (message.action === Message.ACTION_RUN_PROGRAM) {
        this.setState({ processStep: 7, settingStep: 1 });
        if (this.runScreen.current?.isReadyToRun()) {
          this.runScreen.current?.runProgram();
          resolve(true);
        } else {
          this.programManager.runProgram(STRING_EMPTY, null, null, false);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  componentDidMount = () => {
    window.addEventListener('beforeunload', () => {
      if (this.interval) {
        clearInterval(this.interval);
      }
    });
    this.loadProjectList();
    this.changeLanguage();
    this.generalManage.robotState.register(this.moduleContext, this.onRobotStateChanged);
    this.generalManage.servoState.register(this.moduleContext, this.onServoChanged);
    this.programManager.programState.register(this.moduleContext, this.programCallBack);

    ApiManager_IUH3459EDG.inst().initialize(this.moduleContext);
    if (ApiManager_IUH3459EDG.inst().isInitialized() == false) {
      //console.log(`[View3D] Failed to initialize the api manager.`);
    }
  };

  componentDidUpdate = (_: ModuleScreenProps, prevState: any) => {
    const { projectId } = this.state;
    if (projectId !== prevState.projectId && projectId !== '') {
      this.programManager.getProgramState().then((prgState) => {
        this.programCallBack(prgState);
      });
    }

    // ApiManager_IUH3459EDG.dispose();
  };

  programCallBack = (prgState: ProgramState) => {
    store.dispatch(setRunning({ running: prgState === ProgramState.PLAY || prgState === ProgramState.HOLD }));
  };

  handleAutoSaveProject = () => {
    if (this.state.projectId === '') {
      return;
    }
    this.loadProjectList();
    const data = store.getState();
    const currentTime = getCurrentTimeClone();
    const autoSaveName = `\u00a0AutoSave_${this.state.projectName}_`;
    const autoProjectExisted = this.state.projectList.filter((project: ProjectInformation) =>
      project.projectId.startsWith(`\u00a0AutoSave_${this.state.projectName}_`),
    );
    const projectIdList = [...autoProjectExisted?.map((item: ProjectInformation) => item?.projectId)];
    if (!this.state.projectName.startsWith('\u00a0AutoSave_')) {
      if (autoProjectExisted?.length > 0) {
        this.deleteProjectClone(projectIdList).then(async () => {
          const projectId = await this.createProjectClone(`${autoSaveName}${currentTime}`, data);
          if (projectId) {
            this.loadProjectList();
          }
        });
      } else if (autoProjectExisted?.length === 0) {
        this.checkProjectNameExistence(`${autoSaveName}${currentTime}`).then(async (existed) => {
          if (!existed) {
            const projectid = await this.createProjectClone(`${autoSaveName}${currentTime}`, data);
            if (projectid) {
              this.loadProjectList();
            }
          }
        });
      }
    }
  };

  componentWillUnmount ()  {
    // Must delete DrlUtils Instance to free up memory
    DrlUtils.deleteInstance();

    this.clearIntervalH2R();
    this.generalManage.robotState.unregister(this.moduleContext, this.onRobotStateChanged);
    this.generalManage.servoState.unregister(this.moduleContext, this.onServoChanged);
    this.positionManage.jointPose.unregister(this.moduleContext, this.getCurrentJointCallback);
    this.programManager.programState.unregister(this.moduleContext, this.programCallBack);
    if (this.interval) {
      clearInterval(this.interval);
    }
  };
  
  createProjectClone = async (projectName: string, data: any) => {
    const currentTime = getCurrentTime();
    const projectId = `${projectName}_${currentTime}`;
    await Promise.all([
      this.db.insert(TABLE_PROJECT.name, [projectId, projectName, currentTime, currentTime]),
      this.db.insert(TABLE_PRODUCT.name, [
        projectId,
        data.product.length,
        data.product.width,
        data.product.height,
        data.product.weight,
        data.product.lengthError,
        data.product.widthError,
        data.product.heightError,
        data.product.weightError,
      ]),
      this.db.insert(TABLE_INFEEDER_PALLET.name, [
        projectId,
        data.inPallet.selectedPallet,
        data.inPallet.inPalletLength,
        data.inPallet.inPalletWidth,
        data.inPallet.inPalletRow,
        data.inPallet.inPalletColumn,
        data.inPallet.inPalletLayer,
        data.inPallet.posX1,
        data.inPallet.posY1,
        data.inPallet.posZ1,
        data.inPallet.posA1,
        data.inPallet.posB1,
        data.inPallet.posC1,
        data.inPallet.posX2,
        data.inPallet.posY2,
        data.inPallet.posZ2,
        data.inPallet.posA2,
        data.inPallet.posB2,
        data.inPallet.posC2,
        data.inPallet.posX3,
        data.inPallet.posY3,
        data.inPallet.posZ3,
        data.inPallet.posA3,
        data.inPallet.posB3,
        data.inPallet.posC3,
        data.inPallet.lengthError,
        data.inPallet.widthError,
        data.inPallet.rowError,
        data.inPallet.columnError,
        data.inPallet.layerError,
        data.inPallet.x1Error,
        data.inPallet.x2Error,
        data.inPallet.x3Error,
        data.inPallet.y1Error,
        data.inPallet.y2Error,
        data.inPallet.y3Error,
        data.inPallet.z1Error,
        data.inPallet.z2Error,
        data.inPallet.z3Error,
        data.inPallet.a1Error,
        data.inPallet.a2Error,
        data.inPallet.a3Error,
        data.inPallet.b1Error,
        data.inPallet.b2Error,
        data.inPallet.b3Error,
        data.inPallet.c1Error,
        data.inPallet.c2Error,
        data.inPallet.c3Error,
      ]),
      this.db.insert(TABLE_OUT_PALLET.name, [
        projectId,
        data.outPallet.selectedPallet,
        data.outPallet.length,
        data.outPallet.width,
        data.outPallet.useOverhangUnderhang,
        data.outPallet.isOverhang,
        data.outPallet.overhang,
        data.outPallet.underhang,
        data.outPallet.boxPadding,
        data.outPallet.maxLayer,
        data.outPallet.lengthError,
        data.outPallet.widthError,
        data.outPallet.overhangError,
        data.outPallet.underhangError,
        data.outPallet.boxPaddingError,
        data.outPallet.maxLayerError,
      ]),
      this.db.insert(TABLE_GRIPPER.name, [
        projectId,
        data.gripper.selectedGripper.name,
        data.gripper.x,
        data.gripper.y,
        data.gripper.z,
        data.gripper.a,
        data.gripper.b,
        data.gripper.c,
        data.gripper.selectedAction,
        data.gripper.errorX,
        data.gripper.errorY,
        data.gripper.errorZ,
        data.gripper.errorA,
        data.gripper.errorB,
        data.gripper.errorC,
        JSON.stringify(data.gripper.zimmer_hrc_03),
        JSON.stringify(data.gripper.schmalz_fmcb),
        JSON.stringify(data.gripper.onrobot_vgp20),
        JSON.stringify(data.gripper.robotic_airq),
        JSON.stringify(data.gripper.onrobot_fgp20),
      ]),
      this.db.insert(TABLE_CHECK_POSITION.name, [
        projectId,
        data.checkPickPlace.iniPosJ1,
        data.checkPickPlace.iniPosJ2,
        data.checkPickPlace.iniPosJ3,
        data.checkPickPlace.iniPosJ4,
        data.checkPickPlace.iniPosJ5,
        data.checkPickPlace.iniPosJ6,
        data.checkPickPlace.isPickCustomApproachPos,
        data.checkPickPlace.pickCustomApproachPosX,
        data.checkPickPlace.pickCustomApproachPosY,
        data.checkPickPlace.pickCustomApproachPosZ,
        data.checkPickPlace.isPickCustomRetractPos,
        data.checkPickPlace.pickCustomRetractPosX,
        data.checkPickPlace.pickCustomRetractPosY,
        data.checkPickPlace.pickCustomRetractPosZ,
        data.checkPickPlace.isPlaceCustomApproachPos,
        data.checkPickPlace.placeCustomApproachPosX,
        data.checkPickPlace.placeCustomApproachPosY,
        data.checkPickPlace.placeCustomApproachPosZ,
        data.checkPickPlace.isPlaceCustomRetractPos,
        data.checkPickPlace.placeCustomApproachPosX,
        data.checkPickPlace.placeCustomApproachPosY,
        data.checkPickPlace.placeCustomApproachPosZ,
        data.checkPickPlace.iniPosJ1Msg,
        data.checkPickPlace.iniPosJ2Msg,
        data.checkPickPlace.iniPosJ3Msg,
        data.checkPickPlace.iniPosJ4Msg,
        data.checkPickPlace.iniPosJ5Msg,
        data.checkPickPlace.iniPosJ6Msg,
        data.checkPickPlace.pickCustomApproachPosXMsg,
        data.checkPickPlace.pickCustomApproachPosYMsg,
        data.checkPickPlace.pickCustomApproachPosZMsg,
        data.checkPickPlace.pickCustomRetractPosXMsg,
        data.checkPickPlace.pickCustomRetractPosYMsg,
        data.checkPickPlace.pickCustomRetractPosZMsg,
        data.checkPickPlace.placeCustomApproachPosXMsg,
        data.checkPickPlace.placeCustomApproachPosYMsg,
        data.checkPickPlace.placeCustomApproachPosZMsg,
        data.checkPickPlace.placeCustomRetractPosXMsg,
        data.checkPickPlace.placeCustomRetractPosYMsg,
        data.checkPickPlace.placeCustomRetractPosZMsg,
      ]),
      this.db.insert(TABLE_OUTFEEDER_POSITION.name, [
        projectId,
        data.calibration.calibPosX,
        data.calibration.calibPosY,
        data.calibration.calibPosZ,
        '',
        '',
        '',
        data.calibration.isDisplayOpt1,
        data.calibration.calibOptX1,
        data.calibration.calibOptY1,
        data.calibration.calibOptZ1,
        data.calibration.isDisplayOpt2,
        data.calibration.calibOptX2,
        data.calibration.calibOptY2,
        data.calibration.calibOptZ2,
        data.calibration.calibPosXMsg,
        data.calibration.calibPosYMsg,
        data.calibration.calibPosZMsg,
        '',
        '',
        '',
        data.calibration.calibOptX1Msg,
        data.calibration.calibOptX2Msg,
        data.calibration.calibOptY1Msg,
        data.calibration.calibOptY2Msg,
        data.calibration.calibOptZ1Msg,
        data.calibration.calibOptZ2Msg,
        data.calibration.calibOptDuplicate,
        data.calibration.calibOpt1Duplicate,
        data.calibration.calibOpt2Duplicate,
        data.calibration.calibFormAngle,
        data.calibration.calibOptStraightAway,
      ]),
      //TODO: [HuyenNTN13] thêm xử lí tạo default value cho các table còn lại
    ]);
    return projectId;
  };
  getCurrentJointCallback = async (data: SixNumArray) => {
    // HaoLA3 - apply callback - 30/5/2022 - start
    const dataCurrentPosJoint = Object.assign({}, data);
    const JOIN_SHAPE_MAX = 7;
    for (let i = 1; i <= JOIN_SHAPE_MAX; i++) {
      const iframe = document.getElementById(`SDK-Frame-${i}`) as HTMLIFrameElement;
      if (iframe && JSON.stringify(dataCurrentPosJoint)) {
        iframe.contentWindow?.postMessage(
          `{"type":"${TYPE_MESSAGE.SET_INTERVAL_DATA}",
            "value": {
              "dataCurrentPosJoint": ${JSON.stringify(dataCurrentPosJoint)}
            }
          }`,
          '*',
        );
      }
    }
    // HaoLA3 - apply callback - 30/5/2022 - end
  };
  onRobotStateChanged = (state: RobotState) => {
    this.setState({ robotState: state, dataRobotModel: this.robotManager.getRobotModel() });
  };
  onServoChanged = (isServoOn: boolean) => {
    this.setState({ isServoOn });
  };
  handleInputProject = async (value: string): Promise<string> => {
    logger.info('handleInputProject value:' + value);
    const special_character = new RegExp(/[\\/:*?"<>|]/);
    const maxLength = 30;
    if (value === '') {
      return i18next.t('ERR_004', { ns: 'com.dra.palletizing' });
    }

    if (value.length > maxLength) {
      return i18next.t('ERR_002', { ns: 'com.dra.palletizing' });
    }

    if (special_character.test(value)) {
      return i18next.t('ERR_003', { ns: 'com.dra.palletizing' });
    }

    // Check exist
    const existed = await this.checkProjectNameExistence(value);
    if (existed) {
      return i18next.t('ERR_001', { ns: 'com.dra.palletizing' });
    }
    return '';
  };

  loadProjectList = (): Promise<void> => {
    return this.db.query(TABLE_PROJECT.name, TABLE_PROJECT.columns, {}).then((queryResult: TableRow[]) => {
      const projectList = queryResult.map((result: TableRow) => {
        return {
          projectId: result.data['projectId'],
          projectName: result.data['projectName'],
          createDate: result.data['createDate'],
          updateDate: result.data['updateDate'],
        };
      });
      this.setState({ projectList });
    });
  };

  createProject = async (projectName: string) => {
    const currentTime = getCurrentTime();
    const projectId = `${projectName}_${currentTime}`;
    await Promise.all([
      this.db.insert(TABLE_PROJECT.name, [projectId, projectName, currentTime, currentTime]),
      this.db.insert(TABLE_PRODUCT.name, [
        projectId,
        DEFAULT_VALUE.productInformation.length,
        DEFAULT_VALUE.productInformation.width,
        DEFAULT_VALUE.productInformation.height,
        DEFAULT_VALUE.productInformation.weight,
        DEFAULT_VALUE.productInformation.lengthError,
        DEFAULT_VALUE.productInformation.widthError,
        DEFAULT_VALUE.productInformation.heightError,
        DEFAULT_VALUE.productInformation.weightError,
      ]),
      this.db.insert(TABLE_INFEEDER_PALLET.name, [
        projectId,
        DEFAULT_VALUE.inPallet.selectedPallet,
        DEFAULT_VALUE.inPallet.length,
        DEFAULT_VALUE.inPallet.width,
        DEFAULT_VALUE.inPallet.row,
        DEFAULT_VALUE.inPallet.column,
        DEFAULT_VALUE.inPallet.layer,
        DEFAULT_VALUE.inPallet.position1.x,
        DEFAULT_VALUE.inPallet.position1.y,
        DEFAULT_VALUE.inPallet.position1.z,
        DEFAULT_VALUE.inPallet.position1.a,
        DEFAULT_VALUE.inPallet.position1.b,
        DEFAULT_VALUE.inPallet.position1.c,
        DEFAULT_VALUE.inPallet.position2.x,
        DEFAULT_VALUE.inPallet.position2.y,
        DEFAULT_VALUE.inPallet.position2.z,
        DEFAULT_VALUE.inPallet.position2.a,
        DEFAULT_VALUE.inPallet.position2.b,
        DEFAULT_VALUE.inPallet.position2.c,
        DEFAULT_VALUE.inPallet.position3.x,
        DEFAULT_VALUE.inPallet.position3.y,
        DEFAULT_VALUE.inPallet.position3.z,
        DEFAULT_VALUE.inPallet.position3.a,
        DEFAULT_VALUE.inPallet.position3.b,
        DEFAULT_VALUE.inPallet.position3.c,

        DEFAULT_VALUE.inPallet.lengthError,
        DEFAULT_VALUE.inPallet.widthError,
        DEFAULT_VALUE.inPallet.rowError,
        DEFAULT_VALUE.inPallet.columnError,
        DEFAULT_VALUE.inPallet.layerError,
        DEFAULT_VALUE.inPallet.x1Error,
        DEFAULT_VALUE.inPallet.x2Error,
        DEFAULT_VALUE.inPallet.x3Error,
        DEFAULT_VALUE.inPallet.y1Error,
        DEFAULT_VALUE.inPallet.y2Error,
        DEFAULT_VALUE.inPallet.y3Error,
        DEFAULT_VALUE.inPallet.z1Error,
        DEFAULT_VALUE.inPallet.z2Error,
        DEFAULT_VALUE.inPallet.z3Error,
        DEFAULT_VALUE.inPallet.a1Error,
        DEFAULT_VALUE.inPallet.a2Error,
        DEFAULT_VALUE.inPallet.a3Error,
        DEFAULT_VALUE.inPallet.b1Error,
        DEFAULT_VALUE.inPallet.b2Error,
        DEFAULT_VALUE.inPallet.b3Error,
        DEFAULT_VALUE.inPallet.c1Error,
        DEFAULT_VALUE.inPallet.c2Error,
        DEFAULT_VALUE.inPallet.c3Error,
      ]),
      this.db.insert(TABLE_OUT_PALLET.name, [
        projectId,
        DEFAULT_VALUE.outPallet.selectedSize,
        DEFAULT_VALUE.outPallet.length,
        DEFAULT_VALUE.outPallet.width,
        DEFAULT_VALUE.outPallet.useOverhangUnderhang,
        DEFAULT_VALUE.outPallet.isOverhang,
        DEFAULT_VALUE.outPallet.overhang,
        DEFAULT_VALUE.outPallet.underhang,
        DEFAULT_VALUE.outPallet.boxPadding,
        DEFAULT_VALUE.outPallet.maxLayer,

        DEFAULT_VALUE.outPallet.lengthError,
        DEFAULT_VALUE.outPallet.widthError,
        DEFAULT_VALUE.outPallet.overhangError,
        DEFAULT_VALUE.outPallet.underhangError,
        DEFAULT_VALUE.outPallet.boxPaddingError,
        DEFAULT_VALUE.outPallet.maxLayerError,
      ]),
      this.db.insert(TABLE_GRIPPER.name, [
        projectId,
        DEFAULT_VALUE.gripperInterface.name,
        DEFAULT_VALUE.gripperInterface.x,
        DEFAULT_VALUE.gripperInterface.y,
        DEFAULT_VALUE.gripperInterface.z,
        DEFAULT_VALUE.gripperInterface.a,
        DEFAULT_VALUE.gripperInterface.b,
        DEFAULT_VALUE.gripperInterface.c,
        DEFAULT_VALUE.gripperInterface.selectedAction,
        DEFAULT_VALUE.gripperInterface.errorX,
        DEFAULT_VALUE.gripperInterface.errorY,
        DEFAULT_VALUE.gripperInterface.errorZ,
        DEFAULT_VALUE.gripperInterface.errorA,
        DEFAULT_VALUE.gripperInterface.errorB,
        DEFAULT_VALUE.gripperInterface.errorC,
        JSON.stringify(GRIPPER_TCP.zimmer_hrc_03),
        JSON.stringify(GRIPPER_TCP.schmalz_fmcb),
        JSON.stringify(GRIPPER_TCP.onrobot_vgp20),
        JSON.stringify(GRIPPER_TCP.robotic_airq),
        JSON.stringify(GRIPPER_TCP.onrobot_fgp20),
      ]),
      this.db.insert(TABLE_CHECK_POSITION.name, [
        projectId,
        DEFAULT_VALUE.checkPosition.j1,
        DEFAULT_VALUE.checkPosition.j2,
        DEFAULT_VALUE.checkPosition.j3,
        DEFAULT_VALUE.checkPosition.j4,
        DEFAULT_VALUE.checkPosition.j5,
        DEFAULT_VALUE.checkPosition.j6,

        DEFAULT_VALUE.checkPosition.customApproachPickPos,
        DEFAULT_VALUE.checkPosition.xApproachPickPos,
        DEFAULT_VALUE.checkPosition.yApproachPickPos,
        DEFAULT_VALUE.checkPosition.zApproachPickPos,
        DEFAULT_VALUE.checkPosition.customRetractPickPos,
        DEFAULT_VALUE.checkPosition.xRetractPickPos,
        DEFAULT_VALUE.checkPosition.yRetractPickPos,
        DEFAULT_VALUE.checkPosition.zRetractPickPos,

        DEFAULT_VALUE.checkPosition.customApproachPlacePos,
        DEFAULT_VALUE.checkPosition.xApproachPlacePos,
        DEFAULT_VALUE.checkPosition.yApproachPlacePos,
        DEFAULT_VALUE.checkPosition.zApproachPlacePos,
        DEFAULT_VALUE.checkPosition.customRetractPlacePos,
        DEFAULT_VALUE.checkPosition.xRetractPlacePos,
        DEFAULT_VALUE.checkPosition.yRetractPlacePos,
        DEFAULT_VALUE.checkPosition.zRetractPlacePos,

        DEFAULT_VALUE.checkPosition.iniPosJ1Msg,
        DEFAULT_VALUE.checkPosition.iniPosJ2Msg,
        DEFAULT_VALUE.checkPosition.iniPosJ3Msg,
        DEFAULT_VALUE.checkPosition.iniPosJ4Msg,
        DEFAULT_VALUE.checkPosition.iniPosJ5Msg,
        DEFAULT_VALUE.checkPosition.iniPosJ6Msg,
        DEFAULT_VALUE.checkPosition.pickCustomApproachPosXMsg,
        DEFAULT_VALUE.checkPosition.pickCustomApproachPosYMsg,
        DEFAULT_VALUE.checkPosition.pickCustomApproachPosZMsg,
        DEFAULT_VALUE.checkPosition.pickCustomRetractPosXMsg,
        DEFAULT_VALUE.checkPosition.pickCustomRetractPosYMsg,
        DEFAULT_VALUE.checkPosition.pickCustomRetractPosZMsg,
        DEFAULT_VALUE.checkPosition.placeCustomApproachPosXMsg,
        DEFAULT_VALUE.checkPosition.placeCustomApproachPosYMsg,
        DEFAULT_VALUE.checkPosition.placeCustomApproachPosZMsg,
        DEFAULT_VALUE.checkPosition.placeCustomRetractPosXMsg,
        DEFAULT_VALUE.checkPosition.placeCustomRetractPosYMsg,
        DEFAULT_VALUE.checkPosition.placeCustomRetractPosZMsg,
      ]),
      this.db.insert(TABLE_OUTFEEDER_POSITION.name, [
        projectId,
        DEFAULT_VALUE.outFeederPalletPosition.xOrigin,
        DEFAULT_VALUE.outFeederPalletPosition.yOrigin,
        DEFAULT_VALUE.outFeederPalletPosition.zOrigin,
        '',
        '',
        '',
        DEFAULT_VALUE.outFeederPalletPosition.optionalPoint1,
        DEFAULT_VALUE.outFeederPalletPosition.xOptionalPoint1,
        DEFAULT_VALUE.outFeederPalletPosition.yOptionalPoint1,
        DEFAULT_VALUE.outFeederPalletPosition.zOptionalPoint1,
        DEFAULT_VALUE.outFeederPalletPosition.optionalPoint2,
        DEFAULT_VALUE.outFeederPalletPosition.xOptionalPoint2,
        DEFAULT_VALUE.outFeederPalletPosition.yOptionalPoint2,
        DEFAULT_VALUE.outFeederPalletPosition.zOptionalPoint2,

        DEFAULT_VALUE.outFeederPalletPosition.calibPosXMsg,
        DEFAULT_VALUE.outFeederPalletPosition.calibPosYMsg,
        DEFAULT_VALUE.outFeederPalletPosition.calibPosZMsg,
        '',
        '',
        '',
        DEFAULT_VALUE.outFeederPalletPosition.calibOptX1Msg,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptX2Msg,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptY1Msg,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptY2Msg,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptZ1Msg,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptZ2Msg,

        DEFAULT_VALUE.outFeederPalletPosition.calibOptDuplicate,
        DEFAULT_VALUE.outFeederPalletPosition.calibOpt1Duplicate,
        DEFAULT_VALUE.outFeederPalletPosition.calibOpt2Duplicate,
        DEFAULT_VALUE.outFeederPalletPosition.calibFormAngle,
        DEFAULT_VALUE.outFeederPalletPosition.calibOptStraightAway,
      ]),
      //TODO: [HuyenNTN13] thêm xử lí tạo default value cho các table còn lại
    ]);
    this.setState({ projectId, projectName }, () => {
      this.interval = setInterval(() => {
        if (this.state.projectId !== '') {
          this.handleAutoSaveProject();
        }
      }, 30000);
    });
    return projectId;
  };
  deleteProjectClone = async (projectId: string | string[]): Promise<void> => {
    const projectIdToDelete = [];
    if (Array.isArray(projectId)) {
      projectIdToDelete.push(...projectId);
    } else {
      projectIdToDelete.push(projectId);
    }
    const deleteTables = [];
    for (let i = 0; i < projectIdToDelete.length; i++) {
      deleteTables.push(
        this.db.delete(TABLE_PROJECT.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_PRODUCT.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_INFEEDER_PALLET.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_OUT_PALLET.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_OUTFEEDER_POSITION.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_CHECK_POSITION.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_GRIPPER.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      const tcpName = `pallet-${projectIdToDelete[i]}`;
      this.robotParameterManager.tcp.delete(tcpName);
    }
    await Promise.all(deleteTables);
  };
  deleteProject = async (projectId: string | string[]): Promise<void> => {
    const projectIdToDelete = [];
    if (Array.isArray(projectId)) {
      const projectIdDelete = this.state.projectList.filter((project: ProjectInformation) => {
        return projectId.some((id) => {
          return project.projectId.startsWith(`\u00a0AutoSave_${id.substring(0, id.indexOf('_2'))}`, 0);
        });
      });
      projectIdToDelete.push(...projectId, ...projectIdDelete.map((item: ProjectInformation) => item.projectId));
    } else {
      const projectIdDelete = this.state.projectList.filter((project: ProjectInformation) => {
        return project.projectId.startsWith(
          `\u00a0AutoSave_${projectId.substring(0, projectId.indexOf('_2'))}`,
          0,
        );
      });
      projectIdToDelete.push(projectId, ...projectIdDelete.map((item: ProjectInformation) => item.projectId));
    }
    const deleteTables = [];
    for (let i = 0; i < projectIdToDelete.length; i++) {
      deleteTables.push(
        this.db.delete(TABLE_PROJECT.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_PRODUCT.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_INFEEDER_PALLET.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_OUT_PALLET.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_OUTFEEDER_POSITION.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_CHECK_POSITION.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      deleteTables.push(
        this.db.delete(TABLE_GRIPPER.name, {
          projectId: projectIdToDelete[i],
        }),
      );
      const tcpName = `pallet-${projectIdToDelete[i]}`;
      this.robotParameterManager.tcp.delete(tcpName);
    }
    await Promise.all(deleteTables);
  };
  saveProject = (projectId: string): Promise<number | void> => {
    if (this.interval) {
      clearInterval(this.interval);
    }
    return Promise.all([
      this.loadProject(projectId),
      window.saveProduct(projectId),
      window.saveInFeederPallet(projectId),
      window.saveOutPallet(projectId),
      window.saveGripper(projectId),
      window.saveOutFeederPalletPosition(projectId),
      window.saveCheckPickPlacePosition(projectId),
    ]).then((projectDataList) => {
      const projectInformation: ProjectInformation | null = projectDataList[0];
      this.resetDetect();
      if (projectInformation !== null) {
        return this.db?.update(
          TABLE_PROJECT.name,
          { projectId: projectId },
          {
            projectId: projectId,
            projectName: projectInformation.projectName,
            createDate: projectInformation.createDate,
            updateDate: getCurrentTime(),
          },
        );
      }
      return Promise.resolve(0);
    });
  };
  resetDetect() {
    this.productScreen.current?.saved();
    this.inPalletScreen.current?.saved();
    this.outPalletScreen.current?.saved();
    this.calibrateOutFeederScreen.current?.saved();
    this.checkPickPlaceScreen.current?.saved();
    this.gripperScreen.current?.saved();
  }

  //#endregion
  openProject = (projectId: string) => {
    this.interval = setInterval(() => {
      if (this.state.projectId !== '') {
        this.handleAutoSaveProject();
      }
    }, 30000);
    Promise.all([this.loadProject(projectId)])
      .then((projectDataList) => {
        const projectInformation: ProjectInformation | null = projectDataList[0];
        if (projectInformation !== null) {
          this.setState({
            projectName: projectInformation.projectName,
            projectId: projectInformation.projectId,
            processStep: 1,
            settingStep: 1,
          });
        }
      })
      .catch((error) => {
        logger.error(error);
      });
  };
  loadProject = async (projectId: string): Promise<ProjectInformation | null> => {
    const queryResult = await this.db?.query(TABLE_PROJECT.name, TABLE_PROJECT.columns, {
      projectId: projectId,
    });
    if (queryResult?.length > 0) {
      return {
        projectId: queryResult[0].data['projectId'],
        projectName: queryResult[0].data['projectName'],
        createDate: queryResult[0].data['createDate'],
        updateDate: queryResult[0].data['updateDate'],
      };
    }
    return null;
  };

  checkProjectNameExistence = async (projectName: string): Promise<boolean> => {
    const queryResult = await this.db.query(TABLE_PROJECT.name, TABLE_PROJECT.columns, {
      projectName: projectName,
    });
    return queryResult.length > 0;
  };
  initDatabase = () => {
    this.db = this.moduleContext.getSystemLibrary(Context.DART_DATABASE);
    return Promise.all([
      this.db.createTable(TABLE_PROJECT.name, TABLE_PROJECT.columns, false),
      this.db.createTable(TABLE_PRODUCT.name, TABLE_PRODUCT.columns, false),
      this.db.createTable(TABLE_INFEEDER_PALLET.name, TABLE_INFEEDER_PALLET.columns, false),
      this.db.createTable(TABLE_GRIPPER.name, TABLE_GRIPPER.columns, false),
      this.db.createTable(TABLE_OUT_PALLET.name, TABLE_OUT_PALLET.columns, false),
      this.db.createTable(TABLE_CHECK_POSITION.name, TABLE_CHECK_POSITION.columns, false),
      this.db.createTable(TABLE_OUTFEEDER_POSITION.name, TABLE_OUTFEEDER_POSITION.columns, false),
    ]);
  };
  onSelectProcess = (processStep: number) => {
    this.setState({ processStep });
  };
  onSelectSetting = (settingStep: number) => {
    this.setState({ settingStep });
  };
  onSelectDevice = (deviceStep: number) => {
    this.setState({ deviceStep });
  };
  //CUongNX7 Menu start
  hasChanged = (): boolean | undefined => {
    return (
      this.productScreen.current?.haschanged() ||
      this.inPalletScreen.current?.haschanged() ||
      this.outPalletScreen.current?.haschanged() ||
      this.calibrateOutFeederScreen.current?.haschanged() ||
      this.checkPickPlaceScreen.current?.haschanged() ||
      this.gripperScreen.current?.haschanged()
    );
  };

  handleSaveAsActionConfirm = async (newProjectName: string) => {
    const message = await this.handleInputProject(newProjectName);
    const autoProjectExisted = this.state.projectList.filter((project: ProjectInformation) =>
      project.projectId.startsWith(`\u00a0AutoSave_${this.state.projectName}_`),
    );
    const projectIdList = [...autoProjectExisted?.map((item: ProjectInformation) => item?.projectId)];
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.deleteProjectClone(projectIdList).then(async () => {
      if (message === '') {
        this.setState({ inProgress: true }, async () => {
          const projectId = await this.createProject(newProjectName);
          window.saveProduct(projectId);
          window.saveInFeederPallet(projectId);
          window.saveOutPallet(projectId);
          window.saveGripper(projectId);
          window.saveOutFeederPalletPosition(projectId);
          window.saveCheckPickPlacePosition(projectId);
          this.setState({
            inProgress: false,
          });
          this.resetDetect();
        });
      }
    });
    return message;
  };

  //CuongNX7 menu end
  //#endregion left menu

  handleGoToSet = () => {
    this.setState({
      deviceStep: 2,
      settingStep: 2,
    });
  };
  handleGrasp = async () => {
    const timeout = 500;
    await this.communicationManager.dio.setDigitalOutput(
      GpioTypeIndex.FLANGE,
      GpioControlBoxDigitalIndex.INDEX_1,
      false,
    );
    setTimeout(() => {
      this.communicationManager.dio.setDigitalOutput(
        GpioTypeIndex.FLANGE,
        GpioControlBoxDigitalIndex.INDEX_2,
        true,
      );
    }, timeout);
  };

  handleRelease = async () => {
    const timeout = 500;
    await this.communicationManager.dio.setDigitalOutput(
      GpioTypeIndex.FLANGE,
      GpioControlBoxDigitalIndex.INDEX_2,
      false,
    );
    setTimeout(() => {
      this.communicationManager.dio.setDigitalOutput(
        GpioTypeIndex.FLANGE,
        GpioControlBoxDigitalIndex.INDEX_1,
        true,
      );
    }, timeout);
  };

  setDefaultState = () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.setState({
      projectId: '',
      settingStep: 1,
      processStep: 1,
      deviceStep: 1,
    });
  };

  // handleChangeProject = (e: ChangeEvent<HTMLInputElement>) => {
  //   this.setState({ ...this.state, new_project_name: e.target.value })
  // }

  getCurrentPosition = async (roboSpace: RobotSpace, cb: SetPosition) => {
    if (!this.generalManage.isServoOn()) {
      this.setState({
        dialogProvider: {
          type: 'info',
          isOpen: true,
          content: i18next.t('INF_003', { ns: 'com.dra.palletizing' }),
          onClose: () =>
            this.setState({
              ...this.state,
              dialogProvider: {
                isOpen: false,
                content: '',
              },
            }),
        },
      });
    } else {
      let data = await this.positionManage.getCurrentPos(roboSpace);
      if (roboSpace === RobotSpace.TASK) {
        const tmp = ApiManager_IUH3459EDG.inst().MathLib.convertEuler(
          { pose: data, type: EulerType.ZYX },
          EulerType.ZYZ,
        );
        data = tmp.pose;
      }
      cb(data);
    }
  };

  clearIntervalH2R = () => {
    if (this.inputRef.current) {
      clearInterval(this.inputRef.current);
    }
  };

  setIntervalH2R = () => {
    this.inputRef.current = setInterval(() => {
      this.motionManager?.holdToRun();
    }, 50);
  };

  /**
   * this function handle async function moves to postion XYZ ABC
   * @params {type} is RobotSpace @link
   * @params {targetPose} is SixNumArray position
   */
  movesToPositionLJ = async (type: RobotSpace, targetPose: SixNumArray, holdButton?: HoldButton) => {
    if (!this.generalManage.isServoOn()) {
      this.setState({
        dialogProvider: {
          type: 'info',
          isOpen: true,
          content: i18next.t('INF_001', { ns: 'com.dra.palletizing' }),
          onClose: () =>
            this.setState({
              ...this.state,
              dialogProvider: {
                isOpen: false,
                content: '',
              },
            }),
        },
      });
    } else {
      this.setHoldButton(holdButton ? holdButton : '');
      try {
        if (type === 0) {
          this.motionManager.moveJoint(
            targetPose,
            MOVE_J.targetVelocity,
            MOVE_J.targetAcceleration,
            MOVE_J.targetTime,
            MOVE_J.moveMode,
            MOVE_J.blendingRadius,
            MOVE_J.blendingType,
          );
        } else {
          const isSolutionSpace = this.positionManage.getSolutionSpace();
          const poseZYX = ApiManager_IUH3459EDG.inst().MathLib.convertEuler(
            { pose: targetPose, type: EulerType.ZYZ },
            EulerType.ZYX,
          );
          this.motionManager.moveJointPosxH2R(
            poseZYX.pose,
            isSolutionSpace,
            MOVE_L.ifTargetVel,
            MOVE_L.ifTargetAcc,
            MOVE_L.targetTime,
            MOVE_L.moveMode,
            MOVE_L.moveReference,
            MOVE_L.blendingRadius,
            MOVE_L.blendingType,
          );
          this.clearIntervalH2R();
          this.setIntervalH2R();
        }
      } catch (err) {
        logger.info(err);
      }
    }
  };

  stopMoveToPosition = () => {
    if (this.state.holdButton !== '') {
      this.setState({ holdButton: '' });
      try {
        this.motionManager.moveStop(StopType.SLOW);
      } catch (err) {
        logger.info(err);
      }
    }
    this.clearIntervalH2R();
  };

  setHoldButton = (button: HoldButton) => {
    this.setState({ holdButton: button });
  };

  setCalibSettingChanged = (changed: boolean) => {
    this.setState({ calibSettingChanged: changed });
  };
  delTCP = (onComplete: () => void) => {
    const oldData = this.robotParameterManager.tcp.get();
    const result = oldData.map((data) => {
      return this.robotParameterManager.tcp.delete(data.symbol);
    });
    Promise.all(result).then(() => onComplete());
  };
  addTCP = async () => {
    const { name, setting } = store.getState().gripper.selectedGripper;
    const pose = Object.values(setting).map((value) => Number(value)) as SixNumArray;
    const poseZYX = ApiManager_IUH3459EDG.inst().MathLib.convertEuler(
      { pose: pose, type: EulerType.ZYZ },
      EulerType.ZYX,
    );

    return await this.robotParameterManager.tcp.add({
      symbol: 'pallet-Gripper1',
      tcp: {
        targetPose: poseZYX.pose,
      },
    });
  };
  runDRL = (data: string | null) => {
    this.delTCP(() => {
      this.addTCP().then((res) => {
        if (res) {
          if (data) {
            this.programManager.runProgram(data, null, null, false);
          }
        }
      });
    });
  };
  setDataChanged = (changed: boolean) => {
    this.setState({ dataChanged: changed });
  };

  render() {
    const moduleRootPath = this.fileSystem.getModuleRootDirPath(this.moduleContext);
    if (this.state.projectId === '') {
      return (
        <>
          <Provider store={store}>
            <ModuleContext.Provider value={this.moduleContext}>
              <AppMain
                onCreateProject={this.createProject}
                projectList={this.state.projectList}
                checkProjectNameExistence={this.checkProjectNameExistence}
                onOpenProject={this.openProject}
                onDeleteProject={this.deleteProject}
                onLoadProject={this.loadProjectList}
                dbInitialized={this.state.dbInitialized}
              />
            </ModuleContext.Provider>
          </Provider>
        </>
      );
    }
    const isRobotConnected = this.state.robotState !== RobotState.DISCONNECTED && this.state.robotState !== null;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { showSDK = true } = this.props;
    return (
      <>
        <Provider store={store}>
          <ModuleContext.Provider value={this.moduleContext}>
            <Grid container className={`${PalletStyles['container-screen']} ${PalletStyles['index-grid']}`}>
              <Grid item={true} className={PalletStyles['left-menu-background']} md={4} lg={3.5}></Grid>
              <LeftMenu
                projectList={this.state.projectList}
                deleteProject={this.deleteProject}
                setDataChanged={this.setDataChanged}
                projectName={this.state.projectName}
                handleSaveAsActionConfirm={this.handleSaveAsActionConfirm}
                settingStep={this.state.settingStep}
                processStep={this.state.processStep}
                deviceStep={this.state.deviceStep}
                setDefaultState={this.setDefaultState}
                projectId={this.state.projectId}
                saveProject={this.saveProject}
                handleInputProject={this.handleInputProject}
                onSelectSetting={this.onSelectSetting}
                onSelectProcess={this.onSelectProcess}
                onSelectDevice={this.onSelectDevice}
                hasChanged={this.hasChanged}
              />
              <SetDeviceSreen
                hidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.ONE &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                onGoToSetClick={this.handleGoToSet}
                onGraspClick={this.handleGrasp}
                onReleaseClick={this.handleRelease}
                isRobotConnected={isRobotConnected}
                isServoOn={this.state.isServoOn}
                moduleRootPath={moduleRootPath}
                robotModel={this.state.dataRobotModel}
                showSDK={showSDK}
              />
              <ProductInformationScreen
                setDataChanged={this.setDataChanged}
                hidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.TWO &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                ref={this.productScreen}
                projectId={this.state.projectId}
                setCalibSettingChanged={this.setCalibSettingChanged}
              />
              <InPalletScreen
                setDataChanged={this.setDataChanged}
                getCurrentPosition={this.getCurrentPosition}
                movesToPositionLJ={this.movesToPositionLJ}
                stopMoveToPosition={this.stopMoveToPosition}
                hidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.THREE &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                ref={this.inPalletScreen}
                setHoldButton={this.setHoldButton}
                holdButton={this.state.holdButton}
                isRobotConnected={isRobotConnected}
                projectId={this.state.projectId}
                setCalibSettingChanged={this.setCalibSettingChanged}
                projectName={this.state.projectName}
              />
              <OutPalletScreen
                setDataChanged={this.setDataChanged}
                hidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.FOUR &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                ref={this.outPalletScreen}
                projectId={this.state.projectId}
                setCalibSettingChanged={this.setCalibSettingChanged}
              />
              <CalibrateOutFeederScreen
                setDataChanged={this.setDataChanged}
                ref={this.calibrateOutFeederScreen}
                isHidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.FIVE &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                getCurrentPosition={this.getCurrentPosition}
                holdButton={this.state.holdButton}
                isRobotConnected={isRobotConnected}
                calibSettingChanged={this.state.calibSettingChanged}
                setCalibSettingChanged={this.setCalibSettingChanged}
                projectId={this.state.projectId}
                moduleRootPath={moduleRootPath}
                robotModel={this.state.dataRobotModel}
                showSDK={showSDK}
                projectName={this.state.projectName}
              />
              <CheckPickPlaceScreen
                setDataChanged={this.setDataChanged}
                isHidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.SIX &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                ref={this.checkPickPlaceScreen}
                getCurrentPosition={this.getCurrentPosition}
                movesToPositionLJ={this.movesToPositionLJ}
                stopMoveToPosition={this.stopMoveToPosition}
                holdButton={this.state.holdButton}
                isRobotConnected={isRobotConnected}
                projectId={this.state.projectId}
                moduleRootPath={moduleRootPath}
                robotModel={this.state.dataRobotModel}
                shouldShowSDK={showSDK}
                projectName={this.state.projectName}
              />
              <RunScreen
                ref={this.runScreen}
                isHidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.SEVEN &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
                moduleRootPath={moduleRootPath}
                robotModel={this.state.dataRobotModel}
                runProgram={this.runDRL}
                projectId={this.state.projectId}
                isShowSDK={showSDK}
              />
              <Grid
                item={true}
                md={8}
                lg={8.5}
                className={PalletStyles['run-screen']}
                hidden={
                  !(
                    this.state.processStep === NUMBER_SELECT_PROCESS.SEVEN &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.ONE
                  )
                }
              ></Grid>
              <RobotInformationScreen
                hidden={
                  !(
                    this.state.deviceStep === NUMBER_SELECT_DEVEICE.ONE &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.TWO
                  )
                }
                isRobotConnected={isRobotConnected}
              />
              <GripperScreen
                setDataChanged={this.setDataChanged}
                hidden={
                  !(
                    this.state.deviceStep === NUMBER_SELECT_DEVEICE.TWO &&
                    this.state.settingStep === NUMBER_SELECT_SETTING_STEP.TWO
                  )
                }
                ref={this.gripperScreen}
                onGraspClick={this.handleGrasp}
                onReleaseClick={this.handleRelease}
                isRobotConnected={isRobotConnected}
                isServoOn={this.state.isServoOn}
                projectId={this.state.projectId}
              />
              {/* Get Position */}

              <DialogCommon
                openDialog={this.state.dialogProvider.isOpen}
                handleCloseDialog={this.state.dialogProvider.onClose}
                handleConfirm={this.state.dialogProvider.onClose}
                messageContent={this.state.dialogProvider.content}
                type="info"
                content="getposition"
              />
            </Grid>
          </ModuleContext.Provider>
        </Provider>
      </>
    );
  }
}