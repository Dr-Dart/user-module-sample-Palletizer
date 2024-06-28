/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_VALUE, ProductInformation } from '../consts';

const productSliceInitial = {
  length: DEFAULT_VALUE.productInformation.length,
  lengthError: '',
  width: DEFAULT_VALUE.productInformation.width,
  widthError: '',
  height: DEFAULT_VALUE.productInformation.height,
  heightError: '',
  weight: DEFAULT_VALUE.productInformation.weight,
  weightError: ''
} as ProductInformation;

export const ProductSlice = createSlice({
  name: 'product',
  initialState: productSliceInitial,
  reducers: {
    setProductInformation: (state: { [key: string]: string }, { payload }) => {
      const result = Object.assign(state, payload);
      return result;
    },
    setProductInitial: (state) => {
      return { ...state, ...productSliceInitial };
    }
  }
});

export const { setProductInformation, setProductInitial } = ProductSlice.actions;

export default ProductSlice.reducer;
