/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import React from 'react';
import classes from './ProductIndex.module.css';

interface ProductIndexProps {
  inPalletIndexProps?: (index:number | string) => React.ReactNode | string
  outPalletIndexProps?: (index:number | string) => React.ReactNode | string
  indexIn: number | string
  indexOut: number | string
}
const ProductIndex = (props: ProductIndexProps) => {
  return (
    <div className={classes.index} >
      <div>
        <div> In-feeder </div>
        index : {props.inPalletIndexProps ? props.inPalletIndexProps(props.indexIn) : props.indexIn}
      </div>
      <div>
        <div> Out-feeder </div>
        index : {props.outPalletIndexProps ? props.outPalletIndexProps(props.indexOut) : props.indexOut}
      </div>
    </div>
  );
}

export default ProductIndex;