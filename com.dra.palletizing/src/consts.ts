/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { TwoNumArray } from 'dart-api';
import { GripperInformation, InPalletInformation, PalletType } from './type';

export interface ProductInformation {
  length: string;
  width: string;
  height: string;
  weight: string;
  lengthError: string;
  widthError: string;
  heightError: string;
  weightError: string;
}
export interface OutPalletInformation {
  selectedPallet: string;
  length: string;
  width: string;
  useOverhangUnderhang: boolean;
  isOverhang: boolean;
  overhang: string;
  underhang: string;
  boxPadding: string;
  maxLayer: string;
}
export interface GripperInterfaceInformation {
  name: string;
  x: string | number | null;
  y: string | number | null;
  z: string | number | null;
  a: string | number | null;
  b: string | number | null;
  c: string | number | null;
}

export interface RobotInformation {
  robotModel: string;
  payload: string;
  reach: string;
}

export interface CheckPositionInformation {
  j1: number | string | null;
  j2: number | string | null;
  j3: number | string | null;
  j4: number | string | null;
  j5: number | string | null;
  j6: number | string | null;
}

export interface OutFeederPalletPosition {
  xOrigin: string | number | null;
  yOrigin: string | number | null;
  zOrigin: string | number | null;
  aOrigin: string | number | null;
  bOrigin: string | number | null;
  cOrigin: string | number | null;
  optionalPoint1: boolean;
  xOptionalPoint1: string | number | null;
  yOptionalPoint1: string | number | null;
  zOptionalPoint1: string | number | null;
  optionalPoint2: boolean;
  xOptionalPoint2: string | number | null;
  yOptionalPoint2: string | number | null;
  zOptionalPoint2: string | number | null;
  calibPosXMsg: string;
  calibPosYMsg: string;
  calibPosZMsg: string;
  calibOptX1Msg: string;
  calibOptX2Msg: string;
  calibOptY1Msg: string;
  calibOptY2Msg: string;
  calibOptZ1Msg: string;
  calibOptZ2Msg: string;
}

export interface InFeederPallet {
  selectedPallet: string;
  length: string | number | null;
  width: string | number | null;
  row: string | number | null;
  column: string | number | null;
  layer: string | number | null;
  xPos1: string | number | null;
  yPos1: string | number | null;
  zPos1: string | number | null;
  aPos1: string | number | null;
  bPos1: string | number | null;
  cPos1: string | number | null;
  xPos2: string | number | null;
  yPos2: string | number | null;
  zPos2: string | number | null;
  aPos2: string | number | null;
  bPos2: string | number | null;
  cPos2: string | number | null;
  xPos3: string | number | null;
  yPos3: string | number | null;
  zPos3: string | number | null;
  aPos3: string | number | null;
  bPos3: string | number | null;
  cPos3: string | number | null;
  xPos4: string | number | null;
  yPos4: string | number | null;
  zPos4: string | number | null;
  aPos4: string | number | null;
  bPos4: string | number | null;
  cPos4: string | number | null;
}
export interface Coordinate {
  x: string | number;
  y: string | number;
  z: string | number;
  a: string | number;
  b: string | number;
  c: string | number;
}
export interface Pose {
  j1: string | number;
  j2: string | number;
  j3: string | number;
  j4: string | number;
  j5: string | number;
  j6: string | number;
}
interface TableInfo {
  name: string;
  columns: string[];
}

export const TABLE_PROJECT: TableInfo = {
  name: 'project',
  columns: ['projectId', 'projectName', 'createDate', 'updateDate']
};
export const TABLE_PRODUCT: TableInfo = {
  name: 'product',
  columns: [
    'projectId',
    'length',
    'width',
    'height',
    'weight',
    'lengthError',
    'widthError',
    'heightError',
    'weightError'
  ]
};

