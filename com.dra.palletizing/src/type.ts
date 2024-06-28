/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { SixNumArray } from 'dart-api';
import { DeviceShortcutSliceState } from './redux/DeviceShortcutSlice';
import { GripperReducer } from './redux/GripperSlice';
import { RunSliceState } from './redux/RunSlice';

export type ErrorType = 'EMPTY' | 'INVALID_RANGE';
export type PalletType =
  | '1016.000-1219.000'
  | '1067.000-1067.000'
  | '1219.000-1219.000'
  | '800.000-1200.000'
  | '1200.000-1000.000'
  | '1000.000-1200.000'
  | '800.000-600.000'
  | '1100.000-1100.000'
  | 'CustomSize'
  | string;

export interface Coordinate {
  x: string | number | null;
  y: string | number | null;
  z: string | number | null;
  a: string | number | null;
  b: string | number | null;
  c: string | number | null;
}
export interface Pose {
  j1: string | number;
  j2: string | number;
  j3: string | number;
  j4: string | number;
  j5: string | number;
  j6: string | number;
}
export interface GripperInformation {
  name: string;
  image?: string;
  logo?: string;
  setting: Coordinate;
  selectedAction: 'grasp' | 'release';

  errorX: string;
  errorY: string;
  errorZ: string;
  errorA: string;
  errorB: string;
  errorC: string;
}
export interface InPalletInformation {
  selectedPallet: string;
  length: string;
  width: string;
  row: string;
  column: string;
  layer: string;
  position1: Coordinate;
  position2: Coordinate;
  position3: Coordinate;
  position4: Coordinate;

  lengthError: string;
  widthError: string;
  rowError: string;
  columnError: string;
  layerError: string;
  x1Error: string;
  x2Error: string;
  x3Error: string;
  y1Error: string;
  y2Error: string;
  y3Error: string;
  z1Error: string;
  z2Error: string;
  z3Error: string;
  a1Error: string;
  a2Error: string;
  a3Error: string;
  b1Error: string;
  b2Error: string;
  b3Error: string;
  c1Error: string;
  c2Error: string;
  c3Error: string;
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

  lengthError: string;
  widthError: string;
  overhangError: string;
  underhangError: string;
  boxPaddingError: string;
  maxLayerError: string;
}
export interface ProjectInformation {
  projectId: string;
  projectName: string;
  createDate: string;
  updateDate: string;
}

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
export interface CalibrationInformation {
  xOrigin: string;
  yOrigin: string;
  zOrigin: string;
  aOrigin: string;
  bOrigin: string;
  cOrigin: string;
  optionalPoint1: boolean;
  xOptionalPoint1: string;
  yOptionalPoint1: string;
  zOptionalPoint1: string;
  optionalPoint2: boolean;
  xOptionalPoint2: string;
  yOptionalPoint2: string;
  zOptionalPoint2: string;

  calibPosXMsg: string;
  calibPosYMsg: string;
  calibPosZMsg: string;
  calibOptX1Msg: string;
  calibOptX2Msg: string;
  calibOptY1Msg: string;
  calibOptY2Msg: string;
  calibOptZ1Msg: string;
  calibOptZ2Msg: string;

  row?: number;
  col?: number;
}
//CuongNX7 step 6 start
export interface CheckPickPlaceInformation {
  iniPosJ1: string;
  iniPosJ2: string;
  iniPosJ3: string;
  iniPosJ4: string;
  iniPosJ5: string;
  iniPosJ6: string;

  iniPosJ1Msg: string;
  iniPosJ2Msg: string;
  iniPosJ3Msg: string;
  iniPosJ4Msg: string;
  iniPosJ5Msg: string;
  iniPosJ6Msg: string;

  isPickCustomApproachPos: boolean;
  isPickCustomRetractPos: boolean;
  pickCustomApproachPosX: string;
  pickCustomApproachPosY: string;
  pickCustomApproachPosZ: string;
  pickCustomRetractPosX: string;
  pickCustomRetractPosY: string;
  pickCustomRetractPosZ: string;

