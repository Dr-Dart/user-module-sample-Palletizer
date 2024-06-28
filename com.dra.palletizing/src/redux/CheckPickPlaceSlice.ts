/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
import { CheckPickPlaceInformation } from '../type';

const initialState = {
  iniPosJ1: '',
  iniPosJ2: '',
  iniPosJ3: '',
  iniPosJ4: '',
  iniPosJ5: '',
  iniPosJ6: '',
  iniPosJ1Msg: '',
  iniPosJ2Msg: '',
  iniPosJ3Msg: '',
  iniPosJ4Msg: '',
  iniPosJ5Msg: '',
  iniPosJ6Msg: '',
  isPickCustomApproachPos: false,
  isPickCustomRetractPos: false,
  pickCustomApproachPosX: '',
  pickCustomApproachPosY: '',
  pickCustomApproachPosZ: '',
  pickCustomRetractPosX: '',
  pickCustomRetractPosY: '',
  pickCustomRetractPosZ: '',
  pickCustomApproachPosXMsg: '',
  pickCustomApproachPosYMsg: '',
  pickCustomApproachPosZMsg: '',
  pickCustomRetractPosXMsg: '',
  pickCustomRetractPosYMsg: '',
  pickCustomRetractPosZMsg: '',
  isPlaceCustomApproachPos: false,
  isPlaceCustomRetractPos: false,
  placeCustomApproachPosX: '',
  placeCustomApproachPosY: '',
  placeCustomApproachPosZ: '',
  placeCustomRetractPosX: '',
  placeCustomRetractPosY: '',
  placeCustomRetractPosZ: '',
  placeCustomApproachPosXMsg: '',
  placeCustomApproachPosYMsg: '',
  placeCustomApproachPosZMsg: '',
  placeCustomRetractPosXMsg: '',
  placeCustomRetractPosYMsg: '',
  placeCustomRetractPosZMsg: ''
} as CheckPickPlaceInformation;

export const CheckPickPlaceSlice = createSlice({
  name: 'product',
  initialState: initialState,
  reducers: {
    setCheckPickPlaceInformation: (state, { payload }) => {
      return { ...state, ...payload };
    },
    setCheckPickInitial: (state) => {
      return { ...state, ...initialState };
    }
  }
});

export const { setCheckPickPlaceInformation, setCheckPickInitial } = CheckPickPlaceSlice.actions;

export default CheckPickPlaceSlice.reducer;