export const TABLE_OUT_PALLET: TableInfo = {
  name: 'outPallet',
  columns: [
    'projectId',
    'selectedPallet',
    'length',
    'width',
    'useOverhangUnderhang',
    'isOverhang',
    'overhang',
    'underhang',
    'boxPadding',
    'maxLayer',
    'lengthError',
    'widthError',
    'overhangError',
    'underhangError',
    'boxPaddingError',
    'maxLayerError'
  ]
};
export const TABLE_GRIPPER: TableInfo = {
  name: 'gripperInterface',
  columns: [
    'projectId',
    'name',
    'x',
    'y',
    'z',
    'a',
    'b',
    'c',
    'selectedAction',
    'errorX',
    'errorY',
    'errorZ',
    'errorA',
    'errorB',
    'errorC',
    'zimmer_hrc_03',
    'schmalz_fmcb',
    'onrobot_vgp20',
    'robotic_airq',
    'onrobot_fgp20'
  ]
};
export const TABLE_CHECK_POSITION: TableInfo = {
  name: 'checkPickPosition',
  columns: [
    'projectId',
    'j1',
    'j2',
    'j3',
    'j4',
    'j5',
    'j6',
    'customApproachPickPos',
    'xApproachPickPos',
    'yApproachPickPos',
    'zApproachPickPos',
    'customRetractPickPos',
    'xRetractPickPos',
    'yRetractPickPos',
    'zRetractPickPos',

    'customApproachPlacePos',
    'xApproachPlacePos',
    'yApproachPlacePos',
    'zApproachPlacePos',
    'customRetractPlacePos',
    'xRetractPlacePos',
    'yRetractPlacePos',
    'zRetractPlacePos',

    'iniPosJ1Msg',
    'iniPosJ2Msg',
    'iniPosJ3Msg',
    'iniPosJ4Msg',
    'iniPosJ5Msg',
    'iniPosJ6Msg',
    'pickCustomApproachPosXMsg',
    'pickCustomApproachPosYMsg',
    'pickCustomApproachPosZMsg',
    'pickCustomRetractPosXMsg',
    'pickCustomRetractPosYMsg',
    'pickCustomRetractPosZMsg',
    'placeCustomApproachPosXMsg',
    'placeCustomApproachPosYMsg',
    'placeCustomApproachPosZMsg',
    'placeCustomRetractPosXMsg',
    'placeCustomRetractPosYMsg',
    'placeCustomRetractPosZMsg'
  ]
};

export const TABLE_OUTFEEDER_POSITION: TableInfo = {
  name: 'outFeederPalletPosition',
  columns: [
    'projectId',
    'xOrigin',
    'yOrigin',
    'zOrigin',
    'aOrigin',
    'bOrigin',
    'cOrigin',
    'optionalPoint1',
    'xOptionalPoint1',
    'yOptionalPoint1',
    'zOptionalPoint1',
    'optionalPoint2',
    'xOptionalPoint2',
    'yOptionalPoint2',
    'zOptionalPoint2',

    'calibPosXMsg',
    'calibPosYMsg',
    'calibPosZMsg',
    'calibPosAMsg',
    'calibPosBMsg',
    'calibPosCMsg',
    'calibOptX1Msg',
    'calibOptX2Msg',
    'calibOptY1Msg',
    'calibOptY2Msg',
    'calibOptZ1Msg',
    'calibOptZ2Msg',
    'calibOptDuplicate',
    'calibOpt1Duplicate',
    'calibOpt2Duplicate',
    'calibFormAngle',
    'calibOptStraightAway'
  ]
};

export const TABLE_INFEEDER_PALLET: TableInfo = {
  name: 'inFeederPallet',
  columns: [
    'projectId',
    'selectedPallet',
    'length',
    'width',
    'row',
    'column',
    'layer',
    'xPos1',
    'yPos1',
    'zPos1',
    'aPos1',
    'bPos1',
    'cPos1',
    'xPos2',
    'yPos2',
    'zPos2',
    'aPos2',
    'bPos2',
    'cPos2',
    'xPos3',
    'yPos3',
    'zPos3',
    'aPos3',
    'bPos3',
    'cPos3',
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
  ]
};

