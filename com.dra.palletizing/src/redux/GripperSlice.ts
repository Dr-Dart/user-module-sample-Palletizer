/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
import { GRIPPER_TCP } from '../consts';
import { Coordinate, GripperInformation } from '../type';

export type Gripper_name = 'zimmer_hrc_03' | 'schmalz_fmcb' | 'onrobot_vgp20' | 'robotic_airq' | 'onrobot_fgp20';
export type GripperReducer = {
  selectedGripper: GripperInformation;
  errorX: string;
  errorY: string;
  errorZ: string;
  errorA: string;
  errorB: string;
  errorC: string;
  showTCP: boolean;
  selectedAction: 'grasp' | 'release';
} & Coordinate &
  Record<Gripper_name, GripperInformation>;

const DEFAULT_VALUE: Record<Gripper_name, GripperInformation> = {
  zimmer_hrc_03: GRIPPER_TCP.zimmer_hrc_03,
  schmalz_fmcb: GRIPPER_TCP.schmalz_fmcb,
  onrobot_vgp20: GRIPPER_TCP.onrobot_vgp20,
  robotic_airq: GRIPPER_TCP.onrobot_vgp20,
  onrobot_fgp20: GRIPPER_TCP.onrobot_fgp20
};
const initialState = {
  errorX: '',
  errorY: '',
  errorZ: '',
  errorA: '',
  errorB: '',
  errorC: '',
  x: GRIPPER_TCP.zimmer_hrc_03.setting.x,
  y: GRIPPER_TCP.zimmer_hrc_03.setting.y,
  z: GRIPPER_TCP.zimmer_hrc_03.setting.z,
  a: GRIPPER_TCP.zimmer_hrc_03.setting.a,
  b: GRIPPER_TCP.zimmer_hrc_03.setting.b,
  c: GRIPPER_TCP.zimmer_hrc_03.setting.c,
  selectedGripper: GRIPPER_TCP.zimmer_hrc_03,
  showTCP: true,
  selectedAction: 'grasp',
  ...DEFAULT_VALUE
} as GripperReducer;

export const GripperSlice = createSlice({
  name: 'Gripper',
  initialState: initialState,
  reducers: {
    setGripperInformation: (state, { payload }) => {
      const result = Object.assign(state, payload);
      return result;
    },
    setGripperInitial: (state) => {
      return { ...state, ...initialState };
    }
  }
});

export const { setGripperInformation, setGripperInitial } = GripperSlice.actions;

export default GripperSlice.reducer;