  pickCustomApproachPosXMsg: string;
  pickCustomApproachPosYMsg: string;
  pickCustomApproachPosZMsg: string;
  pickCustomRetractPosXMsg: string;
  pickCustomRetractPosYMsg: string;
  pickCustomRetractPosZMsg: string;

  isPlaceCustomApproachPos: boolean;
  placeCustomApproachPosX: string;
  placeCustomApproachPosY: string;
  placeCustomApproachPosZ: string;
  isPlaceCustomRetractPos: boolean;
  placeCustomRetractPosX: string;
  placeCustomRetractPosY: string;
  placeCustomRetractPosZ: string;

  placeCustomApproachPosXMsg: string;
  placeCustomApproachPosYMsg: string;
  placeCustomApproachPosZMsg: string;
  placeCustomRetractPosXMsg: string;
  placeCustomRetractPosYMsg: string;
  placeCustomRetractPosZMsg: string;
}
//CuongNX7 step 6 end
export type SetMessage = {
  (message: string): void;
};

export type SetValue = {
  (): void;
};

export type DialogProvider = {
  type: 'error' | 'warning' | 'info';
  isOpen: boolean;
  content: string;
  onClose?: () => void;
  onConfirm?: () => void;
};

export type SetPosition = {
  (data: SixNumArray): void;
};

export type HoldButton =
  | 'InPalletPos1'
  | 'InPalletPos2'
  | 'InPalletPos3'
  | 'InPalletPos4'
  | 'calibOrigin'
  | 'calibOpt1'
  | 'calibOpt2'
  | 'initPose'
  | 'pickPos'
  | 'placePos'
  | 'pickAppPos'
  | 'pickRetPos'
  | 'placeAppPos'
  | 'placeRetPos'
  | '';

export type InPalletScreen = {
  inPalletLength: string | number;
  inPalletWidth: string | number;
  inPalletRow: string | number;
  inPalletColumn: string | number;
  inPalletLayer: string | number;
  position1: {
    x: string | number;
    y: string | number;
    z: string | number;
    a: string | number;
    b: string | number;
    c: string | number;
  };
  position2: {
    x: string | number;
    y: string | number;
    z: string | number;
    a: string | number;
    b: string | number;
    c: string | number;
  };
  position3: {
    x: string | number;
    y: string | number;
    z: string | number;
    a: string | number;
    b: string | number;
    c: string | number;
  };
  position4: {
    x: string | number;
    y: string | number;
    z: string | number;
    a: string | number;
    b: string | number;
    c: string | number;
  };
};

export type InPalletReducer = {
  lengthError: string;
  inPalletLength: string;
  widthError: string;
  inPalletWidth: string;
  selectedPallet: string;
  inPalletRow: string;
  rowError: string;
  inPalletColumn: string;
  columnError: string;
  inPalletLayer: string;
  layerError: string;
  posX1: string;
  x1Error: string;
  posX2: string;
  x2Error: string;
  posX3: string;
  x3Error: string;
  posX4: string;
  x4Error: string;
  posY1: string;
  y1Error: string;
  posY2: string;
  y2Error: string;
  posY3: string;
  y3Error: string;
  posY4: string;
  y4Error: string;
  posZ1: string;
  z1Error: string;
  posZ2: string;
  z2Error: string;
  posZ3: string;
  z3Error: string;
  posZ4: string;
  z4Error: string;
  posA1: string;
  a1Error: string;
  posA2: string;
  a2Error: string;
  posA3: string;
  a3Error: string;
  posA4: string;
  a4Error: string;
  posB1: string;
  b1Error: string;
  posB2: string;
  b2Error: string;
  posB3: string;
  b3Error: string;
  posB4: string;
  b4Error: string;
  posC1: string;
  c1Error: string;
  posC2: string;
  c2Error: string;
  posC3: string;
  c3Error: string;
  posC4: string;
  c4Error: string;
};