export const MESSAGE: { [key: string]: string } = {
  ERR_014: 'The value cannot be empty.',
  ERR_001: "There's already a project with that name. Please try another.",
  ERR_002: "A project name can't exceed 30 characters.",
  ERR_003: 'A project name can\'t contain any of the following characters: \\ / : * ? " < > |',
  ERR_004: 'The project name cannot be empty.',
  ERR_005: 'The valid A, B, C values are from -360.00 to 360.00.',
  ERR_006: 'The valid product size value is from 1.000 mm to 1000.000 mm.',
  ERR_007: 'The valid product weight value is from 0.000 kg to 30.000 kg.',
  ERR_008: 'The valid pallet size value is from 1.000 mm to 1300.000 mm.',
  ERR_009: 'The valid Underhang/Overhang value is from 0.000 mm to 300.000 mm.',
  ERR_010: 'The valid Box Padding value is from 0.000 mm to 500.000 mm.',
  ERR_011: 'The valid Max. Layer value is from 1 to 100.',
  ERR_012: 'The valid layer value is from 1 to 100.',
  ERR_013: 'The valid X, Y, Z values are from -99999.999 to 99999.999.',
  ERR_018: 'The Point 1, Point 2, Point 3 must be all different and cannot be collinear.',
  ERR_019: 'The Point 1, Point 2, Point 3 should form a right angle.',
  ERR_020: 'The A, B, C values of 3 Points must not be less than or greater than 5 degrees from each others.',
  ERR_021: "Product's count number must be equal or lower than 1000.",
  //CuongNX7 Add for step6 start
  ERR_015: 'The valid value is from -360.00 to 360.00.',
  CON_002: 'Do you want to delete this project?',
  CON_003: 'Do you want to delete these projects?',
  CON_004: 'Do you want to delete all the projects?',
  INF_001: "You can't move the robot when the Servo is OFF.",
  INF_003: "You can't get the robot's position when the Servo is OFF.",
  WAR_001: 'You haven’t saved this project yet. Do you want to save it before you leave?',
  INF_002: 'You can’t move the real robot when the virtual mode is ON.',
  SAVE_CONF: 'Do you want to save this project?',
  ERR_016: 'The Origin Point, Point 1 on X-axis, Point 2 on Y-axis must be all different and cannot be collinear.',
  ERR_017: 'The Origin Point, Point 1 on X-axis, Point 2 on Y-axis should form a right angle.',
  ERR_022: 'The valid row, column values are from 2 to 100.',
  WAR_007:
    'The currently set Tool Center Point(TCP) is not registered from this application. Please check the setting and change the Tool Center Point(TCP) from the “Device Short-cut”.'
};

export const NUMBER_OF_DECIMAL = 3;
export const MIN_ORIGIN_DEGREE = 85;
export const MAX_ORIGIN_DEGREE = 95;
export const THREE_NUMBER_OF_DECIMAL = 3;
export const NUMBER_OF_DECIMAL_DEGREE = 2;
export const MAX_COORDINATE = 99999.999;
export const MIN_COORDINATE = -99999.999;
export const MAX_DEGREE = 360;
export const MIN_DEGREE = -360;

