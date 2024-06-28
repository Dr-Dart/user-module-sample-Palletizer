/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';

export type CalibrationSliceState = {
  calibPosX: string;
  calibPosY: string;
  calibPosZ: string;
  calibPosYMsg: string;
  calibPosXMsg: string;
  calibPosZMsg: string;
  isDisplayOpt1: boolean;
  isDisplayOpt2: boolean;
  calibOptX1: string;
  calibOptY1: string;
  calibOptZ1: string;
  calibOptX2: string;
  calibOptY2: string;
  calibOptZ2: string;
  calibOptX1Msg: string;
  calibOptX2Msg: string;
  calibOptY1Msg: string;
  calibOptY2Msg: string;
  calibOptZ1Msg: string;
  calibOptZ2Msg: string;
  calibOpt1Duplicate: string;
  calibOpt2Duplicate: string;
  calibOptDuplicate: string;
  calibOptStraightAway: string;
  calibFormAngle: string;
};

const calibrationSliceInitial: CalibrationSliceState = {
  calibPosX: '',
  calibPosY: '',
  calibPosZ: '',
  calibPosYMsg: '',
  calibPosXMsg: '',
  calibPosZMsg: '',
  isDisplayOpt1: false,
  isDisplayOpt2: false,
  calibOptX1: '',
  calibOptY1: '',
  calibOptZ1: '',
  calibOptX2: '',
  calibOptY2: '',
  calibOptZ2: '',
  calibOptX1Msg: '',
  calibOptX2Msg: '',
  calibOptY1Msg: '',
  calibOptY2Msg: '',
  calibOptZ1Msg: '',
  calibOptZ2Msg: '',
  calibOpt1Duplicate: '',
  calibOpt2Duplicate: '',
  calibOptDuplicate: '',
  calibOptStraightAway: '',
  calibFormAngle: ''
};

export const CalibrationSlice = createSlice({
  name: 'Calibration',
  initialState: calibrationSliceInitial,
  reducers: {
    setCalibrationInformation: (state, { payload }) => {
      return { ...state, ...payload };
    },
    setCalibInitial: (state) => {
      return { ...state, ...calibrationSliceInitial };
    }
  }
});

export const { setCalibrationInformation, setCalibInitial } = CalibrationSlice.actions;

export default CalibrationSlice.reducer;
