/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Button,
  Container,
  Divider,
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import { Context, IDartDatabase, RobotSpace, SixNumArray } from 'dart-api';
import React, { Component } from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ObjectInfo, SDKViewer } from './sdk';
import PointsPosition from './components/PointsPosition';
import {
  Coordinate,
  IN_PALLET_PRODUCT_PREFIX,
  NUMBER_OF_DECIMAL,
  NUMBER_OF_DECIMAL_DEGREE,
  OUT_PALLET_PRODUCT_PREFIX,
  TABLE_CHECK_POSITION
} from './consts';
import { calcAppRetPos } from './CoorCalculation';
import DialogCommon from './DialogCommon';
import { ModuleContext } from './ModuleContext';
import { setCheckPickPlaceInformation } from './redux/CheckPickPlaceSlice';
import { GripperReducer } from './redux/GripperSlice';
import {
  CalibrateAndCheckPickPlaceMapTopProps,
  CheckPickPlaceInformation,
  HoldButton,
  SetPosition,
  Vector
} from './type';
import {
  calculatorSimulation,
  checkDataBeforeMoving,
  checkEmpty,
  checkErrorOnCalib,
  checkErrorOnInPallet,
  checkErrorOnProductInfo,
  deepCompareEqual,
  formatDataDisplay,
  generateInFeederPallet,
  generateOutFeederPallet,
  handleOpenMenu,
  isFloatNumber,
  isIntegerNumber,
  parseStringToFloat,
  showGroupMessage,
  validationPosition
} from './util';
import PalletStyles from './assets/styles/style.scss';
import PickPlaceStyles from './assets/styles/pickPlaceScreen.scss';

const CHECK_PICK_ID = 'checkPickPosID';
const CHECK_PLACE_ID = 'checkPlacePosID';

type CheckPickPlaceScreenState = {
  loaded: boolean;
  changed: boolean;
  sdkInitialized: boolean;
  pickProductCount: number;
  placeProductCount: number;
  pickProductIndex: number;
  placeProductIndex: number;
  placePosX: string;
  placePosY: string;
  placePosZ: string;
  placePosA: string;
  placePosB: string;
  placePosC: string;
  pickPosX: string;
  pickPosY: string;
  pickPosZ: string;
  pickPosA: string;
  pickPosB: string;
  pickPosC: string;
  allTopCenterIn: { [key: string]: ObjectInfo };
  allTopCenterOut: { [key: string]: ObjectInfo };
  getPoseWarning: boolean;
};

export type CheckPickPlaceProps = {
  handleIniPoseSavePosition?: () => Promise<number[]>;
  handleIniPoseMovePosition?: () => void;
  isHidden: boolean;
  getCurrentPosition: (roboSapce: RobotSpace, cb: SetPosition) => void;
  movesToPositionLJ: (type: RobotSpace, postions: SixNumArray, holdButton: HoldButton) => void;
  stopMoveToPosition: () => void;
  holdButton: HoldButton;
  isRobotConnected: boolean;
  productInformation: any;
  inPalletInformation: any;
  outPalletInformation: any;
  calibrationInformation: any;
  projectId: string;
  setCheckPickPlaceInformation: (action: { payload: { [key: string]: string | boolean } }) => void;
  running: boolean;
  checkPickPlaceScreen: CheckPickPlaceInformation;
  moduleRootPath: string;
  robotModel: string;
  gripper: GripperReducer;
  shouldShowSDK: boolean;
  gripperType: string;
  projectName?: string;
  setDataChanged?: (changed: boolean) => void;
  t: TFunction;
};

declare const window: any;
class CheckPickPlaceScreen extends Component<CheckPickPlaceProps, CheckPickPlaceScreenState> {
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  private db: IDartDatabase;
  constructor(props: CheckPickPlaceProps) {
    super(props);
    this.state = {
      pickPosX: '',
      pickPosY: '',
      pickPosZ: '',
      pickPosA: '',
      pickPosB: '',
      pickPosC: '',
      placePosX: '',
      placePosY: '',
      placePosZ: '',
      placePosA: '',
      placePosB: '',
      placePosC: '',
      pickProductIndex: 0,
      placeProductIndex: 0,
      pickProductCount: 0,
      placeProductCount: 0,
      loaded: false,
      changed: false,
      sdkInitialized: false,
      allTopCenterIn: {},
      allTopCenterOut: {},
      getPoseWarning: false
    };
    window.saveCheckPickPlacePosition = this.saveCheckPickPlacePosition.bind(this);
  }

  shouldComponentUpdate(nextProps: CheckPickPlaceProps, _: CheckPickPlaceScreenState) {
    if (!nextProps.isHidden) {
      return true;
    } else {
      if (!this.props.isHidden) {
        return true;
      } else {
        return false;
      }
    }
  }
  /** Use this function in index for leftMenu */
  /* istanbul ignore next */
  saved = () => {
    this.setState({ changed: false });
  };

  /** Use this function in index for leftMenu */
  /* istanbul ignore next */
  haschanged = (): boolean => {
    return this.state.changed;
  };
  /* istanbul ignore next */
  getValueDatabase = (field: string | null, defaultValue: string) => {
    if (field) {
      return field;
    }
    return defaultValue;
  };
  /* istanbul ignore next */
  getValueDatabaseAnotherColumn = (valueCode: string, valueDB: string, defaultValue = '') => {
    if (valueCode) {
      return valueDB;
    }
    return defaultValue;
  };