export type CalibState = {
  calibPosX: string;
  calibPosY: string;
  calibPosZ: string;

  calibPosXMsg: string;
  calibPosYMsg: string;
  calibPosZMsg: string;
  calibOptX1Msg: string;
  calibOptX2Msg: string;
  calibOptY1Msg: string;
  calibOptY2Msg: string;
  calibOptZ1Msg: string;
  calibOptZ2Msg: string;

  isDisplayOpt1: boolean;
  isDisplayOpt2: boolean;

  calibOptX1: string;
  calibOptX2: string;
  calibOptY1: string;
  calibOptY2: string;
  calibOptZ1: string;
  calibOptZ2: string;

  calibOptA1?: string;
  calibOptA2?: string;
  calibOptB1?: string;
  calibOptB2?: string;
  calibOptC1?: string;
  calibOptC2?: string;

  clickable?: boolean;
  settingChanged: boolean;
  firstLoad: boolean;

  calibOpt1Duplicate: string;
  calibOpt2Duplicate: string;
  calibOptDuplicate: string;
  calibFormAngle: string;
  calibOptStraightAway: string;
};
export type CheckPickPlaceState = {
  iniPosJ1: string;
  iniPosJ2: string;
  iniPosJ3: string;
  iniPosJ4: string;
  iniPosJ5: string;
  iniPosJ6: string;
  iniPosJ1Msg: string;
  iniPosJ2Msg: string;
  iniPosJ3Msg: string;
  iniPosJ4Msg: string;
  iniPosJ5Msg: string;
  iniPosJ6Msg: string;

  isPickCustomApproachPos: boolean;
  isPickCustomRetractPos: boolean;
  pickCustomApproachPosX: string;
  pickCustomApproachPosY: string;
  pickCustomApproachPosZ: string;
  pickCustomRetractPosX: string;
  pickCustomRetractPosY: string;
  pickCustomRetractPosZ: string;
  pickCustomApproachPosXMsg: string;
  pickCustomApproachPosYMsg: string;
  pickCustomApproachPosZMsg: string;
  pickCustomRetractPosXMsg: string;
  pickCustomRetractPosYMsg: string;
  pickCustomRetractPosZMsg: string;

  isPlaceCustomApproachPos: boolean;
  isPlaceCustomRetractPos: boolean;
  placeCustomApproachPosX: string;
  placeCustomApproachPosY: string;
  placeCustomApproachPosZ: string;
  placeCustomRetractPosX: string;
  placeCustomRetractPosY: string;
  placeCustomRetractPosZ: string;
  placeCustomApproachPosXMsg: string;
  placeCustomApproachPosYMsg: string;
  placeCustomApproachPosZMsg: string;
  placeCustomRetractPosXMsg: string;
  placeCustomRetractPosYMsg: string;
  placeCustomRetractPosZMsg: string;
};

export type OnlyRunMapStateToProps = {
  run: RunSliceState;
  gripper: GripperReducer;
  inPallet: InPalletReducer;
  outPallet: OutPalletInformation;
  product: ProductInformation;
  deviceShortCut: DeviceShortcutSliceState;
};

export type CalibrateAndCheckPickPlaceMapTopProps = {
  product: ProductInformation;
  inPallet: InPalletReducer;
  calibration: CalibState;
  outPallet: OutPalletInformation;
  run: RunSliceState;
  checkPickPlace: CheckPickPlaceState;
  gripper: GripperReducer;
  deviceShortCut: DeviceShortcutSliceState;
};

export type RunMapStateToProps = {
  gripper: GripperInformation;
  product: ProductInformation;
  inPallet: InPalletReducer;
  outPallet: OutPalletInformation;
  calibration: CalibState;
  checkPickPlace: CheckPickPlaceState;
};

export interface Point {
  x: number;
  y: number;
  z: number;
}
export interface Vector {
  x: number;
  y: number;
  z: number;
}

/**
 * Plane equation: a * x + b * y + c * z + d = 0, with x, y, z is variable and a, b, c & d is constants
 */
export interface PlaneEquation {
  a: number;
  b: number;
  c: number;
  d: number;
}
