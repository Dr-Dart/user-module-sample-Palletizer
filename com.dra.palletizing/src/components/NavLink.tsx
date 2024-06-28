/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button, Typography } from '@mui/material';
import React, { Component } from 'react';
import LeftMenuStyles from '../assets/styles/leftMenu.scss';

type Props = {
  value: number | string;
  title: string | number;
  processStep: number;
  onClick: (value: number) => void;
};

export default class NavLink extends Component<Props, unknown> {
  render() {
    return (
      <>
        <Button
          className={LeftMenuStyles['step-button'] + ' ' + (this.props.processStep === this.props.value ? LeftMenuStyles['selected'] : '')}
          onClick={() => this.props.onClick(Number(this.props.value))}
        >
          <Typography className={LeftMenuStyles["number"]}>{this.props.value}</Typography>
          <Typography className={LeftMenuStyles["text"]}>{this.props.title}</Typography>
        </Button>
      </>
    );
  }
}
