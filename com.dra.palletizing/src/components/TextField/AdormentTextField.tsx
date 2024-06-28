/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { InputAdornment, TextField } from '@mui/material';
import React, { ChangeEvent, Component, FocusEvent } from 'react';
import PalletStyles from '../../assets/styles/style.scss';

type Props = {
  startAdorment?: string;
  endAdorment: string;
  value: string | number;
  name: string;
  error: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
};

export default class AdormentTextField extends Component<Props, unknown> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <>
        <TextField
          inputProps={{ maxLength: 11 }}
          className={PalletStyles['form-label-textfield']}
          onChange={(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => this.props.onChange(event)}
          onBlur={(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => this.props.onBlur(event)}
          error={!!this.props.error}
          type="tel"
          value={this.props.value}
          InputProps={{
            startAdornment: this.props.startAdorment ? (
              <InputAdornment position="start">{this.props.startAdorment}</InputAdornment>
            ) : (
              <></>
            ),
            endAdornment: <InputAdornment position="end">{this.props.endAdorment}</InputAdornment>
          }}
          disabled={this.props.disabled}
          name={this.props.name}
        />
      </>
    );
  }
}