  loadCheckPickPlace = async () => {
    const queryResult = await this.db?.query(TABLE_CHECK_POSITION.name, TABLE_CHECK_POSITION.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const data = {
        iniPosJ1: queryResult[0].data['j1'],
        iniPosJ2: queryResult[0].data['j2'],
        iniPosJ3: queryResult[0].data['j3'],
        iniPosJ4: queryResult[0].data['j4'],
        iniPosJ5: queryResult[0].data['j5'],
        iniPosJ6: queryResult[0].data['j6'],
        isPickCustomApproachPos: Boolean(queryResult[0].data['customApproachPickPos']),
        pickCustomApproachPosX: this.getValueDatabase(queryResult[0].data['xApproachPickPos'], '0.000'),
        pickCustomApproachPosY: this.getValueDatabase(queryResult[0].data['yApproachPickPos'], '0.000'),
        pickCustomApproachPosZ: this.getValueDatabase(queryResult[0].data['zApproachPickPos'], '150.000'),
        isPickCustomRetractPos: Boolean(queryResult[0].data['customRetractPickPos']),
        pickCustomRetractPosX: this.getValueDatabase(queryResult[0].data['xRetractPickPos'], '0.000'),
        pickCustomRetractPosY: this.getValueDatabase(queryResult[0].data['yRetractPickPos'], '0.000'),
        pickCustomRetractPosZ: this.getValueDatabase(queryResult[0].data['zRetractPickPos'], '150.000'),
        isPlaceCustomApproachPos: Boolean(queryResult[0].data['customApproachPlacePos']),
        placeCustomApproachPosX: this.getValueDatabase(queryResult[0].data['xApproachPlacePos'], '0.000'),
        placeCustomApproachPosY: this.getValueDatabase(queryResult[0].data['yApproachPlacePos'], '0.000'),
        placeCustomApproachPosZ: this.getValueDatabase(queryResult[0].data['zApproachPlacePos'], '150.000'),
        isPlaceCustomRetractPos: Boolean(queryResult[0].data['customRetractPlacePos']),
        placeCustomRetractPosX: this.getValueDatabase(queryResult[0].data['xRetractPlacePos'], '0.000'),
        placeCustomRetractPosY: this.getValueDatabase(queryResult[0].data['yRetractPlacePos'], '0.000'),
        placeCustomRetractPosZ: this.getValueDatabase(queryResult[0].data['zRetractPlacePos'], '150.000'),
        iniPosJ1Msg: queryResult[0].data['iniPosJ1Msg'],
        iniPosJ2Msg: queryResult[0].data['iniPosJ2Msg'],
        iniPosJ3Msg: queryResult[0].data['iniPosJ3Msg'],
        iniPosJ4Msg: queryResult[0].data['iniPosJ4Msg'],
        iniPosJ5Msg: queryResult[0].data['iniPosJ5Msg'],
        iniPosJ6Msg: queryResult[0].data['iniPosJ6Msg'],
        pickCustomApproachPosXMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['xApproachPickPos'],
          queryResult[0].data['pickCustomApproachPosXMsg']
        ),
        pickCustomApproachPosYMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['yApproachPickPos'],
          queryResult[0].data['pickCustomApproachPosYMsg']
        ),
        pickCustomApproachPosZMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['zApproachPickPos'],
          queryResult[0].data['pickCustomApproachPosZMsg']
        ),
        pickCustomRetractPosXMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['xRetractPickPos'],
          queryResult[0].data['pickCustomRetractPosXMsg']
        ),
        pickCustomRetractPosYMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['yRetractPickPos'],
          queryResult[0].data['pickCustomRetractPosYMsg']
        ),
        pickCustomRetractPosZMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['zRetractPickPos'],
          queryResult[0].data['pickCustomRetractPosZMsg']
        ),
        placeCustomApproachPosXMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['xApproachPlacePos'],
          queryResult[0].data['placeCustomApproachPosXMsg']
        ),
        placeCustomApproachPosYMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['yApproachPlacePos'],
          queryResult[0].data['placeCustomApproachPosYMsg']
        ),
        placeCustomApproachPosZMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['zApproachPlacePos'],
          queryResult[0].data['placeCustomApproachPosZMsg']
        ),
        placeCustomRetractPosXMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['xRetractPlacePos'],
          queryResult[0].data['placeCustomRetractPosXMsg']
        ),
        placeCustomRetractPosYMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['yRetractPlacePos'],
          queryResult[0].data['placeCustomRetractPosYMsg']
        ),
        placeCustomRetractPosZMsg: this.getValueDatabaseAnotherColumn(
          queryResult[0].data['zRetractPlacePos'],
          queryResult[0].data['placeCustomRetractPosZMsg']
        )
      };
      this.props.setCheckPickPlaceInformation({
        payload: data
      } as unknown as { payload: { [key: string]: string | boolean } });
    } else {
      const data = {
        pickCustomApproachPosX: '0.000',
        pickCustomApproachPosY: '0.000',
        pickCustomApproachPosZ: '150.000',
        pickCustomRetractPosX: '0.000',
        pickCustomRetractPosY: '0.000',
        pickCustomRetractPosZ: '150.000',
        placeCustomApproachPosX: '0.000',
        placeCustomApproachPosY: '0.000',
        placeCustomApproachPosZ: '150.000',
        placeCustomRetractPosX: '0.000',
        placeCustomRetractPosY: '0.000',
        placeCustomRetractPosZ: '150.000'
      };
      this.props.setCheckPickPlaceInformation({
        payload: data
      } as unknown as { payload: { [key: string]: string | boolean } });
    }
  };

  /* istanbul ignore next */
  saveCheckPickPlacePosition = async (projectId: string) => {
    const { checkPickPlaceScreen } = this.props;
    await this.db
      ?.update(
        TABLE_CHECK_POSITION.name,
        { projectId: projectId },
        {
          projectId: projectId,
          j1: checkPickPlaceScreen.iniPosJ1,
          j2: checkPickPlaceScreen.iniPosJ2,
          j3: checkPickPlaceScreen.iniPosJ3,
          j4: checkPickPlaceScreen.iniPosJ4,
          j5: checkPickPlaceScreen.iniPosJ5,
          j6: checkPickPlaceScreen.iniPosJ6,
          customApproachPickPos: checkPickPlaceScreen.isPickCustomApproachPos,
          xApproachPickPos: checkPickPlaceScreen.pickCustomApproachPosX,
          yApproachPickPos: checkPickPlaceScreen.pickCustomApproachPosY,
          zApproachPickPos: checkPickPlaceScreen.pickCustomApproachPosZ,
          customRetractPickPos: checkPickPlaceScreen.isPickCustomRetractPos,
          xRetractPickPos: checkPickPlaceScreen.pickCustomRetractPosX,
          yRetractPickPos: checkPickPlaceScreen.pickCustomRetractPosY,
          zRetractPickPos: checkPickPlaceScreen.pickCustomRetractPosZ,
          customApproachPlacePos: checkPickPlaceScreen.isPlaceCustomApproachPos,
          xApproachPlacePos: checkPickPlaceScreen.placeCustomApproachPosX,
          yApproachPlacePos: checkPickPlaceScreen.placeCustomApproachPosY,
          zApproachPlacePos: checkPickPlaceScreen.placeCustomApproachPosZ,
          customRetractPlacePos: checkPickPlaceScreen.isPlaceCustomRetractPos,
          xRetractPlacePos: checkPickPlaceScreen.placeCustomRetractPosX,
          yRetractPlacePos: checkPickPlaceScreen.placeCustomRetractPosY,
          zRetractPlacePos: checkPickPlaceScreen.placeCustomRetractPosZ,
          iniPosJ1Msg: checkPickPlaceScreen.iniPosJ1Msg,
          iniPosJ2Msg: checkPickPlaceScreen.iniPosJ2Msg,
          iniPosJ3Msg: checkPickPlaceScreen.iniPosJ3Msg,
          iniPosJ4Msg: checkPickPlaceScreen.iniPosJ4Msg,
          iniPosJ5Msg: checkPickPlaceScreen.iniPosJ5Msg,
          iniPosJ6Msg: checkPickPlaceScreen.iniPosJ6Msg,
          pickCustomApproachPosXMsg: checkPickPlaceScreen.pickCustomApproachPosXMsg,
          pickCustomApproachPosYMsg: checkPickPlaceScreen.pickCustomApproachPosYMsg,
          pickCustomApproachPosZMsg: checkPickPlaceScreen.pickCustomApproachPosZMsg,
          pickCustomRetractPosXMsg: checkPickPlaceScreen.pickCustomRetractPosXMsg,
          pickCustomRetractPosYMsg: checkPickPlaceScreen.pickCustomRetractPosYMsg,
          pickCustomRetractPosZMsg: checkPickPlaceScreen.pickCustomRetractPosZMsg,
          placeCustomApproachPosXMsg: checkPickPlaceScreen.placeCustomApproachPosXMsg,
          placeCustomApproachPosYMsg: checkPickPlaceScreen.placeCustomApproachPosYMsg,
          placeCustomApproachPosZMsg: checkPickPlaceScreen.placeCustomApproachPosZMsg,
          placeCustomRetractPosXMsg: checkPickPlaceScreen.placeCustomRetractPosXMsg,
          placeCustomRetractPosYMsg: checkPickPlaceScreen.placeCustomRetractPosYMsg,
          placeCustomRetractPosZMsg: checkPickPlaceScreen.placeCustomRetractPosZMsg
        }
      )
      .then(async (countRowUpdated) => {
        if (countRowUpdated === 0) {
          await this.db
            ?.delete(TABLE_CHECK_POSITION.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_CHECK_POSITION.name, [
                projectId,
                checkPickPlaceScreen.iniPosJ1,
                checkPickPlaceScreen.iniPosJ2,
                checkPickPlaceScreen.iniPosJ3,
                checkPickPlaceScreen.iniPosJ4,
                checkPickPlaceScreen.iniPosJ5,
                checkPickPlaceScreen.iniPosJ6,

                checkPickPlaceScreen.isPickCustomApproachPos,
                checkPickPlaceScreen.pickCustomApproachPosX,
                checkPickPlaceScreen.pickCustomApproachPosY,
                checkPickPlaceScreen.pickCustomApproachPosZ,
                checkPickPlaceScreen.isPickCustomRetractPos,
                checkPickPlaceScreen.pickCustomRetractPosX,
                checkPickPlaceScreen.pickCustomRetractPosY,
                checkPickPlaceScreen.pickCustomRetractPosZ,

                checkPickPlaceScreen.isPlaceCustomApproachPos,
                checkPickPlaceScreen.placeCustomApproachPosX,
                checkPickPlaceScreen.placeCustomApproachPosY,
                checkPickPlaceScreen.placeCustomApproachPosZ,
                checkPickPlaceScreen.isPlaceCustomRetractPos,
                checkPickPlaceScreen.placeCustomRetractPosX,
                checkPickPlaceScreen.placeCustomRetractPosY,
                checkPickPlaceScreen.placeCustomRetractPosZ,

                checkPickPlaceScreen.iniPosJ1Msg,
                checkPickPlaceScreen.iniPosJ2Msg,
                checkPickPlaceScreen.iniPosJ3Msg,
                checkPickPlaceScreen.iniPosJ4Msg,
                checkPickPlaceScreen.iniPosJ5Msg,
                checkPickPlaceScreen.iniPosJ6Msg,

                checkPickPlaceScreen.pickCustomApproachPosXMsg,
                checkPickPlaceScreen.pickCustomApproachPosYMsg,
                checkPickPlaceScreen.pickCustomApproachPosZMsg,
                checkPickPlaceScreen.pickCustomRetractPosXMsg,
                checkPickPlaceScreen.pickCustomRetractPosYMsg,
                checkPickPlaceScreen.pickCustomRetractPosZMsg,
                checkPickPlaceScreen.placeCustomApproachPosXMsg,
                checkPickPlaceScreen.placeCustomApproachPosYMsg,
                checkPickPlaceScreen.placeCustomApproachPosZMsg,
                checkPickPlaceScreen.placeCustomRetractPosXMsg,
                checkPickPlaceScreen.placeCustomRetractPosYMsg,
                checkPickPlaceScreen.placeCustomRetractPosZMsg
              ]);
            });
        }
      });
  };

  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadCheckPickPlace().finally(() => this.setState({ loaded: true }));
  }

  handlePickProduct = () => {
    let pickProductCount, pickProductIndex;
    /* istanbul ignore next */
    if (
      checkErrorOnInPallet(this.props.inPalletInformation) ||
      checkErrorOnProductInfo(this.props.productInformation)
    ) {
      pickProductCount = 0;
      pickProductIndex = 0;
    } else {
      pickProductCount =
        parseFloat(this.props.inPalletInformation.inPalletRow) *
        parseFloat(this.props.inPalletInformation.inPalletColumn) *
        parseFloat(this.props.inPalletInformation.inPalletLayer);
      if (this.state.pickProductIndex > pickProductCount) {
        pickProductIndex = pickProductCount;
      } else {
        pickProductIndex = this.state.pickProductIndex === 0 ? pickProductCount : this.state.pickProductIndex;
      }
    }
    return { pickProductCount, pickProductIndex };
  };

  handlePlaceProduct = (pickProductCount: number) => {
    let placeProductCount, placeProductIndex;
    const { loadedProduct } = calculatorSimulation(
      this.props.productInformation,
      this.props.outPalletInformation,
      this.props.inPalletInformation
    );
    /* istanbul ignore next */
    if (loadedProduct === 'N/A' || checkErrorOnCalib(this.props.calibrationInformation)) {
      placeProductCount = 0;
      placeProductIndex = 0;
    } else {
      placeProductCount = parseInt(loadedProduct);
      if (placeProductCount > pickProductCount && pickProductCount !== 0) {
        placeProductCount = pickProductCount;
      }
      if (this.state.placeProductIndex > placeProductCount) {
        placeProductIndex = placeProductCount;
      } else {
        placeProductIndex = this.state.placeProductIndex === 0 ? 1 : this.state.placeProductIndex;
      }
    }
    return { placeProductCount, placeProductIndex };
  };

  componentDidUpdate(prevProps: CheckPickPlaceProps, prevState: CheckPickPlaceScreenState) {
    const { ...previousProps } = prevProps.checkPickPlaceScreen;
    const { ...currentProps } = this.props.checkPickPlaceScreen;
    if (!deepCompareEqual(prevProps.checkPickPlaceScreen, this.props.checkPickPlaceScreen)) {
      this.props.setDataChanged?.(true);
    }
    if (prevProps.isHidden !== this.props.isHidden && !this.props.isHidden) {
      const { pickProductCount, pickProductIndex } = this.handlePickProduct();
      const { placeProductCount, placeProductIndex } = this.handlePlaceProduct(pickProductCount);
      this.setState({ ...this.state, pickProductCount: pickProductCount, placeProductCount: placeProductCount });
      this.selectCheckPickPos(pickProductIndex);
      this.selectCheckPlacePos(placeProductIndex);
      let allTopCenterIn = {};
      if (pickProductIndex !== 0) {
        allTopCenterIn = generateInFeederPallet(this.props.productInformation, this.props.inPalletInformation);
      }

      let allTopCenterOut = {};
      if (placeProductIndex !== 0) {
        allTopCenterOut = generateOutFeederPallet(
          this.props.productInformation,
          this.props.inPalletInformation,
          this.props.outPalletInformation,
          this.props.calibrationInformation
        );
      }
      this.setState({
        placeProductCount,
        allTopCenterIn: allTopCenterIn,
        allTopCenterOut: allTopCenterOut
      });
    }

    /* istanbul ignore next */
    if (prevState.loaded && !this.state.changed && JSON.stringify(currentProps) !== JSON.stringify(previousProps)) {
      this.setState({ changed: true });
    }
  }

  checkInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isCheckFloat = true,
    acceptNegative = false
  ) => {
    this.setState({ changed: true });
    const { name, value, selectionStart, selectionEnd } = event.target;
    /* istanbul ignore next */
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }
    const isNumber = isCheckFloat ? isFloatNumber(value, acceptNegative) : isIntegerNumber(value, acceptNegative);
    if (value === '' || isNumber) {
      this.props.setCheckPickPlaceInformation({
        payload: {
          [name]: value
        }
      });
    } else {
      event.target.selectionStart = selectionStart - 1;
      event.target.selectionEnd = selectionEnd - 1;
    }
  };

  validationPosition = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
    errorType: string
  ) => {
    const { name } = event.target;
    const result = validationPosition(event);
    if (typeof result !== 'string') {
      return this.props.setCheckPickPlaceInformation({
        payload: {
          [errorType]: '',
          [name]: result.value
        }
      });
    } else {
      this.props.setCheckPickPlaceInformation({
        payload: {
          [errorType]: result
        }
      });
      // return scrollToElement(event.target);
    }
  };

  setValueToPosition = (typeMove: RobotSpace) => {
    const isCurrentProject = !!this.props.gripperType;
    /* istanbul ignore next */
    if (isCurrentProject) {
      this.props.getCurrentPosition(typeMove, (data: SixNumArray) => {
        const posData = {
          iniPosJ1: formatDataDisplay(data[0], false),
          iniPosJ2: formatDataDisplay(data[1], false),
          iniPosJ3: formatDataDisplay(data[2], false),
          iniPosJ4: formatDataDisplay(data[3], false),
          iniPosJ5: formatDataDisplay(data[4], false),
          iniPosJ6: formatDataDisplay(data[5], false),
          iniPosJ1Msg: '',
          iniPosJ2Msg: '',
          iniPosJ3Msg: '',
          iniPosJ4Msg: '',
          iniPosJ5Msg: '',
          iniPosJ6Msg: ''
        };
        this.props.setCheckPickPlaceInformation({
          payload: posData
        } as unknown as { payload: { [key: string]: string | boolean } });
      });
    } else {
      this.setState({ getPoseWarning: true });
    }
  };
  selectCheckPickPos = (event: SelectChangeEvent<number> | number) => {
    const index = typeof event === 'number' ? event : event.target.value;
    this.setState({ pickProductIndex: parseInt(`${index}`) });
  };
  selectCheckPlacePos = (event: SelectChangeEvent<number> | number) => {
    const index = typeof event === 'number' ? event : event.target.value;
    this.setState({ placeProductIndex: parseInt(`${index}`) });
  };

  moveToPosition = (positionType: RobotSpace, holdButton: HoldButton, isPick?: boolean) => {
    const { checkPickPlaceScreen } = this.props;
    /* istanbul ignore next */
    if (positionType === RobotSpace.JOINT) {
      const pos = [
        Number(checkPickPlaceScreen[`iniPosJ1`]),
        Number(checkPickPlaceScreen[`iniPosJ2`]),
        Number(checkPickPlaceScreen[`iniPosJ3`]),
        Number(checkPickPlaceScreen[`iniPosJ4`]),
        Number(checkPickPlaceScreen[`iniPosJ5`]),
        Number(checkPickPlaceScreen[`iniPosJ6`])
      ] as SixNumArray;
      if (
        checkDataBeforeMoving({
          j1: checkPickPlaceScreen[`iniPosJ1`],
          j2: checkPickPlaceScreen[`iniPosJ2`],
          j3: checkPickPlaceScreen[`iniPosJ3`],
          j4: checkPickPlaceScreen[`iniPosJ4`],
          j5: checkPickPlaceScreen[`iniPosJ5`],
          j6: checkPickPlaceScreen[`iniPosJ6`]
        })
      ) {
        return this.props.movesToPositionLJ(positionType, pos, holdButton);
      }
    }
  };
  moveToPick = () => {
    /* istanbul ignore next */
    if (
      this.state.pickProductIndex <= Object.keys(this.state.allTopCenterIn).length &&
      this.state.pickProductIndex > 0
    ) {
      const HAFT_CIRCLE = 180;
      const QUARTER_CIRCLE = 90;
      const pos = this.state.allTopCenterIn[`${IN_PALLET_PRODUCT_PREFIX}${this.state.pickProductIndex}`];
      let posB = pos.rotation.b + HAFT_CIRCLE;
      if (pos.rotation.b > 0) {
        posB = pos.rotation.b - HAFT_CIRCLE;
      }
      const posC = -1 * pos.rotation.c + QUARTER_CIRCLE;
      return this.props.movesToPositionLJ(
        RobotSpace.TASK,
        [pos.position.x, pos.position.y, pos.position.z, pos.rotation.a, posB, posC],
        'pickPos'
      );
    }
  };

  moveToPlace = () => {
    if (
      this.state.placeProductIndex <= Object.keys(this.state.allTopCenterOut).length - 1 &&
      this.state.placeProductIndex > 0
    ) {
      const pos = this.state.allTopCenterOut[`out-product-${this.state.placeProductIndex}`];
      const HAFT_CIRCLE = 180;
      const QUARTER_CIRCLE = 90;
      let posB = pos.rotation.b + HAFT_CIRCLE;
      if (pos.rotation.b > 0) {
        posB = pos.rotation.b - HAFT_CIRCLE;
      }
      const posC = -1 * pos.rotation.c + QUARTER_CIRCLE;
      return this.props.movesToPositionLJ(
        RobotSpace.TASK,
        [pos.position.x, pos.position.y, pos.position.z, pos.rotation.a, posB, posC],
        'placePos'
      );
    }
  };

  /* istanbul ignore next */
  moveToAppRet = (productPos: Coordinate, distance: Vector, holdButton: HoldButton) => {
    const HAFT_CIRCLE = 180;
    const QUARTER_CIRCLE = 90;
    let b = productPos.b;
    if (Number(productPos.b) > 0) {
      b = Number(productPos.b) - HAFT_CIRCLE;
    } else {
      b = Number(productPos.b) + HAFT_CIRCLE;
    }
    productPos.b = b;
    productPos.c = -1 * Number(productPos.c) + QUARTER_CIRCLE;
    const appRetPos = calcAppRetPos(this.context, productPos, distance);
    if (appRetPos.x) {
      return this.props.movesToPositionLJ(
        RobotSpace.TASK,
        [appRetPos.x, appRetPos.y, appRetPos.z, appRetPos.a, appRetPos.b, appRetPos.c],
        holdButton
      );
    }
  };

  selectNextPrevIndex = (type: 'Pick' | 'Place', isNext: boolean) => {
    let step = -1;
    if (isNext) {
      step = 1;
    }
    if (type === 'Pick') {
      this.setState({ pickProductIndex: this.state.pickProductIndex + step });
    } else {
      this.setState({ placeProductIndex: this.state.placeProductIndex + step });
    }
  };

  render() {
    const { t } = this.props;
    const outPalletKey = 'out-pallet';
    const inPalletKey = 'in-pallet';

    const currentPickProduct = this.state.allTopCenterIn[`in-product-${this.state.pickProductIndex}`];
    const currentPlaceProduct = this.state.allTopCenterOut[`out-product-${this.state.placeProductIndex}`];
    const objectData: {
      [key: string]: ObjectInfo;
    } = {};
    Object.keys(this.state.allTopCenterIn).forEach((key) => {
      const productIndex = Number(
        key.substring(key.indexOf(IN_PALLET_PRODUCT_PREFIX) + IN_PALLET_PRODUCT_PREFIX.length, key.length)
      );
      if (key === inPalletKey || productIndex <= this.state.pickProductIndex) {
        objectData[key] = this.state.allTopCenterIn[key];
      }
    });
    Object.keys(this.state.allTopCenterOut).forEach((key) => {
      const productIndex = Number(
        key.substring(key.indexOf(OUT_PALLET_PRODUCT_PREFIX) + OUT_PALLET_PRODUCT_PREFIX.length, key.length)
      );

      if (key === outPalletKey || productIndex <= this.state.placeProductIndex) {
        objectData[key] = this.state.allTopCenterOut[key];
      }
    });
    const HAFT_CIRCLE = 180;
    const QUARTER_CIRCLE = 90;
    let reverseBPlace, reverseBPick;
    if (this.state.allTopCenterOut[outPalletKey]?.rotation.b > 0) {
      reverseBPlace = this.state.allTopCenterOut[outPalletKey]?.rotation.b - HAFT_CIRCLE;
    } else {
      reverseBPlace = this.state.allTopCenterOut[outPalletKey]?.rotation.b + HAFT_CIRCLE;
    }
    if (this.state.allTopCenterIn[inPalletKey]?.rotation.b > 0) {
      reverseBPick = this.state.allTopCenterIn[inPalletKey]?.rotation.b - HAFT_CIRCLE;
    } else {
      reverseBPick = this.state.allTopCenterIn[inPalletKey]?.rotation.b + HAFT_CIRCLE;
    }
    const reverseCPlace = this.state.allTopCenterOut[outPalletKey]?.rotation.c * -1 + QUARTER_CIRCLE;
    const reverseCPick = this.state.allTopCenterIn[inPalletKey]?.rotation.c * -1 + QUARTER_CIRCLE;

    const { checkPickPlaceScreen } = this.props;
    const dataPose = {
      value: {
        iniPosJ1: checkPickPlaceScreen.iniPosJ1,
        iniPosJ2: checkPickPlaceScreen.iniPosJ2,
        iniPosJ3: checkPickPlaceScreen.iniPosJ3,
        iniPosJ4: checkPickPlaceScreen.iniPosJ4,
        iniPosJ5: checkPickPlaceScreen.iniPosJ5,
        iniPosJ6: checkPickPlaceScreen.iniPosJ6
      },
      error: [
        {
          iniPosJ1Msg: checkPickPlaceScreen.iniPosJ1Msg,
          iniPosJ2Msg: checkPickPlaceScreen.iniPosJ2Msg,
          iniPosJ3Msg: checkPickPlaceScreen.iniPosJ3Msg
        },
        {
          iniPosJ4Msg: checkPickPlaceScreen.iniPosJ4Msg,
          iniPosJ5Msg: checkPickPlaceScreen.iniPosJ5Msg,
          iniPosJ6Msg: checkPickPlaceScreen.iniPosJ6Msg,
          iniPosJ1Msg: checkPickPlaceScreen.iniPosJ1Msg,
          iniPosJ2Msg: checkPickPlaceScreen.iniPosJ2Msg,
          iniPosJ3Msg: checkPickPlaceScreen.iniPosJ3Msg
        }
      ]
    };

    const pickProductPos = {
      x: currentPickProduct?.position.x,
      y: currentPickProduct?.position.y,
      z: currentPickProduct?.position.z,
      a: currentPickProduct?.rotation.a,
      b: currentPickProduct?.rotation.b,
      c: currentPickProduct?.rotation.c
    };

    const placeProductPos = {
      x: currentPlaceProduct?.position.x,
      y: currentPlaceProduct?.position.y,
      z: currentPlaceProduct?.position.z,
      a: currentPlaceProduct?.rotation.a,
      b: currentPlaceProduct?.rotation.b,
      c: currentPlaceProduct?.rotation.c
    };

    const pickApproachDistance = {
      x: Number(checkPickPlaceScreen.pickCustomApproachPosX),
      y: Number(checkPickPlaceScreen.pickCustomApproachPosY),
      z: Number(checkPickPlaceScreen.pickCustomApproachPosZ)
    };

    const pickRetractDistance = {
      x: Number(checkPickPlaceScreen.pickCustomRetractPosX),
      y: Number(checkPickPlaceScreen.pickCustomRetractPosY),
      z: Number(checkPickPlaceScreen.pickCustomRetractPosZ)
    };

    const placeApproachDistance = {
      x: Number(checkPickPlaceScreen.placeCustomApproachPosX),
      y: Number(checkPickPlaceScreen.placeCustomApproachPosY),
      z: Number(checkPickPlaceScreen.placeCustomApproachPosZ)
    };

    const placeRetractDistance = {
      x: Number(checkPickPlaceScreen.placeCustomRetractPosX),
      y: Number(checkPickPlaceScreen.placeCustomRetractPosY),
      z: Number(checkPickPlaceScreen.placeCustomRetractPosZ)
    };

    const robotDisconnectandStop = !this.props.isRobotConnected || this.props.running;
    const isEmptyPickApproach =
      !checkEmpty({ xApproach: checkPickPlaceScreen.pickCustomApproachPosXMsg }) ||
      !checkEmpty({ yApproach: checkPickPlaceScreen.pickCustomApproachPosYMsg }) ||
      !checkEmpty({ zApproach: checkPickPlaceScreen.pickCustomApproachPosZMsg });
    const isEmptyPickRetract =
      !checkEmpty({ xRetract: checkPickPlaceScreen.pickCustomRetractPosXMsg }) ||
      !checkEmpty({ yRetract: checkPickPlaceScreen.pickCustomRetractPosYMsg }) ||
      !checkEmpty({ zRetract: checkPickPlaceScreen.pickCustomRetractPosZMsg });

    const isEmptyPlaceApproach =
      !checkEmpty({ xApproach: checkPickPlaceScreen.placeCustomApproachPosXMsg }) ||
      !checkEmpty({ yApproach: checkPickPlaceScreen.placeCustomApproachPosYMsg }) ||
      !checkEmpty({ zApproach: checkPickPlaceScreen.placeCustomApproachPosZMsg });

    const isEmptyPlaceRetract =
      !checkEmpty({ xRetract: checkPickPlaceScreen.placeCustomRetractPosXMsg }) ||
      !checkEmpty({ yRetract: checkPickPlaceScreen.placeCustomRetractPosYMsg }) ||
      !checkEmpty({ zRetract: checkPickPlaceScreen.placeCustomRetractPosZMsg });
    const acceptForParseValueIn =
      this.state.pickProductIndex > 0 &&
      currentPickProduct &&
      this.state.pickProductIndex <= Object.keys(this.state.allTopCenterIn).length;
    const acceptForParseValueOut =
      this.state.placeProductIndex > 0 &&
      currentPlaceProduct &&
      this.state.placeProductIndex <= Object.keys(this.state.allTopCenterOut).length;
    return (
      <>
        <Grid
          item={true}
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${PickPlaceStyles['pick-place-screen']}  ${PickPlaceStyles['pd-bot']}`}
          hidden={this.props.isHidden}
        >
          <Container maxWidth={false}>
            <Typography className={PalletStyles['title']}>{t('initial-pose')}</Typography>
            <Grid item container xs>
              <Grid item md={12} lg={7} className={PickPlaceStyles['initial-pose']}>
                <PointsPosition
                  isPose
                  data={dataPose.value}
                  errorMessage={dataPose.error}
                  buttonName="initPose"
                  holdButton={this.props.holdButton}
                  moveToPosition={(type) => this.moveToPosition(type, 'initPose')}
                  stopMoveToPosition={this.props.stopMoveToPosition}
                  disableButton={robotDisconnectandStop}
                  handleChangeInput={(e) => this.checkInput(e, true, true)}
                  validationInput={this.validationPosition}
                  disabled={this.props.running}
                  getCurrentPosition={(type) => this.setValueToPosition(type)}
                >
                  <Grid item xs={12}>
                    <Select
                      disabled
                      IconComponent={ExpandMoreIcon}
                      className={`${PalletStyles['form-select']} ${PalletStyles['mui-outline-input-root']}`}
                      fullWidth
                      defaultValue={0}
                    >
                      <MenuItem value={0}>{t('select-pose-variable')}</MenuItem>
                    </Select>
                  </Grid>
                </PointsPosition>
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Grid container className={PickPlaceStyles['check-position']}>
              <Grid item lg={7} md={12}>
                <Grid container alignItems="center">
                  <Typography className={PickPlaceStyles['title']}>{t('check-pick-position')}</Typography>
                </Grid>
              </Grid>
              <Grid item lg={5} className={PalletStyles['guided-sdk']} md={12} height={'400px'}>
                {this.props.shouldShowSDK && !this.props.isHidden && (
                  <SDKViewer
                    context={this.context}
                    moduleRootPath={this.props.moduleRootPath}
                    robotModel={this.props.robotModel}
                    monitorMotion={true}
                    showDirection={true}
                    showRobot={true}
                    showProductIndex={true}
                    objectData={objectData}
                    showTCP={this.props.gripper.showTCP}
                    inPalletIndex={`${IN_PALLET_PRODUCT_PREFIX}${this.state.pickProductIndex}`}
                    outPalletIndex={`${OUT_PALLET_PRODUCT_PREFIX}${this.state.placeProductIndex}`}
                    inPalletIndexProps={(index) => {
                      if (typeof index === 'number') {
                        return index;
                      } else {
                        return Number(
                          index.substring(
                            index.indexOf(IN_PALLET_PRODUCT_PREFIX) + IN_PALLET_PRODUCT_PREFIX.length,
                            index.length
                          )
                        );
                      }
                    }}
                    outPalletIndexProps={(index) => {
                      if (typeof index === 'number') {
                        return index;
                      } else {
                        return Number(
                          index.substring(
                            index.indexOf(OUT_PALLET_PRODUCT_PREFIX) + OUT_PALLET_PRODUCT_PREFIX.length,
                            index.length
                          )
                        );
                      }
                    }}
                  />
                )}
              </Grid>
              <Grid item lg={7} md={12} className={PickPlaceStyles['position-action-container']}>
                <Grid item xs={12} className={PalletStyles['row-spacing']} marginBottom="1em">
                  <FormLabel className={PalletStyles['form-label-item']}>{t('check-pick-position')}</FormLabel>
                </Grid>
                <Grid xs={12} item container>
                  <Select
                    MenuProps={{
                      style: { zIndex: 285212673 }
                    }}
                    IconComponent={ExpandMoreIcon}
                    className={PalletStyles['button--select']}
                    fullWidth
                    value={this.state.pickProductIndex}
                    onChange={this.selectCheckPickPos}
                    disabled={this.props.running}
                    id={CHECK_PICK_ID}
                    onOpen={(e) => handleOpenMenu(e, CHECK_PICK_ID)}
                  >
                    {this.state.pickProductCount === 0 ? <MenuItem value={0}>{t('select-an-index')}</MenuItem> : <></>}
                    {Array.from(Array(this.state.pickProductCount).keys()).map((item, index) => {
                      return (
                        <MenuItem value={index + 1} key={index + 1}>
                          {`${t('product-index')} ${index + 1}`}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Button
                    className={PalletStyles['button--prev-next__prev']}
                    variant="outlined"
                    disabled={
                      this.state.pickProductCount === 0 || this.state.pickProductIndex === 1 || this.props.running
                    }
                    onClick={() => {
                      this.selectNextPrevIndex('Pick', false);
                    }}
                  >
                    <KeyboardArrowLeft />
                  </Button>
                  <Button
                    className={PalletStyles['button--prev-next']}
                    variant="outlined"
                    disabled={
                      this.state.pickProductCount === 0 ||
                      this.state.pickProductIndex === this.state.pickProductCount ||
                      this.props.running
                    }
                    onClick={() => {
                      this.selectNextPrevIndex('Pick', true);
                    }}
                  >
                    <KeyboardArrowRight />
                  </Button>
                </Grid>
                <Grid xs={12} item container spacing={1} className={PickPlaceStyles['grid-approach-pose']}>
                  <Grid xs={6} item>
                    <Button
                      disableRipple={true}
                      onTouchStart={() => {
                        this.moveToAppRet(pickProductPos, pickApproachDistance, 'pickAppPos');
                      }}
                      onMouseDown={() => {
                        this.moveToAppRet(pickProductPos, pickApproachDistance, 'pickAppPos');
                      }}
                      className={`${PalletStyles['button--move__custom']} ${
                        this.props.holdButton === 'pickAppPos' ? PalletStyles['active'] : ''
                      }`}
                      onTouchEnd={this.props.stopMoveToPosition}
                      onMouseUp={this.props.stopMoveToPosition}
                      onMouseLeave={this.props.stopMoveToPosition}
                      disabled={
                        robotDisconnectandStop ||
                        isEmptyPickApproach ||
                        checkEmpty({
                          xPick: currentPickProduct?.position.x,
                          yPick: currentPickProduct?.position.y,
                          zPick: currentPickProduct?.position.z,
                          aPick: currentPickProduct?.rotation.a,
                          bPick: currentPickProduct?.rotation.b,
                          cPick: currentPickProduct?.rotation.c
                        })
                      }
                      variant="contained"
                    >
                      {t('approach-pose')}
                    </Button>
                  </Grid>
                  <Grid xs={6} item>
                    <Button
                      disableRipple={true}
                      onTouchStart={() => this.moveToAppRet(pickProductPos, pickRetractDistance, 'pickRetPos')}
                      onMouseDown={() => this.moveToAppRet(pickProductPos, pickRetractDistance, 'pickRetPos')}
                      className={`${PalletStyles['button--move__custom']} ${
                        this.props.holdButton === 'pickRetPos' ? PalletStyles['active'] : ''
                      }`}
                      onTouchEnd={this.props.stopMoveToPosition}
                      onMouseUp={this.props.stopMoveToPosition}
                      onMouseLeave={this.props.stopMoveToPosition}
                      disabled={
                        robotDisconnectandStop ||
                        isEmptyPickRetract ||
                        checkEmpty({
                          xPick: currentPickProduct?.position.x,
                          yPick: currentPickProduct?.position.y,
                          zPick: currentPickProduct?.position.z,
                          aPick: currentPickProduct?.rotation.a,
                          bPick: currentPickProduct?.rotation.b,
                          cPick: currentPickProduct?.rotation.c
                        })
                      }
                      variant="contained"
                    >
                      {t('retract-pose')}
                    </Button>
                  </Grid>
                </Grid>
                <Grid xs={12} item>
                  <Button
                    disableRipple={true}
                    onTouchStart={this.moveToPick}
                    onMouseDown={this.moveToPick}
                    className={`${PalletStyles['button--move__custom']} ${
                      this.props.holdButton === 'pickPos' ? PalletStyles['active'] : ''
                    }`}
                    onTouchEnd={this.props.stopMoveToPosition}
                    onMouseUp={this.props.stopMoveToPosition}
                    onMouseLeave={this.props.stopMoveToPosition}
                    disabled={
                      robotDisconnectandStop ||
                      checkEmpty({
                        xPick: currentPickProduct?.position.x,
                        yPick: currentPickProduct?.position.y,
                        zPick: currentPickProduct?.position.z,
                        aPick: currentPickProduct?.rotation.a,
                        bPick: currentPickProduct?.rotation.b,
                        cPick: currentPickProduct?.rotation.c
                      })
                    }
                    variant="contained"
                  >
                    {t('move-to-position')}
                  </Button>
                </Grid>
                <Grid container item md={12} lg={12} className={PalletStyles['grid-text-field']}>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      type="tel"
                      value={
                        acceptForParseValueIn
                          ? parseStringToFloat(currentPickProduct.position.x.toString(), NUMBER_OF_DECIMAL).toFixed(
                              NUMBER_OF_DECIMAL
                            )
                          : ''
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">X</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      type="tel"
                      value={
                        acceptForParseValueIn
                          ? parseStringToFloat(currentPickProduct.position.y.toString(), NUMBER_OF_DECIMAL).toFixed(
                              NUMBER_OF_DECIMAL
                            )
                          : ''
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      type="tel"
                      value={
                        acceptForParseValueIn
                          ? parseStringToFloat(currentPickProduct.position.z.toString(), NUMBER_OF_DECIMAL).toFixed(
                              NUMBER_OF_DECIMAL
                            )
                          : ''
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>

                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      value={
                        acceptForParseValueIn
                          ? parseStringToFloat(
                              currentPickProduct.rotation.a.toString(),
                              NUMBER_OF_DECIMAL_DEGREE
                            ).toFixed(NUMBER_OF_DECIMAL_DEGREE)
                          : ''
                      }
                      type="tel"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">A</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      type="tel"
                      value={
                        acceptForParseValueIn && reverseBPick !== undefined
                          ? parseStringToFloat(reverseBPick.toString(), NUMBER_OF_DECIMAL_DEGREE).toFixed(
                              NUMBER_OF_DECIMAL_DEGREE
                            )
                          : ''
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">B</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      name="pickPosC"
                      type="tel"
                      value={
                        acceptForParseValueIn && reverseCPick !== undefined
                          ? parseStringToFloat(reverseCPick.toString(), NUMBER_OF_DECIMAL_DEGREE).toFixed(
                              NUMBER_OF_DECIMAL_DEGREE
                            )
                          : ''
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">C</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                      }}
                      disabled
                    />
                  </Grid>
                  <Grid container item md={12} lg={12} className={PalletStyles['row-spacing-switch']}>
                    <Typography
                      variant="body1"
                      className={`${PalletStyles['text-for-switch']} ${PickPlaceStyles['typo-approacht-dis']}`}
                    >
                      {t('approach-distance')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomApproachPosXMsg')}
                      error={!!checkPickPlaceScreen.pickCustomApproachPosXMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomApproachPosX}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">X</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomApproachPosX"
                    />
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomApproachPosYMsg')}
                      error={!!checkPickPlaceScreen.pickCustomApproachPosYMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomApproachPosY}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomApproachPosY"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomApproachPosZMsg')}
                      error={!!checkPickPlaceScreen.pickCustomApproachPosZMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomApproachPosZ}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomApproachPosZ"
                    />
                  </Grid>
                  <Grid container item md={12} lg={12}>
                    {showGroupMessage([
                      checkPickPlaceScreen.pickCustomApproachPosXMsg,
                      checkPickPlaceScreen.pickCustomApproachPosYMsg,
                      checkPickPlaceScreen.pickCustomApproachPosZMsg
                    ]).map((msg: string, index: number) => (
                      <FormHelperText className={PalletStyles['error-common']} key={index}>
                        {t(msg)}
                      </FormHelperText>
                    ))}
                  </Grid>
                  <Grid container item md={12} lg={12} className={PalletStyles['row-spacing-switch']}>
                    <Typography
                      variant="body1"
                      className={`${PalletStyles['text-for-switch']} ${PickPlaceStyles['typo-approacht-dis']}`}
                    >
                      {t('retract-distance')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomRetractPosXMsg')}
                      error={!!checkPickPlaceScreen.pickCustomRetractPosXMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomRetractPosX}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">X</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomRetractPosX"
                    />
                  </Grid>
                  <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomRetractPosYMsg')}
                      error={!!checkPickPlaceScreen.pickCustomRetractPosYMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomRetractPosY}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomRetractPosY"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      inputProps={{ maxLength: 11 }}
                      className={PalletStyles['form-label-textfield']}
                      onChange={(e) => this.checkInput(e, true, true)}
                      onBlur={(e) => this.validationPosition(e, 'pickCustomRetractPosZMsg')}
                      error={!!checkPickPlaceScreen.pickCustomRetractPosZMsg?.length}
                      type="tel"
                      value={checkPickPlaceScreen.pickCustomRetractPosZ}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                        endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                      }}
                      disabled={this.props.running}
                      name="pickCustomRetractPosZ"
                    />
                  </Grid>
                  <Grid container item md={12} lg={12}>
                    {showGroupMessage([
                      checkPickPlaceScreen.pickCustomRetractPosXMsg,
                      checkPickPlaceScreen.pickCustomRetractPosYMsg,
                      checkPickPlaceScreen.pickCustomRetractPosZMsg
                    ]).map((msg: string, index: number) => (
                      <FormHelperText className={PalletStyles['error-common']} key={index}>
                        {t(msg)}
                      </FormHelperText>
                    ))}
                  </Grid>
                  <Divider variant="middle" className={PalletStyles['custom-devider']} />
                  <Grid item xs={12} className={PickPlaceStyles['check-place-position']}>
                    <Grid container alignItems="center">
                      <Typography className={PickPlaceStyles['title']}>{t('check-place-pos')}</Typography>
                    </Grid>
                    <Grid item xs={12} className={PalletStyles['row-spacing']} marginBottom="1em">
                      <FormLabel className={PalletStyles['form-label-item']}>{t('check-place-pos')}</FormLabel>
                    </Grid>
                    <Grid xs={12} item container>
                      <Select
                        MenuProps={{
                          style: { zIndex: 285212673 }
                        }}
                        IconComponent={ExpandMoreIcon}
                        className={PalletStyles['button--select']}
                        fullWidth
                        value={this.state.placeProductIndex}
                        onChange={this.selectCheckPlacePos}
                        disabled={this.props.running}
                        id={CHECK_PLACE_ID}
                        onOpen={(e) => handleOpenMenu(e, CHECK_PLACE_ID)}
                      >
                        {this.state.placeProductCount === 0 ? (
                          <MenuItem value={0}>{t('select-an-index')}</MenuItem>
                        ) : (
                          <></>
                        )}
                        {Array.from(Array(this.state.placeProductCount).keys()).map((item, index) => {
                          return (
                            <MenuItem value={index + 1} key={index + 1}>
                              {`${t('product-index')} ${index + 1}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                      <Button
                        className={PalletStyles['button--prev-next__prev']}
                        variant="outlined"
                        disabled={
                          this.state.placeProductCount === 0 || this.state.placeProductIndex === 1 || this.props.running
                        }
                        onClick={() => {
                          this.selectNextPrevIndex('Place', false);
                        }}
                      >
                        <KeyboardArrowLeft />
                      </Button>
                      <Button
                        className={PalletStyles['button--prev-next']}
                        variant="outlined"
                        disabled={
                          this.state.placeProductCount === 0 ||
                          this.state.placeProductIndex === this.state.placeProductCount ||
                          this.props.running
                        }
                        onClick={() => {
                          this.selectNextPrevIndex('Place', true);
                        }}
                      >
                        <KeyboardArrowRight />
                      </Button>
                    </Grid>

                    <Grid xs={12} item container spacing={1} className={PickPlaceStyles['grid-approach-pose']}>
                      <Grid xs={6} item>
                        <Button
                          disableRipple={true}
                          onTouchStart={() => {
                            this.moveToAppRet(placeProductPos, placeApproachDistance, 'placeAppPos');
                          }}
                          onMouseDown={() => {
                            this.moveToAppRet(placeProductPos, placeApproachDistance, 'placeAppPos');
                          }}
                          className={`${PalletStyles['button--move__custom']} ${
                            this.props.holdButton === 'placeAppPos' ? PalletStyles['active'] : ''
                          }`}
                          onTouchEnd={this.props.stopMoveToPosition}
                          onMouseUp={this.props.stopMoveToPosition}
                          onMouseLeave={this.props.stopMoveToPosition}
                          disabled={
                            robotDisconnectandStop ||
                            isEmptyPlaceApproach ||
                            checkEmpty({
                              xPick: currentPlaceProduct?.position.x,
                              yPick: currentPlaceProduct?.position.y,
                              zPick: currentPlaceProduct?.position.z,
                              aPick: currentPlaceProduct?.rotation.a,
                              bPick: currentPlaceProduct?.rotation.b,
                              cPick: currentPlaceProduct?.rotation.c
                            })
                          }
                          variant="contained"
                        >
                          {t('approach-pose')}
                        </Button>
                      </Grid>
                      <Grid xs={6} item>
                        <Button
                          disableRipple={true}
                          onTouchStart={() => this.moveToAppRet(placeProductPos, placeRetractDistance, 'placeRetPos')}
                          onMouseDown={() => this.moveToAppRet(placeProductPos, placeRetractDistance, 'placeRetPos')}
                          className={`${PalletStyles['button--move__custom']} ${
                            this.props.holdButton === 'placeRetPos' ? PalletStyles['active'] : ''
                          }`}
                          onTouchEnd={this.props.stopMoveToPosition}
                          onMouseUp={this.props.stopMoveToPosition}
                          onMouseLeave={this.props.stopMoveToPosition}
                          disabled={
                            robotDisconnectandStop ||
                            isEmptyPlaceRetract ||
                            checkEmpty({
                              xPick: currentPlaceProduct?.position.x,
                              yPick: currentPlaceProduct?.position.y,
                              zPick: currentPlaceProduct?.position.z,
                              aPick: currentPlaceProduct?.rotation.a,
                              bPick: currentPlaceProduct?.rotation.b,
                              cPick: currentPlaceProduct?.rotation.c
                            })
                          }
                          variant="contained"
                        >
                          {t('retract-pose')}
                        </Button>
                      </Grid>
                    </Grid>

                    <Grid xs={12} item>
                      <Button
                        disableRipple={true}
                        onTouchStart={this.moveToPlace}
                        onMouseDown={this.moveToPlace}
                        className={`${PalletStyles['button--move__custom']} ${
                          this.props.holdButton === 'placePos' ? PalletStyles['active'] : ''
                        }`}
                        onTouchEnd={this.props.stopMoveToPosition}
                        onMouseUp={this.props.stopMoveToPosition}
                        onMouseLeave={this.props.stopMoveToPosition}
                        disabled={
                          robotDisconnectandStop ||
                          checkEmpty({
                            xPlace: currentPlaceProduct?.position.x,
                            yPlace: currentPlaceProduct?.position.y,
                            zPlace: currentPlaceProduct?.position.z,
                            aPlace: currentPlaceProduct?.rotation.a,
                            bPlace: currentPlaceProduct?.rotation.b,
                            cPlace: currentPlaceProduct?.rotation.c
                          })
                        }
                        variant="contained"
                      >
                        {t('move-to-position')}
                      </Button>
                    </Grid>

                    <Grid container item md={12} lg={12}>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          type="tel"
                          value={
                            acceptForParseValueOut
                              ? parseStringToFloat(
                                  currentPlaceProduct.position.x.toString(),
                                  NUMBER_OF_DECIMAL
                                ).toFixed(NUMBER_OF_DECIMAL)
                              : ''
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start">X</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          type="tel"
                          value={
                            acceptForParseValueOut
                              ? parseStringToFloat(
                                  currentPlaceProduct.position.y.toString(),
                                  NUMBER_OF_DECIMAL
                                ).toFixed(NUMBER_OF_DECIMAL)
                              : ''
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          type="tel"
                          value={
                            acceptForParseValueOut
                              ? parseStringToFloat(
                                  currentPlaceProduct.position.z.toString(),
                                  NUMBER_OF_DECIMAL
                                ).toFixed(NUMBER_OF_DECIMAL)
                              : ''
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          value={
                            acceptForParseValueOut
                              ? parseStringToFloat(
                                  currentPlaceProduct.rotation.a.toString(),
                                  NUMBER_OF_DECIMAL_DEGREE
                                ).toFixed(NUMBER_OF_DECIMAL_DEGREE)
                              : ''
                          }
                          type="tel"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">A</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          type="tel"
                          value={
                            acceptForParseValueOut && reverseBPlace !== undefined
                              ? parseStringToFloat(reverseBPlace.toString(), NUMBER_OF_DECIMAL_DEGREE).toFixed(
                                  NUMBER_OF_DECIMAL_DEGREE
                                )
                              : ''
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start">B</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          name="placePosC"
                          type="tel"
                          value={
                            acceptForParseValueOut && reverseCPlace !== undefined
                              ? parseStringToFloat(reverseCPlace.toString(), NUMBER_OF_DECIMAL_DEGREE).toFixed(
                                  NUMBER_OF_DECIMAL_DEGREE
                                )
                              : ''
                          }
                          InputProps={{
                            startAdornment: <InputAdornment position="start">C</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                          }}
                          disabled
                        />
                      </Grid>
                      <Grid container item md={12} lg={12} className={PalletStyles['row-spacing-switch']}>
                        <Typography
                          variant="body1"
                          className={`${PalletStyles['text-for-switch']} ${PickPlaceStyles['typo-approacht-dis']}`}
                        >
                          {t('approach-distance')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomApproachPosXMsg')}
                          error={!!checkPickPlaceScreen.placeCustomApproachPosXMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomApproachPosX}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">X</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomApproachPosX"
                        />
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomApproachPosYMsg')}
                          error={!!checkPickPlaceScreen.placeCustomApproachPosYMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomApproachPosY}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomApproachPosY"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomApproachPosZMsg')}
                          error={!!checkPickPlaceScreen.placeCustomApproachPosZMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomApproachPosZ}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomApproachPosZ"
                        />
                      </Grid>
                      <Grid container item md={12} lg={12}>
                        {showGroupMessage([
                          checkPickPlaceScreen.placeCustomApproachPosXMsg,
                          checkPickPlaceScreen.placeCustomApproachPosYMsg,
                          checkPickPlaceScreen.placeCustomApproachPosZMsg
                        ]).map((msg: string, index: number) => (
                          <FormHelperText className={PalletStyles['error-common']} key={index}>
                            {t(msg)}
                          </FormHelperText>
                        ))}
                      </Grid>
                      <Grid container item md={12} lg={12} className={PalletStyles['row-spacing-switch']}>
                        <Typography
                          variant="body1"
                          className={`${PalletStyles['text-for-switch']} ${PickPlaceStyles['typo-approacht-dis']}`}
                        >
                          {t('retract-distance')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomRetractPosXMsg')}
                          error={!!checkPickPlaceScreen.placeCustomRetractPosXMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomRetractPosX}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">X</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomRetractPosX"
                        />
                      </Grid>
                      <Grid item xs={4} className={PickPlaceStyles['pd-right']}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomRetractPosYMsg')}
                          error={!!checkPickPlaceScreen.placeCustomRetractPosYMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomRetractPosY}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomRetractPosY"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          inputProps={{ maxLength: 11 }}
                          className={PalletStyles['form-label-textfield']}
                          onChange={(e) => this.checkInput(e, true, true)}
                          onBlur={(e) => this.validationPosition(e, 'placeCustomRetractPosZMsg')}
                          error={!!checkPickPlaceScreen.placeCustomRetractPosZMsg?.length}
                          type="tel"
                          value={checkPickPlaceScreen.placeCustomRetractPosZ}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                          disabled={this.props.running}
                          name="placeCustomRetractPosZ"
                        />
                      </Grid>
                      <Grid container item md={12} lg={12}>
                        {showGroupMessage([
                          checkPickPlaceScreen.placeCustomRetractPosXMsg,
                          checkPickPlaceScreen.placeCustomRetractPosYMsg,
                          checkPickPlaceScreen.placeCustomRetractPosZMsg
                        ]).map((msg: string, index: number) => (
                          <FormHelperText className={PalletStyles['error-common']} key={index}>
                            {t(msg)}
                          </FormHelperText>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Grid>
        <DialogCommon
          openDialog={this.state.getPoseWarning}
          type={'getposition'}
          content={'getposition'}
          messageContent={t('WAR_007')}
          handleConfirm={() => {
            this.setState({ getPoseWarning: false });
          }}
          handleCloseDialog={() => this.setState({ getPoseWarning: false })}
        />
      </>
    );
  }
}

function mapStateToProps(state: CalibrateAndCheckPickPlaceMapTopProps) {
  return {
    productInformation: state.product,
    inPalletInformation: state.inPallet,
    outPalletInformation: state.outPallet,
    calibrationInformation: state.calibration,
    running: state.run.running,
    checkPickPlaceScreen: state.checkPickPlace,
    gripper: state.gripper,
    gripperType: state.deviceShortCut.gripperType
  };
}
function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setCheckPickPlaceInformation: (action: { payload: { [key: string]: string | boolean } }) =>
      dispatch(setCheckPickPlaceInformation(action.payload))
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing', { withRef: true })(CheckPickPlaceScreen)
);
