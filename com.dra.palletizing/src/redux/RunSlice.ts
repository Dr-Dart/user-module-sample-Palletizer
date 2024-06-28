/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export type RunSliceState = {
  running: boolean;
};
const runSliceInitial: RunSliceState = {
  running: false
};
export const RunSlice = createSlice({
  name: 'Run',
  initialState: runSliceInitial,
  reducers: {
    setRunning: (state, action: PayloadAction<{ running: boolean }>) => {
      state.running = action.payload.running;
    }
  }
});

export const { setRunning } = RunSlice.actions;

export default RunSlice.reducer;
