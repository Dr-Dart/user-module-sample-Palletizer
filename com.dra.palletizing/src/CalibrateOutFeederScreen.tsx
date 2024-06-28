/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Button,
  Container,
  Divider,
  FormLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Context, IDartDatabase, RobotSpace, SixNumArray} from 'dart-api';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import PointsPosition from './components/PointsPosition';
import {
  MAX_ORIGIN_DEGREE,
  MIN_ORIGIN_DEGREE,
  NUMBER_OF_DECIMAL,
  NUMBER_OF_DECIMAL_DEGREE,
  PALLET_HEIGHT,
  STRING_EMPTY,
  TABLE_OUTFEEDER_POSITION,
  THREE_NUMBER_OF_DECIMAL
} from './consts';
import { calculateAngleBetweenTwoVector } from './CoorCalculation';
import { setCalibrationInformation } from './redux/CalibrationSlice';

import { ObjectInfo, SDKViewer } from './sdk';
import { Position } from './sdk/src/components/LayoutDisplay/NewDisplayViewer';

import {
  CalibrateAndCheckPickPlaceMapTopProps,
  CalibState,
  HoldButton,
  InPalletReducer,
  OutPalletInformation,
  ProductInformation,
  SetPosition,
  Point,
} from './type';
import {
  calculatorSimulation,
  isFloatNumber,
  isIntegerNumber,
  validationPosition,
  parseStringToFloat,
  generateVector,
  isDuplicatePoint,
  checkSameLine,
  generateOutFeederPallet,
  generateCamPos,
  isArrayIntersect,
  getDiffKey
} from './util';
import { calcPosCamToPalletOut } from './CoorCalculation';
import { ModuleContext } from './ModuleContext';
import DialogCommon from './DialogCommon';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import CALIBRATION_POINTS from './assets/images/calibration_points.png';
import { withTranslation, TFunction } from 'react-i18next';
import PalletStyles from './assets/styles/style.scss';
import CalibOutFeederStyles from './assets/styles/calibrateOutFeeder.scss';
import FeederScreenStyles from './assets/styles/feederScreen.scss';

type CalibScreenState = {
  loaded: boolean;
  changed: boolean;

  calibOptA1?: string;
  calibOptA2?: string;
  calibOptB1?: string;
  calibOptB2?: string;
  calibOptC1?: string;
  calibOptC2?: string;

  clickable: boolean;
  settingChanged: boolean;
  firstLoad: boolean;
  productCoorData: { [key: string]: ObjectInfo };
  camPos: Position;
  camTarget: Position;
  getPoseWarning: boolean;
};

