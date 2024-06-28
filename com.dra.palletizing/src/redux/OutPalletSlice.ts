/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_VALUE } from '../consts';
import { OutPalletInformation } from '../type';

const outPalletInitial: OutPalletInformation = {
  length: DEFAULT_VALUE.outPallet.length as string,
  lengthError: '',
  width: DEFAULT_VALUE.outPallet.width as string,
  widthError: '',
  overhangError: '',
  overhang: DEFAULT_VALUE.outPallet.overhang as string,
  underhangError: '',
  underhang: DEFAULT_VALUE.outPallet.underhang as string,
  boxPadding: DEFAULT_VALUE.outPallet.boxPadding as string,
  boxPaddingError: '',
  maxLayer: DEFAULT_VALUE.outPallet.maxLayer as string,
  maxLayerError: '',
  selectedPallet: DEFAULT_VALUE.outPallet.selectedSize as string,
  useOverhangUnderhang: Number(DEFAULT_VALUE.outPallet.useOverhangUnderhang),
  isOverhang: Number(DEFAULT_VALUE.outPallet.isOverhang)
};

export const OutPalletSlice = createSlice({
  name: 'outpallet',
  initialState: outPalletInitial,
  reducers: {
    setInputOutPallet: (state, { payload }) => {
      return { ...state, ...payload };
    },
    setOutpalletInitial: (state) => {
      return { ...state, ...outPalletInitial };
    }
  }
});

export const { setInputOutPallet, setOutpalletInitial } = OutPalletSlice.actions;

export default OutPalletSlice.reducer;