export const DEFAULT_VALUE: {
  productInformation: { [key: string]: string | boolean };
  inPallet: InPalletInformation;
  outPallet: { [key: string]: string | boolean | PalletType };
  gripperInterface: { [key: string]: string | boolean };
  checkPosition: { [key: string]: string | boolean };
  outFeederPalletPosition: { [key: string]: string | boolean };
  robotInformation: { [key: string]: string | boolean };
} = {
  productInformation: {
    length: '480.000',
    width: '380.000',
    height: '340.000',
    weight: '3.000',
    lengthError: '',
    widthError: '',
    heightError: '',
    weightError: ''
  },
  inPallet: {
    selectedPallet: '1016.000-1219.000',
    length: '1016.000',
    width: '1219.000',
    row: '5',
    column: '6',
    layer: '1',
    position1: {
      x: '',
      y: '',
      z: '',
      a: '',
      b: '',
      c: ''
    },
    position2: {
      x: '',
      y: '',
      z: '',
      a: '',
      b: '',
      c: ''
    },
    position3: {
      x: '',
      y: '',
      z: '',
      a: '',
      b: '',
      c: ''
    },
    position4: {
      x: '',
      y: '',
      z: '',
      a: '',
      b: '',
      c: ''
    },
    lengthError: '',
    widthError: '',
    rowError: '',
    columnError: '',
    layerError: '',
    x1Error: '',
    x2Error: '',
    x3Error: '',
    y1Error: '',
    y2Error: '',
    y3Error: '',
    z1Error: '',
    z2Error: '',
    z3Error: '',
    a1Error: '',
    a2Error: '',
    a3Error: '',
    b1Error: '',
    b2Error: '',
    b3Error: '',
    c1Error: '',
    c2Error: '',
    c3Error: ''
  },
  // step 4
  outPallet: {
    selectedSize: '1016.000-1219.000',
    length: '1016.000',
    width: '1219.000',
    useOverhangUnderhang: false,
    isOverhang: true,
    overhang: '0.000',
    underhang: '0.000',
    boxPadding: '5.000',
    maxLayer: '1',

    lengthError: '',
    widthError: '',
    overhangError: '',
    underhangError: '',
    boxPaddingError: '',
    maxLayerError: ''
  },
  // step 6
  checkPosition: {
    poseValue: '',
    j1: '',
    j2: '',
    j3: '',
    j4: '',
    j5: '',
    j6: '',
    productPickIndex: '',
    xPick: '0',
    yPick: '0',
    zPick: '0',
    aPick: '0',
    bPick: '0',
    cPick: '0',
    customApproachPickPos: false,
    xApproachPickPos: '',
    yApproachPickPos: '',
    zApproachPickPos: '',
    customRetractPickPos: false,
    xRetractPickPos: '',
    yRetractPickPos: '',
    zRetractPickPos: '',
    productPlaceIndex: '',
    xPlace: '0',
    yPlace: '0',
    zPlace: '0',
    aPlace: '0',
    bPlace: '0',
    cPlace: '0',
    customApproachPlacePos: false,
    xApproachPlacePos: '',
    yApproachPlacePos: '',
    zApproachPlacePos: '',
    customRetractPlacePos: false,
    xRetractPlacePos: '',
    yRetractPlacePos: '',
    zRetractPlacePos: '',
    iniPosJ1Msg: '',
    iniPosJ2Msg: '',
    iniPosJ3Msg: '',
    iniPosJ4Msg: '',
    iniPosJ5Msg: '',
    iniPosJ6Msg: '',
    pickCustomApproachPosXMsg: '',
    pickCustomApproachPosYMsg: '',
    pickCustomApproachPosZMsg: '',
    pickCustomRetractPosXMsg: '',
    pickCustomRetractPosYMsg: '',
    pickCustomRetractPosZMsg: '',
    placeCustomApproachPosXMsg: '',
    placeCustomApproachPosYMsg: '',
    placeCustomApproachPosZMsg: '',
    placeCustomRetractPosXMsg: '',
    placeCustomRetractPosYMsg: '',
    placeCustomRetractPosZMsg: ''
  },
  // step 5
  outFeederPalletPosition: {
    originPointIndex: 'Base',
    xOrigin: '',
    yOrigin: '',
    zOrigin: '',
    aOrigin: '',
    bOrigin: '',
    cOrigin: '',
    optionalPoint1: true,
    xOptionalPoint1: '',
    yOptionalPoint1: '',
    zOptionalPoint1: '',
    optionalPoint2: true,
    xOptionalPoint2: '',
    yOptionalPoint2: '',
    zOptionalPoint2: '',
    loadedProduct: '',
    totalWeigth: '0',
    maxlayer: '0',
    totalHeight: '0',
    volumeEfficiency: '0',
    calibPosXMsg: '',
    calibPosYMsg: '',
    calibPosZMsg: '',
    calibPosAMsg: '',
    calibPosBMsg: '',
    calibPosCMsg: '',
    calibOptX1Msg: '',
    calibOptX2Msg: '',
    calibOptY1Msg: '',
    calibOptY2Msg: '',
    calibOptZ1Msg: '',
    calibOptZ2Msg: '',
    calibOptDuplicate: '',
    calibOpt1Duplicate: '',
    calibOpt2Duplicate: '',
    calibFormAngle: '',
    calibOptStraightAway: ''
  },
  gripperInterface: {
    name: 'zimmer_hrc_03',
    x: '0.000',
    y: '0.000',
    z: '135.000',
    a: '0.00',
    b: '0.00',
    c: '0.00',
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  },
  robotInformation: {
    robotModel: '',
    payload: '0.0',
    reach: '0'
  }
};

