/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import {
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField
} from '@mui/material';
import React, { Component } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TFunction, withTranslation } from 'react-i18next';
import PalletStyles from '../assets/styles/style.scss';

type Props = {
  defaultValue: string;
  value: string;
  running: boolean;
  controlSelectValue: (e: SelectChangeEvent<string>) => void;
  palletLength: string;
  checkInputLength: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isCheckFloat: boolean,
    acceptNegative: boolean
  ) => void;
  checkInputWidth: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isCheckFloat: boolean,
    acceptNegative: boolean
  ) => void;
  validateLength: (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => void;
  validateWidth: (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => void;
  isLengthError: boolean;
  lengthError: string;
  selectedPallet: string;
  palletWidth: string;
  isWidthError: boolean;
  widthError: string;
  t: TFunction;
};
class SelectPallet extends Component<Props, unknown> {
  render() {
    const { t } = this.props;
    return (
      <>
        <Grid container item xs={12}>
          <Grid xs={12} item>
            <FormLabel className={PalletStyles['form-label-item']}>{t('standard-pallet')}</FormLabel>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <Select
              onChange={this.props.controlSelectValue}
              IconComponent={ExpandMoreIcon}
              className={`${PalletStyles['form-select']} ${PalletStyles['mui-outline-input-root']}`}
              defaultValue={this.props.defaultValue}
              value={this.props.value}
              disabled={this.props.running}
              MenuProps={{
                className: 'standard-pallet-select'
              }}
            >
              <MenuItem value="1016.000-1219.000">US1: 1016.000 x 1219.000</MenuItem>
              <MenuItem value="1067.000-1067.000">US2: 1067.000 x 1067.000</MenuItem>
              <MenuItem value="1219.000-1219.000">US3: 1219.000 x 1219.000</MenuItem>
              <MenuItem value="800.000-1200.000">EUR1: 800.000 x 1200.000</MenuItem>
              <MenuItem value="1200.000-1000.000">EUR2: 1200.000 x 1000.000</MenuItem>
              <MenuItem value="1000.000-1200.000">EUR3: 1000.000 x 1200.000</MenuItem>
              <MenuItem value="800.000-600.000">EUR6: 800.000 x 600.000</MenuItem>
              <MenuItem value="1100.000-1100.000">Asia: 1100.000 x 1100.000</MenuItem>
              <MenuItem value="CustomSize">{t('custom-size')}</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Grid container xs={12} item className={PalletStyles['row-spacing']}>
          <Grid xs={12} item>
            <FormLabel className={PalletStyles['form-label-item']}>{t('length')}</FormLabel>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <TextField
              type="tel"
              inputProps={{
                maxLength: 11
              }}
              name="inPalletLength"
              value={this.props.palletLength}
              className={PalletStyles['form-label-textfield']}
              defaultValue={this.props.palletLength}
              onChange={(e) => this.props.checkInputLength(e, true, false)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
              onBlur={(e) => this.props.validateLength(e)}
              error={this.props.isLengthError}
              disabled={this.props.selectedPallet !== 'CustomSize' || this.props.running}
            ></TextField>
          </Grid>
          <Grid item xs={12}>
            <FormHelperText id="helper-pallet-length" className={PalletStyles['error-common']}>
              {this.props.lengthError}
            </FormHelperText>
          </Grid>
        </Grid>
        <Grid container xs={12} item className={PalletStyles['row-spacing']}>
          <Grid xs={12} item>
            <FormLabel className={PalletStyles['form-label-item']}>{t('width')}</FormLabel>
          </Grid>
          <Grid item xs={12} md={12} lg={6}>
            <TextField
              type="tel"
              inputProps={{
                maxLength: 11
              }}
              name="inPalletWidth"
              value={this.props.palletWidth}
              className={PalletStyles['form-label-textfield']}
              defaultValue={this.props.palletWidth}
              onChange={(e) => this.props.checkInputWidth(e, true, false)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
              onBlur={(e) => this.props.validateWidth(e)}
              error={!!this.props.isWidthError}
              disabled={this.props.selectedPallet !== 'CustomSize' || this.props.running}
            ></TextField>
          </Grid>
          <Grid item xs={12}>
            <FormHelperText id="helper-pallet-width" className={PalletStyles['error-common']}>
              {this.props.widthError}
            </FormHelperText>
          </Grid>
        </Grid>
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(SelectPallet);
