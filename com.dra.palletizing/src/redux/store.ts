/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { configureStore } from '@reduxjs/toolkit';
import { InpalletSlice } from './InpalletSlice';
import { ProductSlice } from './ProductSlice';
import { OutPalletSlice } from './OutPalletSlice';
import { CalibrationSlice } from './CalibrationSlice';
import { CheckPickPlaceSlice } from './CheckPickPlaceSlice';
import { GripperSlice } from './GripperSlice';
import { RunSlice } from './RunSlice';
import { DeviceShortcutSlice } from './DeviceShortcutSlice';

export const store = configureStore({
  reducer: {
    outPallet: OutPalletSlice.reducer,
    product: ProductSlice.reducer,
    inPallet: InpalletSlice.reducer,
    calibration: CalibrationSlice.reducer,
    checkPickPlace: CheckPickPlaceSlice.reducer,
    gripper: GripperSlice.reducer,
    run: RunSlice.reducer,
    deviceShortCut: DeviceShortcutSlice.reducer
  }
});