declare const window: any;
type CalibrateOutFeederProps = {
  handleSavePosition?: () => Promise<number[]>;
  handleMovePosition?: () => void;
  isHidden: boolean;
  getCurrentPosition: (roboSapce: RobotSpace, cb: SetPosition) => void;
  holdButton: string;
  isRobotConnected: boolean;
  calibSettingChanged: boolean;
  setCalibSettingChanged: (changed: boolean) => void;
  productInformation: ProductInformation;
  inPalletInformation: InPalletReducer;
  outPalletInformation: OutPalletInformation;
  calibrationInformation: CalibState;
  setCalibrationInformation: (action: { payload: { [key: string]: string | boolean } }) => void;
  projectId: string;
  running: boolean;
  moduleRootPath: string;
  robotModel: string;
  showSDK?: boolean;
  gripperType: string;
  projectName?: string;
  setDataChanged?: (change: boolean) => void;
  t: TFunction;
};
class CalibrateOutFeederScreen extends Component<CalibrateOutFeederProps, CalibScreenState> {
  private db: IDartDatabase;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: CalibrateOutFeederProps) {
    super(props);
    this.state = {
      changed: false,
      loaded: false,
      clickable: true,
      firstLoad: true,
      settingChanged: false,
      productCoorData: {
        pallet: {
          position: {
            x: 0,
            y: 0,
            z: 0
          },
          rotation: {
            a: 0,
            b: 0,
            c: 0
          },
          dimmension: {
            length: 1000,
            width: 1000,
            height: 100
          },
          type: 'pallet'
        }
      },
      camPos: { x: 0, y: 0, z: 0 },
      camTarget: { x: 0, y: 0, z: 0 },
      getPoseWarning: false
    };
    window.saveOutFeederPalletPosition = this.saveOutFeederPalletPosition.bind(this);
  }

  shouldComponentUpdate(nextProps: CalibrateOutFeederProps) {
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

  loadCalibrateOutFeeder = async () => {
    this.props?.setCalibSettingChanged?.(true);
    const queryResult = await this.db?.query(TABLE_OUTFEEDER_POSITION.name, TABLE_OUTFEEDER_POSITION.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const data = {
        calibPosX: queryResult[0].data['xOrigin'],
        calibPosY: queryResult[0].data['yOrigin'],
        calibPosZ: queryResult[0].data['zOrigin'],
        isDisplayOpt1: true,
        calibOptX1: queryResult[0].data['xOptionalPoint1'],
        calibOptY1: queryResult[0].data['yOptionalPoint1'],
        calibOptZ1: queryResult[0].data['zOptionalPoint1'],
        isDisplayOpt2: true,
        calibOptX2: queryResult[0].data['xOptionalPoint2'],
        calibOptY2: queryResult[0].data['yOptionalPoint2'],
        calibOptZ2: queryResult[0].data['zOptionalPoint2'],
        calibPosXMsg: queryResult[0].data['calibPosXMsg'],
        calibPosYMsg: queryResult[0].data['calibPosYMsg'],
        calibPosZMsg: queryResult[0].data['calibPosZMsg'],
        calibOptX1Msg: queryResult[0].data['calibOptX1Msg'],
        calibOptX2Msg: queryResult[0].data['calibOptX2Msg'],
        calibOptY1Msg: queryResult[0].data['calibOptY1Msg'],
        calibOptY2Msg: queryResult[0].data['calibOptY2Msg'],
        calibOptZ1Msg: queryResult[0].data['calibOptZ1Msg'],
        calibOptZ2Msg: queryResult[0].data['calibOptZ2Msg'],
        calibOptDuplicate: queryResult[0].data['calibOptDuplicate'],
        calibOpt1Duplicate: queryResult[0].data['calibOpt1Duplicate'],
        calibOpt2Duplicate: queryResult[0].data['calibOpt2Duplicate'],
        calibFormAngle: queryResult[0].data['calibFormAngle'],
        calibOptStraightAway: queryResult[0].data['calibOptStraightAway']
      };
      this.props.setCalibrationInformation({ payload: data } as unknown as {
        payload: { [key: string]: string | boolean };
      });
    }
    const DEFAULT_WIDTH_PALLET = 1219;
    const DEFAULT_HEIGHT_PALLET = 1016;
    this.setState({
      camPos: calcPosCamToPalletOut(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        {
          height: PALLET_HEIGHT,
          width: Number(this.props.outPalletInformation.width || DEFAULT_WIDTH_PALLET),
          length: Number(this.props.outPalletInformation.length || DEFAULT_HEIGHT_PALLET)
        }
      )
    });
  };

  saveOutFeederPalletPosition = async (projectId: string) => {
    const { calibrationInformation } = this.props;
    /* istanbul ignore next */
    await this.db
      ?.update(
        TABLE_OUTFEEDER_POSITION.name,
        { projectId: projectId },
        {
          projectId: projectId,
          xOrigin: calibrationInformation.calibPosX,
          yOrigin: calibrationInformation.calibPosY,
          zOrigin: calibrationInformation.calibPosZ,
          aOrigin: '',
          bOrigin: '',
          cOrigin: '',

          optionalPoint1: Number(calibrationInformation.isDisplayOpt1).toString(),
          xOptionalPoint1: calibrationInformation.calibOptX1,
          yOptionalPoint1: calibrationInformation.calibOptY1,
          zOptionalPoint1: calibrationInformation.calibOptZ1,

          optionalPoint2: Number(calibrationInformation.isDisplayOpt2).toString(),
          xOptionalPoint2: calibrationInformation.calibOptX2,
          yOptionalPoint2: calibrationInformation.calibOptY2,
          zOptionalPoint2: calibrationInformation.calibOptZ2,

          calibPosXMsg: calibrationInformation.calibPosXMsg,
          calibPosYMsg: calibrationInformation.calibPosYMsg,
          calibPosZMsg: calibrationInformation.calibPosZMsg,
          calibPosAMsg: '',
          calibPosBMsg: '',
          calibPosCMsg: '',
          calibOptX1Msg: calibrationInformation.calibOptX1Msg,
          calibOptX2Msg: calibrationInformation.calibOptX2Msg,
          calibOptY1Msg: calibrationInformation.calibOptY1Msg,
          calibOptY2Msg: calibrationInformation.calibOptY2Msg,
          calibOptZ1Msg: calibrationInformation.calibOptZ1Msg,
          calibOptZ2Msg: calibrationInformation.calibOptZ2Msg,

          calibOptDuplicate: calibrationInformation.calibOptDuplicate,
          calibOpt1Duplicate: calibrationInformation.calibOpt1Duplicate,
          calibOpt2Duplicate: calibrationInformation.calibOpt2Duplicate,
          calibFormAngle: calibrationInformation.calibFormAngle,
          calibOptStraightAway: calibrationInformation.calibOptStraightAway
        }
      )
      .then((countRowUpdated) => {
        if (countRowUpdated === 0) {
          this.db
            ?.delete(TABLE_OUTFEEDER_POSITION.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_OUTFEEDER_POSITION.name, [
                projectId,
                calibrationInformation.calibPosX,
                calibrationInformation.calibPosY,
                calibrationInformation.calibPosZ,
                '',
                '',
                '',

                Number(calibrationInformation.isDisplayOpt1).toString(),
                calibrationInformation.calibOptX1,
                calibrationInformation.calibOptY1,
                calibrationInformation.calibOptZ1,

                Number(calibrationInformation.isDisplayOpt2).toString(),
                calibrationInformation.calibOptX2,
                calibrationInformation.calibOptY2,
                calibrationInformation.calibOptZ2,

                calibrationInformation.calibPosXMsg,
                calibrationInformation.calibPosYMsg,
                calibrationInformation.calibPosZMsg,
                '',
                '',
                '',
                calibrationInformation.calibOptX1Msg,
                calibrationInformation.calibOptX2Msg,
                calibrationInformation.calibOptY1Msg,
                calibrationInformation.calibOptY2Msg,
                calibrationInformation.calibOptZ1Msg,
                calibrationInformation.calibOptZ2Msg,

                calibrationInformation.calibOptDuplicate,
                calibrationInformation.calibOpt1Duplicate,
                calibrationInformation.calibOpt2Duplicate,
                calibrationInformation.calibFormAngle,
                calibrationInformation.calibOptStraightAway
              ]);
            });
        }
      });
  };
  /* istanbul ignore next */
  haschanged = (): boolean => this.state.changed;
  /* istanbul ignore next */
  saved = () => this.setState({ changed: false });

  checkError = (params: { [key: string]: string }): boolean => {
    let isError = false;
    Object.entries(params).forEach(([key, el]) => {
      if (key.includes('Error')) {
        if (el.length > 0) {
          isError = true;
        }
      }
      if (key.includes('Data')) {
        if (el === '') {
          isError = true;
        }
      }
    });
    return isError;
  };

  hasError = (): boolean => {
    const { calibrationInformation } = this.props;
    return this.checkError({
      calibPosXError: calibrationInformation.calibPosXMsg,
      calibPosYError: calibrationInformation.calibPosYMsg,
      calibPosZError: calibrationInformation.calibPosZMsg,
      calibOptXError: calibrationInformation.calibOptX1Msg,
      calibOptYError: calibrationInformation.calibOptY1Msg,
      calibOptZError: calibrationInformation.calibOptZ1Msg,
      calibOptX1Data: calibrationInformation.calibOptX1,
      calibOptY1Data: calibrationInformation.calibOptY1,
      calibOptZ1Data: calibrationInformation.calibOptZ1,
      calibOptX2Error: calibrationInformation.calibOptX2Msg,
      calibOptY2Error: calibrationInformation.calibOptY2Msg,
      calibOptZ2Error: calibrationInformation.calibOptZ2Msg,
      calibOptX2Data: calibrationInformation.calibOptX2,
      calibOptY2Data: calibrationInformation.calibOptY2,
      calibOptZ2Data: calibrationInformation.calibOptZ2,
      calibPosXData: calibrationInformation.calibPosX,
      calibPosYData: calibrationInformation.calibPosY,
      calibPosZData: calibrationInformation.calibPosZ,
      calibOpt1DuplicateError: calibrationInformation.calibOpt1Duplicate,
      calibOpt2DuplicateError: calibrationInformation.calibOpt2Duplicate,
      calibOptDuplicateError: calibrationInformation.calibOptDuplicate,
      calibOptStraightAwayError: calibrationInformation.calibOptStraightAway,
      calibFormAngleError: calibrationInformation.calibFormAngle
    });
  };

  checkInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isCheckFloat = true,
    acceptNegative = false
  ) => {
    /* istanbul ignore next */
    const { name, value, selectionStart, selectionEnd } = event.target;
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }
    const isNumber = isCheckFloat ? isFloatNumber(value, acceptNegative) : isIntegerNumber(value, acceptNegative);
    if (value === '' || isNumber) {
      this.props.setCalibrationInformation({
        payload: {
          [name]: value
        }
      });
    } else {
      event.target.selectionStart = selectionStart - 1;
      event.target.selectionEnd = selectionEnd - 1;
    }
  };

  /* istanbul ignore next */
  between = (value: number, min: number, max: number) => value >= min && value <= max;

  validationPosition = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, errorType: string) => {
    const { name } = event.target;
    const result = validationPosition(event);
    this.validatePoint(name, result, errorType, true);

    // Return when blur error
    if (typeof result === 'string') {
      // return scrollToElement(event.target);
    }
  };

  setValueToPosition = (type: RobotSpace, positionType: 'calibPos' | 'calibOpt', optionalPoint?: 1 | 2) => {
    const isCurrentProject = !!this.props.gripperType;
    /* istanbul ignore next */
    if (isCurrentProject) {
      this.props.getCurrentPosition(type, (data: SixNumArray) => {
        const payload = {};
        if (positionType === 'calibPos') {
          Object.assign(payload, {
            [`calibPosX`]: data[0].toFixed(NUMBER_OF_DECIMAL),
            [`calibPosY`]: data[1].toFixed(NUMBER_OF_DECIMAL),
            [`calibPosZ`]: data[2].toFixed(NUMBER_OF_DECIMAL),
            [`calibPosA`]: data[3].toFixed(NUMBER_OF_DECIMAL_DEGREE),
            [`calibPosB`]: data[4].toFixed(NUMBER_OF_DECIMAL_DEGREE),
            [`calibPosC`]: data[5].toFixed(NUMBER_OF_DECIMAL_DEGREE),
            [`calibPosXMsg`]: '',
            [`calibPosYMsg`]: '',
            [`calibPosZMsg`]: '',
            [`calibPosAMsg`]: '',
            [`calibPosBMsg`]: '',
            [`calibPosCMsg`]: ''
          });
        } else {
          if (optionalPoint) {
            Object.assign(payload, {
              [`calibOptX${optionalPoint}`]: data[0].toFixed(NUMBER_OF_DECIMAL),
              [`calibOptY${optionalPoint}`]: data[1].toFixed(NUMBER_OF_DECIMAL),
              [`calibOptZ${optionalPoint}`]: data[2].toFixed(NUMBER_OF_DECIMAL),
              [`${positionType}X${optionalPoint}Msg`]: '',
              [`${positionType}Y${optionalPoint}Msg`]: '',
              [`${positionType}Z${optionalPoint}Msg`]: ''
            });
          }
        }
        this.props.setCalibrationInformation({
          payload: payload
        });
        this.validatePoint('', {}, '', false);
      });
    } else {
      this.setState({ getPoseWarning: true });
    }
  };

  /* istanbul ignore next */
  moveToPosition = (
    moveType: RobotSpace,
    holdButton: HoldButton,
    positionType: 'calibPos' | 'calibOpt',
    optionalPoint?: 1 | 2
  ) => {
    let pos = [0, 0, 0, 0, 0, 0] as SixNumArray;
    const { calibrationInformation } = this.props;
    if (positionType === 'calibPos') {
      pos = [
        Number(calibrationInformation.calibPosX),
        Number(calibrationInformation.calibPosY),
        Number(calibrationInformation.calibPosZ),
        0,
        0,
        0
      ];
    } else {
      if (optionalPoint) {
        pos = [
          Number(calibrationInformation[`calibOptX${optionalPoint}`]),
          Number(calibrationInformation[`calibOptY${optionalPoint}`]),
          Number(calibrationInformation[`calibOptZ${optionalPoint}`]),
          0,
          0,
          0
        ];
      }
    }
  };

  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadCalibrateOutFeeder().finally(() => this.setState({ loaded: true }));
  }

  componentDidUpdate(prevProps: CalibrateOutFeederProps, prevState: CalibScreenState) {
    const { ...previousProps } = prevProps.calibrationInformation;
    const { ...currentProps } = this.props.calibrationInformation;
    /* istanbul ignore next */
    if (prevState.loaded && !this.state.changed) {
      if (JSON.stringify(previousProps) !== JSON.stringify(currentProps)) {
        this.setState({ changed: true });
      }
    }

    const fieldTocheck = [
      'calibPosX',
      'calibPosY',
      'calibPosZ',
      'calibOptX1',
      'calibOptY1',
      'calibOptZ1',
      'calibOptX2',
      'calibOptY2',
      'calibOptZ2'
    ];
    if (isArrayIntersect(fieldTocheck, getDiffKey({ ...currentProps }, { ...previousProps }))) {
      this.props.setCalibSettingChanged(true);
      this.props.setDataChanged?.(true);
    }
  }

  onClick3DSimulation = () => {
    if (this.state.clickable) {
      this.setState({ clickable: false });
      this.setState({
        productCoorData: generateOutFeederPallet(
          this.props.productInformation,
          this.props.inPalletInformation,
          this.props.outPalletInformation,
          this.props.calibrationInformation
        )
      });
      this.setState(
        {
          camPos: {
            x: 0,
            y: 0,
            z: 0
          }
        },
        () => {
          this.setState({ camPos: generateCamPos(this.props.outPalletInformation, this.props.calibrationInformation) });
        }
      );
      this.setState({
        camTarget: {
          x: Number(this.props.calibrationInformation.calibPosX),
          y: Number(this.props.calibrationInformation.calibPosY),
          z: Number(this.props.calibrationInformation.calibPosZ)
        }
      });
      this.props.setCalibSettingChanged(false);
      setTimeout(() => {
        this.setState({ clickable: true });
      }, 300);
    }
  };

  getOriginPoint = (fieldMerge: { [key: string]: string }): Point | null => {
    if (
      !this.checkError({
        calibPosXMsgError: fieldMerge.calibPosXMsg,
        calibPosYMsgError: fieldMerge.calibPosYMsg,
        calibPosZMsgError: fieldMerge.calibPosZMsg,
        calibPosXData: fieldMerge.calibPosX,
        calibPosYData: fieldMerge.calibPosY,
        calibPosZData: fieldMerge.calibPosZ
      })
    ) {
      return {
        x: parseStringToFloat(fieldMerge.calibPosX, THREE_NUMBER_OF_DECIMAL),
        y: parseStringToFloat(fieldMerge.calibPosY, THREE_NUMBER_OF_DECIMAL),
        z: parseStringToFloat(fieldMerge.calibPosZ, THREE_NUMBER_OF_DECIMAL)
      };
    }
    return null;
  };

  getOptionalPoint1 = (fieldMerge: { [key: string]: string }): Point | null => {
    if (
      !this.checkError({
        calibOptX1MsgError: fieldMerge.calibOptX1Msg,
        calibOptY1MsgError: fieldMerge.calibOptY1Msg,
        calibOptZ1MsgError: fieldMerge.calibOptZ1Msg,
        calibOptX1Data: fieldMerge.calibOptX1,
        calibOptY1Data: fieldMerge.calibOptY1,
        calibOptZ1Data: fieldMerge.calibOptZ1
      })
    ) {
      return {
        x: parseStringToFloat(fieldMerge.calibOptX1, THREE_NUMBER_OF_DECIMAL),
        y: parseStringToFloat(fieldMerge.calibOptY1, THREE_NUMBER_OF_DECIMAL),
        z: parseStringToFloat(fieldMerge.calibOptZ1, THREE_NUMBER_OF_DECIMAL)
      };
    }
    return null;
  };

  getOptionalPoint2 = (fieldMerge: { [key: string]: string }): Point | null => {
    if (
      !this.checkError({
        calibOptX2MsgError: fieldMerge.calibOptX2Msg,
        calibOptY2MsgError: fieldMerge.calibOptY2Msg,
        calibOptZ2MsgError: fieldMerge.calibOptZ2Msg,
        calibOptX2Data: fieldMerge.calibOptX2,
        calibOptY2Data: fieldMerge.calibOptY2,
        calibOptZ2Data: fieldMerge.calibOptZ2
      })
    ) {
      return {
        x: parseStringToFloat(fieldMerge.calibOptX2, THREE_NUMBER_OF_DECIMAL),
        y: parseStringToFloat(fieldMerge.calibOptY2, THREE_NUMBER_OF_DECIMAL),
        z: parseStringToFloat(fieldMerge.calibOptZ2, THREE_NUMBER_OF_DECIMAL)
      };
    }
    return null;
  };
  /**
   * Get all props old
   * @param isBlur blur input
   */
  getOldProps = (isBlur: boolean) => {
    const errorField: { [key: string]: string } = {
      calibPosYMsg: '',
      calibPosXMsg: '',
      calibPosZMsg: '',
      calibOptX1Msg: '',
      calibOptX2Msg: '',
      calibOptY1Msg: '',
      calibOptY2Msg: '',
      calibOptZ1Msg: '',
      calibOptZ2Msg: ''
    };
    const field: { [key: string]: string } = {
      calibPosX: '',
      calibPosY: '',
      calibPosZ: '',
      calibOptX1: '',
      calibOptY1: '',
      calibOptZ1: '',
      calibOptX2: '',
      calibOptY2: '',
      calibOptZ2: ''
    };
    const propState: { [key: string]: string | boolean } = { ...this.props.calibrationInformation };
    const propState1: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(propState)) {
      if (typeof value === 'boolean') {
        propState1[key] = STRING_EMPTY;
      } else {
        propState1[key] = value;
      }
    }
    if (isBlur) {
      for (const key of Object.keys(errorField)) {
        if (!['ERR_016', 'ERR_017'].includes(propState1[key])) {
          errorField[key] = propState1[key];
        }
      }
    }
    for (const key of Object.keys(field)) {
      field[key] = propState1[key];
    }
    return Object.assign(errorField, field);
  };

  setError = (fieldMerge: { [key: string]: string | boolean }, type: string, errorType: string) => {
    if (type.includes('dupboth')) {
      fieldMerge.calibPosYMsg = errorType;
      fieldMerge.calibPosXMsg = errorType;
      fieldMerge.calibPosZMsg = errorType;

      fieldMerge.calibOptY2Msg = errorType;
      fieldMerge.calibOptX2Msg = errorType;
      fieldMerge.calibOptZ2Msg = errorType;

      fieldMerge.calibOptX1Msg = errorType;
      fieldMerge.calibOptY1Msg = errorType;
      fieldMerge.calibOptZ1Msg = errorType;
    } else if (type.includes('dup1')) {
      fieldMerge.calibPosYMsg = errorType;
      fieldMerge.calibPosXMsg = errorType;
      fieldMerge.calibPosZMsg = errorType;
      fieldMerge.calibOptX1Msg = errorType;
      fieldMerge.calibOptY1Msg = errorType;
      fieldMerge.calibOptZ1Msg = errorType;
    } else if (type.includes('dup2')) {
      fieldMerge.calibPosYMsg = errorType;
      fieldMerge.calibPosXMsg = errorType;
      fieldMerge.calibPosZMsg = errorType;
      fieldMerge.calibOptX2Msg = errorType;
      fieldMerge.calibOptY2Msg = errorType;
      fieldMerge.calibOptZ2Msg = errorType;
    } else if (type.includes('duppoint')) {
      fieldMerge.calibOptX1Msg = errorType;
      fieldMerge.calibOptY1Msg = errorType;
      fieldMerge.calibOptZ1Msg = errorType;
      fieldMerge.calibOptX2Msg = errorType;
      fieldMerge.calibOptY2Msg = errorType;
      fieldMerge.calibOptZ2Msg = errorType;
    } else {
      // Remain error is 'formangle' and 'sameline'
      fieldMerge.calibOptX1Msg = errorType;
      fieldMerge.calibOptX2Msg = errorType;
      fieldMerge.calibOptY1Msg = errorType;
      fieldMerge.calibOptY2Msg = errorType;
      fieldMerge.calibOptZ1Msg = errorType;
      fieldMerge.calibOptZ2Msg = errorType;
      fieldMerge.calibPosYMsg = errorType;
      fieldMerge.calibPosXMsg = errorType;
      fieldMerge.calibPosZMsg = errorType;
    }
  };

  checkErrorDuplicatePoint = (
    dup1: boolean,
    dup2: boolean,
    dup12: boolean,
    fieldMerge: { [key: string]: string | boolean }
  ) => {
    if (dup1 && dup2) {
      this.setError(fieldMerge, 'dupboth', 'ERR_016');
    } else if (dup1) {
      this.setError(fieldMerge, 'dup1', 'ERR_016');
    } else if (dup2) {
      this.setError(fieldMerge, 'dup2', 'ERR_016');
    } else if (dup12) {
      this.setError(fieldMerge, 'duppoint', 'ERR_016');
    }
  };
  checkErrorFormAngle = (sameline: boolean | null, angleOrigin: number, fieldMerge: { [key: string]: string }) => {
    if (!sameline && (angleOrigin < MIN_ORIGIN_DEGREE || angleOrigin > MAX_ORIGIN_DEGREE)) {
      this.setError(fieldMerge, 'formangle', 'ERR_017');
    }
  };

  checkErrorSameLine = (sameline: boolean | null, fieldMerge: { [key: string]: string }) => {
    if (sameline) {
      this.setError(fieldMerge, 'sameline', 'ERR_016');
    }
  };

  validatePoint = (
    fieldBlur: string,
    result: string | { [key: string]: string },
    errorType: string,
    isBlur: boolean
  ) => {
    const fieldMerge = this.getOldProps(isBlur);
    if (isBlur) {
      if (typeof result !== 'string') {
        fieldMerge[fieldBlur] = result.value;
        fieldMerge[errorType] = STRING_EMPTY;
      } else {
        fieldMerge[errorType] = result;
      }
    }
    const originPoint = this.getOriginPoint(fieldMerge);
    const optionalPoint1 = this.getOptionalPoint1(fieldMerge);
    const optionalPoint2 = this.getOptionalPoint2(fieldMerge);

    const sameline = checkSameLine(originPoint, optionalPoint1, optionalPoint2);
    const dup1 = isDuplicatePoint(originPoint, optionalPoint1);
    const dup2 = isDuplicatePoint(originPoint, optionalPoint2);
    const dup12 = isDuplicatePoint(optionalPoint1, optionalPoint2);

    let angleOrigin = null;
    const v1 = generateVector(originPoint, optionalPoint1);
    const v2 = generateVector(originPoint, optionalPoint2);

    if (v1 !== null && v2 !== null) {
      angleOrigin = calculateAngleBetweenTwoVector(v1, v2);
      if (!dup1 && !dup2 && !dup12) {
        this.checkErrorSameLine(sameline, fieldMerge);
        this.checkErrorFormAngle(sameline, angleOrigin, fieldMerge);
      }
    }

    this.checkErrorDuplicatePoint(dup1, dup2, dup12, fieldMerge);

    this.props.setCalibrationInformation({
      payload: fieldMerge
    });
  };

  render() {
    const { t } = this.props;
    const { loadedProduct, totalWeight, maxLayer, totalHeight, volumeEfficiency, row, col } = calculatorSimulation(
      this.props.productInformation,
      this.props.outPalletInformation,
      this.props.inPalletInformation
    );
    const { calibrationInformation, showSDK = true } = this.props;
    const dataOrigin = {
      value: {
        calibPosX: calibrationInformation.calibPosX,
        calibPosY: calibrationInformation.calibPosY,
        calibPosZ: calibrationInformation.calibPosZ
      },
      error: [
        {
          calibPosXMsg: calibrationInformation.calibPosXMsg,
          calibPosYMsg: calibrationInformation.calibPosYMsg,
          calibPosZMsg: calibrationInformation.calibPosZMsg,
          calibOptDuplicate: calibrationInformation.calibOptDuplicate,
          calibFormAngle: calibrationInformation.calibFormAngle,
          calibOptStraightAway: calibrationInformation.calibOptStraightAway
        }
      ]
    };
    const dataOptional1 = {
      value: {
        calibOptX1: calibrationInformation.calibOptX1,
        calibOptY1: calibrationInformation.calibOptY1,
        calibOptZ1: calibrationInformation.calibOptZ1
      },
      error: [
        {
          calibOptX1Msg: calibrationInformation.calibOptX1Msg,
          calibOptY1Msg: calibrationInformation.calibOptY1Msg,
          calibOptZ1Msg: calibrationInformation.calibOptZ1Msg,
          calibOptDuplicate: calibrationInformation.calibOpt1Duplicate,
          calibFormAngle: calibrationInformation.calibFormAngle,
          calibOptStraightAway: calibrationInformation.calibOptStraightAway
        }
      ]
    };
    const dataOptional2 = {
      value: {
        calibOptX2: calibrationInformation.calibOptX2,
        calibOptY2: calibrationInformation.calibOptY2,
        calibOptZ2: calibrationInformation.calibOptZ2
      },
      error: [
        {
          calibOptX2Msg: calibrationInformation.calibOptX2Msg,
          calibOptY2Msg: calibrationInformation.calibOptY2Msg,
          calibOptZ2Msg: calibrationInformation.calibOptZ2Msg,
          calibOptDuplicate: calibrationInformation.calibOpt2Duplicate,
          calibFormAngle: calibrationInformation.calibFormAngle,
          calibOptStraightAway: calibrationInformation.calibOptStraightAway
        }
      ]
    };
    const disableButton = !this.props.isRobotConnected || this.props.running;
    return (
      <>
        <Grid
          item={true}
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${CalibOutFeederStyles['calibration-screen']} ${PalletStyles['space-bottom']}`}
          hidden={this.props.isHidden}
        >
          <Container maxWidth={false}>
            <Typography className={PalletStyles['title']} variant="h6">
              {t('calibration-points')}
            </Typography>
            <Grid item container xs>
              <Grid item md={12} lg={7} className={CalibOutFeederStyles['calib-point']}>
                <Grid item xs={12}>
                  <FormLabel className={PalletStyles['form-label-item']}>{t('coordinates')}</FormLabel>
                </Grid>
                <Grid item xs={12}>
                  <Select
                    disabled
                    IconComponent={ExpandMoreIcon}
                    className={`${PalletStyles['form-select']} ${PalletStyles['mui-outline-input-root']}`}
                    fullWidth
                    defaultValue={0}
                  >
                    <MenuItem value={0}>{t('base')}</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} className={PalletStyles['row-spacing']} marginBottom="1em">
                  <PointsPosition
                    unUseMove
                    useOptional
                    pointName={t('origin-point')}
                    data={dataOrigin.value}
                    errorMessage={dataOrigin.error}
                    handleChangeInput={(e) => this.checkInput(e, true, true)}
                    validationInput={this.validationPosition}
                    buttonName="calibOrigin"
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, 'calibPos')}
                    moveToPosition={(type: RobotSpace) => this.moveToPosition(type, 'calibOrigin', 'calibPos')}
                    disableButton={disableButton}
                    disabled={this.props.running}
                  />
                  <PointsPosition
                    unUseMove
                    useOptional
                    pointName={t('point-1-on-x-axis')}
                    data={dataOptional1.value}
                    errorMessage={dataOptional1.error}
                    handleChangeInput={(e) => this.checkInput(e, true, true)}
                    validationInput={this.validationPosition}
                    buttonName="calibOpt1"
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, 'calibOpt', 1)}
                    disableButton={disableButton}
                    disabled={this.props.running}
                  />

                  <PointsPosition
                    unUseMove
                    useOptional
                    pointName={t('point-2-on-y-axis')}
                    data={dataOptional2.value}
                    errorMessage={dataOptional2.error}
                    handleChangeInput={(e) => this.checkInput(e, true, true)}
                    validationInput={this.validationPosition}
                    buttonName="calibOpt2"
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, 'calibOpt', 2)}
                    moveToPosition={(type: RobotSpace) => this.moveToPosition(type, 'calibOpt2', 'calibOpt', 2)}
                    disableButton={disableButton}
                    disabled={this.props.running}
                  />
                </Grid>
              </Grid>
              <Grid item md={12} lg={5} className={PalletStyles['guided-image']}>
                <img src={CALIBRATION_POINTS} alt="calib_points" />
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Grid container className={CalibOutFeederStyles['out-feeder-simulation']}>
              <Grid item lg={7} md={12}>
                <Grid container className={FeederScreenStyles['warning-content']} alignItems="center">
                  <Typography className={CalibOutFeederStyles['title']}>{t('out-feeder-simulation')}</Typography>
                  {this.props.calibSettingChanged && (
                    <>
                      <ErrorIcon className={PalletStyles['warning-icon']} />
                      <Typography fontSize="0.8em">{t('changes-to-settings')}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item md={12} className={`${PalletStyles['button']} ${PalletStyles['row-spacing']}`}>
                  <Button
                    onClick={this.onClick3DSimulation}
                    className={PalletStyles['button--action']}
                    variant="contained"
                    disabled={
                      this.props.running ||
                      loadedProduct === 'N/A' ||
                      maxLayer === 'N/A' ||
                      totalHeight === 'N/A' ||
                      volumeEfficiency === 'N/A' ||
                      this.hasError()
                    }
                  >
                    {t('generate-3D-simulation')}
                  </Button>
                </Grid>
              </Grid>
              <Grid item lg={5} className={PalletStyles['guided-sdk']} md={12}>
                {showSDK && (
                  <SDKViewer
                    moduleRootPath={this.props.moduleRootPath}
                    robotModel={this.props.robotModel}
                    objectData={this.state.productCoorData}
                    camPosition={this.state.camPos}
                    camTarget={this.state.camTarget}
                    context={this.context}
                    onlyContainsPallets={true}
                  ></SDKViewer>
                )}
              </Grid>
              <Grid item lg={7} md={12} className={FeederScreenStyles['position-action-container']}>
                <Table className={CalibOutFeederStyles['custom-table']}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('property')}</TableCell>
                      <TableCell>{t('detail')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('loaded-product')}
                      </TableCell>
                      <TableCell>
                        <TextField
                          className={PalletStyles['form-label-textfield']}
                          value={loadedProduct}
                          disabled
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('total-weight')}
                      </TableCell>
                      <TableCell>
                        <TextField
                          className={PalletStyles['form-label-textfield']}
                          value={totalWeight}
                          disabled
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{`kg`}</InputAdornment>
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('max-layer')}
                      </TableCell>
                      <TableCell>
                        <TextField className={PalletStyles['form-label-textfield']} value={maxLayer} disabled />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('total-height')}
                      </TableCell>
                      <TableCell>
                        <TextField
                          className={PalletStyles['form-label-textfield']}
                          value={totalHeight}
                          disabled
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{`mm`}</InputAdornment>
                          }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('volume-efficiency')}
                      </TableCell>
                      <TableCell>
                        <TextField
                          className={PalletStyles['form-label-textfield']}
                          value={volumeEfficiency}
                          disabled
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">{`%`}</InputAdornment>
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
    gripperType: state.deviceShortCut.gripperType
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setCalibrationInformation: (action: { payload: { [key: string]: string | boolean } }) =>
      dispatch(setCalibrationInformation(action.payload))
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing', { withRef: true })(CalibrateOutFeederScreen)
);