export const GRIPPER_TCP: { [key: string]: GripperInformation } = {
  zimmer_hrc_03: {
    name: 'zimmer_hrc_03',
    image: 'zimmer_hrc_03.png',
    logo: 'img_logo_zimmer.png',
    selectedAction: 'grasp',
    setting: {
      x: '0.000',
      y: '0.000',
      z: '135.000',
      a: '0.00',
      b: '0.00',
      c: '0.00'
    },
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  },
  schmalz_fmcb: {
    name: 'schmalz_fmcb',
    image: 'schmalz_fmcb.png',
    logo: 'img_logo_schmalz.png',
    selectedAction: 'grasp',
    setting: {
      x: '0.000',
      y: '0.000',
      z: '79.000',
      a: '0.00',
      b: '0.00',
      c: '0.00'
    },
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  },
  onrobot_vgp20: {
    name: 'onrobot_vgp20',
    image: 'onrobot_vgp20.png',
    logo: 'img_logo_onrobot.png',
    selectedAction: 'grasp',
    setting: {
      x: '0.000',
      y: '0.000',
      z: '146.000',
      a: '0.00',
      b: '0.00',
      c: '0.00'
    },
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  },
  robotic_airq: {
    name: 'robotic_airq',
    image: 'robotic_airq.png',
    logo: 'img_logo_robotiq.png',
    selectedAction: 'grasp',
    setting: {
      x: '0.000',
      y: '0.000',
      z: '201.000',
      a: '0.00',
      b: '0.00',
      c: '0.00'
    },
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  },
  onrobot_fgp20: {
    name: 'onrobot_fgp20',
    image: 'onrobot_fgp20.png',
    logo: 'img_logo_onrobot.png',
    selectedAction: 'grasp',
    setting: {
      x: '0.000',
      y: '0.000',
      z: '140.000',
      a: '0.00',
      b: '0.00',
      c: '0.00'
    },
    errorX: '',
    errorY: '',
    errorZ: '',
    errorA: '',
    errorB: '',
    errorC: ''
  }
};
const velDefault = 100;
const velFTargetMin = 1000;
const velFTargetMax = 1000;
const accDefault = 100;
const accMin = 100;
const accMax = 500;
export const MOVE_L = {
  solutionSpace: 2,
  ifTargetVel: velDefault,
  ifTargetAcc: accDefault,
  targetVelocity: [velFTargetMin, velFTargetMax] as TwoNumArray,
  targetAcceleration: [accMin, accMax] as TwoNumArray,
  targetTime: 0,
  moveMode: 0,
  moveReference: 0,
  blendingRadius: 0,
  blendingType: 0
};

