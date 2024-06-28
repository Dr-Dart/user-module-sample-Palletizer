/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_VALUE } from '../consts';
import { InPalletReducer } from '../type';

const inPalletSliceInitial: InPalletReducer = {
  inPalletLength: DEFAULT_VALUE.inPallet.length,
  lengthError: '',
  inPalletWidth: DEFAULT_VALUE.inPallet.width,
  widthError: '',
  selectedPallet: DEFAULT_VALUE.inPallet.selectedPallet,
  inPalletRow: DEFAULT_VALUE.inPallet.row,
  rowError: '',
  inPalletColumn: DEFAULT_VALUE.inPallet.column,
  columnError: '',
  inPalletLayer: DEFAULT_VALUE.inPallet.layer,
  layerError: '',
  posX1: '',
  x1Error: '',
  posX2: '',
  x2Error: '',
  posX3: '',
  x3Error: '',
  posX4: '',
  x4Error: '',
  posY1: '',
  y1Error: '',
  posY2: '',
  y2Error: '',
  posY3: '',
  y3Error: '',
  posY4: '',
  y4Error: '',
  posZ1: '',
  z1Error: '',
  posZ2: '',
  z2Error: '',
  posZ3: '',
  z3Error: '',
  posZ4: '',
  z4Error: '',
  posA1: '',
  a1Error: '',
  posA2: '',
  a2Error: '',
  posA3: '',
  a3Error: '',
  posA4: '',
  a4Error: '',
  posB1: '',
  b1Error: '',
  posB2: '',
  b2Error: '',
  posB3: '',
  b3Error: '',
  posB4: '',
  b4Error: '',
  posC1: '',
  c1Error: '',
  posC2: '',
  c2Error: '',
  posC3: '',
  c3Error: '',
  posC4: '',
  c4Error: ''
};

export const InpalletSlice = createSlice({
  name: 'inPallet',
  initialState: inPalletSliceInitial,
  reducers: {
    setInPalletValue: (state, { payload }) => {
      return { ...state, ...payload };
    },
    setInpalletInitial: (state) => {
      return { ...state, ...inPalletSliceInitial };
    }
  }
});

export const { setInPalletValue, setInpalletInitial } = InpalletSlice.actions;

export default InpalletSlice.reducer;
