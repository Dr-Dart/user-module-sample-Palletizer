/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
export type DeviceShortcutSliceState = {
  gripperType: string;
};
const deviceShortcutSliceInitial: DeviceShortcutSliceState = {
  gripperType: ''
};
export const DeviceShortcutSlice = createSlice({
  name: 'DeviceShortcut',
  initialState: deviceShortcutSliceInitial,
  reducers: {
    setGripperType: (state, { payload }) => {
      return { ...state, ...payload };
    }
  }
});

export const { setGripperType } = DeviceShortcutSlice.actions;

export default DeviceShortcutSlice.reducer;