export const MOVE_J = {
  targetVelocity: 60,
  targetAcceleration: 100,
  targetTime: 0,
  moveMode: 0,
  blendingRadius: 0,
  blendingType: 0
};
export const RUNNING_ON = 'RUNNING';
export const RUNNING_OFF = 'OFF';
export const TYPE_MESSAGE = {
  SHOW_ROBOT: 'SHOW_ROBOT',
  HIDE_ROBOT: 'HIDE_ROBOT',

  RENDER_INIT_IN_PALLET: 'RENDER_INIT_IN_PALLET',

  RENDER_INIT_OUT_PALLET: 'RENDER_INIT_OUT_PALLET',
  RENDER_INIT_OUT_PALLET_WITH_CAM: 'RENDER_INIT_OUT_PALLET_WITH_CAM',

  RENDER_IN_PALLET: 'RENDER_IN_PALLET',
  RENDER_OUT_PALLET: 'RENDER_OUT_PALLET',
  RENDER_OUT_PALLET_WITH_CAM: 'RENDER_OUT_PALLET_WITH_CAM',

  RENDER_OUT_PALLET_HIGHLIGHT: 'RENDER_OUT_PALLET_HIGHLIGHT',
  RENDER_OUT_PALLET_HIDE_PRODUCT: 'RENDER_OUT_PALLET_HIDE_PRODUCT',

  REMOVE_INIT_IN_PALLET: 'REMOVE_INIT_IN_PALLET',
  REMOVE_INIT_OUT_PALLET: 'REMOVE_INIT_OUT_PALLET',

  REMOVE_IN_PALLET: 'REMOVE_IN_PALLET',
  REMOVE_OUT_PALLET: 'REMOVE_OUT_PALLET',

  SET_RUNNING: 'SET_RUNNING',
  SET_INDEX_RUN_SCREEN: 'SET_INDEX_RUN_SCREEN',

  SEND_DATA_TO_MODULE: 'SEND_DATA_TO_MODULE',

  GET_ALL_IN_PALLET_PRODUCT: 'GET_ALL_IN_PALLET_PRODUCT',
  GET_ALL_OUT_PALLET_PRODUCT: 'GET_ALL_OUT_PALLET_PRODUCT',
  GET_IN_PALLET_PRODUCT_INDEX: 'GET_IN_PALLET_PRODUCT_INDEX',
  GET_OUT_PALLET_PRODUCT_INDEX: 'GET_OUT_PALLET_PRODUCT_INDEX',

  HIDE_DIRECTION_BUTTON: 'HIDE_DIRECTION_BUTTON',
  FINISH_LOAD_3D: 'FINISH_LOAD_3D',
  SET_PRODUCT_INDEX_IN: 'SET_PRODUCT_INDEX_IN',
  SET_PRODUCT_INDEX_OUT: 'SET_PRODUCT_INDEX_OUT',
  SET_INTERVAL_DATA: 'SET_INTERVAL_DATA',
  RESET_ROBOT: 'RESET_ROBOT'
};
export const INTERVAL_TIME = 100;

export const NUMBER_SELECT_PROCESS = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7
};
export const NUMBER_SELECT_DEVEICE = {
  ONE: 1,
  TWO: 2
};

export const NUMBER_SELECT_SETTING_STEP = {
  ONE: 1,
  TWO: 2
};

export const PALLET_HEIGHT = 50;
export const IN_PALLET_PRODUCT_PREFIX = 'in-product-';
export const OUT_PALLET_PRODUCT_PREFIX = 'out-product-';

export const STRING_EMPTY = '';
export const LEFT_MENU = [
  {
    value: 1,
    title: 'set-device',
    type: 'process'
  },
  {
    value: 2,
    title: 'define-product',
    type: 'process'
  },
  {
    value: 3,
    title: 'define-in-feeder-pallet',
    type: 'process'
  },
  {
    value: 4,
    title: 'define-out-feeder-pallet',
    type: 'process'
  },
  {
    value: 5,
    title: 'calibrate-out-feeder-pallet-position',
    type: 'process'
  },
  {
    value: 6,
    title: 'check-pick-place-position',
    type: 'process'
  },
  {
    value: 7,
    title: 'run',
    type: 'process'
  },
  {
    value: 1,
    title: 'robot',
    type: 'device'
  },
  {
    value: 2,
    title: 'gripper',
    type: 'device'
  }
];
