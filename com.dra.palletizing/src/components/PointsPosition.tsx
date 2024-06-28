/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button, FormHelperText, FormLabel, Grid } from '@mui/material';
import { RobotSpace } from 'dart-api';
import React, { ChangeEvent, Component, FocusEvent, ReactNode } from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import { checkEmpty, checkError, checkErrorOnChange, showGroupMessage } from '../util';
import AdormentTextField from './TextField/AdormentTextField';
import PalletStyles from '../assets/styles/style.scss';

type PointPositionProps = {
  data: Record<string, string>;
  pointName?: string;
  errorMessage: any;
  //flag when using optional point
  useOptional?: boolean;
  //flag when using pose
  isPose?: boolean;
  //flag when using checkPick position show props children
  isCheckPick?: boolean;
  //is reactNode display component wrapper
  children?: ReactNode;
  handleChangeInput?: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  validationInput?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>, errorType: string) => void;
  getCurrentPosition?: (type: RobotSpace) => void;
  moveToPosition?: (type: RobotSpace) => void;
  stopMoveToPosition?: () => void;

  disableButton?: boolean;
  disabled?: boolean;
  t: TFunction;
  holdButton?: string;
  buttonName?: string;
  displayOptional?: boolean;
  unUseMove?: boolean;
};

class PointsPosition extends Component<PointPositionProps, unknown> {
  constructor(props: PointPositionProps) {
    super(props);
  }

  isDisplayMessageMultiPoint = () => {
    const lstMessage = ['ERR_018', 'ERR_019', 'ERR_020'];
    for (const [_, value] of Object.entries(this.props.errorMessage[0])) {
      if (lstMessage.includes(value as string)) {
        return true;
      }
    }
    return false;
  };

  render() {
    const { t } = this.props;
    return (
      <>
        <Grid item xs={12} className={PalletStyles['row-spacing']} marginBottom="1em">
          <FormLabel className={PalletStyles['form-label-item']}>{this.props.pointName || ''}</FormLabel>
        </Grid>
        <Grid xs={12} className={PalletStyles['button']} display="flex">
          {this.props.isCheckPick ? (
            this.props.children
          ) : (
            <>
              <Button
                onClick={() =>
                  this.props.getCurrentPosition?.(this.props.isPose ? RobotSpace.JOINT : RobotSpace.TASK)
                }
                className={this.props.unUseMove ? PalletStyles['button--save__custom'] : PalletStyles['button--save']}
                disabled={this.props.disableButton}
                variant="contained"
              >
                {!this.props.isPose ? t('get-position') : t('get-pose')}
              </Button>
            </>
          )}
          {!this.props.unUseMove && (
            <Button
              disableRipple={true}
              onTouchStart={() => this.props.moveToPosition?.(this.props.isPose ? RobotSpace.JOINT : RobotSpace.TASK)}
              onMouseDown={() => this.props.moveToPosition?.(this.props.isPose ? RobotSpace.JOINT : RobotSpace.TASK)}
              className={`${PalletStyles['button--move']} ${
                this.props.holdButton === this.props.buttonName ? PalletStyles['active'] : ''
              }`}
              onTouchEnd={() => this.props.stopMoveToPosition?.()}
              onMouseUp={() => this.props.stopMoveToPosition?.()}
              onMouseLeave={() => this.props.stopMoveToPosition?.()}
              disabled={
                this.props.disableButton ||
                checkEmpty(this.props.data) ||
                checkError({ ...this.props.errorMessage[0], ...this.props.errorMessage[1] }) ||
                checkErrorOnChange({
                  ...this.props.data
                })
              }
              variant="contained"
            >
              {!this.props.isPose ? t('move-to-position') : t('move-to-pose')}
            </Button>
          )}
        </Grid>

        {/** when using Pose position, add children component to here */}
        {this.props.isPose && this.props.children}
        <Grid container item md={12} lg={12}>
          <Grid item xs={4} paddingRight="10px">
            <AdormentTextField
              startAdorment={!this.props.isPose ? 'X' : 'J1'}
              endAdorment={!this.props.isPose ? 'mm' : `\u00B0`}
              // value={dataFormated[0] || ''}
              value={Object.values(this.props.data)[0] || ''}
              error={
                (Object.values(this.props.errorMessage[0])[0] as string) ||
                (this.props.errorMessage[0]?.[`calibOptDuplicate`] as string) ||
                this.props.errorMessage[0]?.[`calibFormAngle`] ||
                this.props.errorMessage[0]?.[`calibOptStraightAway`]
              }
              name={Object.keys(this.props.data)[0] || ''}
              onChange={(event) => this.props.handleChangeInput?.(event)}
              disabled={this.props.disabled}
              onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[0])[0])}
            />
          </Grid>
          <Grid item xs={4} paddingRight="10px">
            <AdormentTextField
              startAdorment={!this.props.isPose ? 'Y' : 'J2'}
              endAdorment={!this.props.isPose ? 'mm' : `\u00B0`}
              // value={dataFormated[1] || ''}
              value={Object.values(this.props.data)[1] || ''}
              error={
                (Object.values(this.props.errorMessage[0])[1] as string) ||
                !!this.props.errorMessage[0]?.[`calibOptDuplicate`] ||
                this.props.errorMessage[0]?.[`calibFormAngle`] ||
                !!this.props.errorMessage[0]?.[`calibOptStraightAway`]
              }
              name={Object.keys(this.props.data)[1] || ''}
              onChange={(event) => this.props.handleChangeInput?.(event)}
              disabled={this.props.disabled}
              onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[0])[1])}
            />
          </Grid>
          <Grid item xs={4}>
            <AdormentTextField
              startAdorment={!this.props.isPose ? 'Z' : 'J3'}
              endAdorment={!this.props.isPose ? 'mm' : `\u00B0`}
              // value={dataFormated[2] || ''}
              value={Object.values(this.props.data)[2] || ''}
              error={
                (Object.values(this.props.errorMessage[0])[2] as string) ||
                this.props.errorMessage[0]?.[`calibOptDuplicate`] ||
                this.props.errorMessage[0]?.[`calibFormAngle`] ||
                this.props.errorMessage[0]?.[`calibOptStraightAway`]
              }
              name={Object.keys(this.props.data)[2] || ''}
              onChange={(event) => this.props.handleChangeInput?.(event)}
              disabled={this.props.disabled}
              onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[0])[2])}
            />
          </Grid>
          {!this.props.isPose && (
            <Grid container item md={12} lg={12}>
              {!this.isDisplayMessageMultiPoint() &&
                showGroupMessage(Object.values(this.props.errorMessage[0]))?.map((msg: string, index: number) => (
                  <FormHelperText className={PalletStyles['error-common']} key={index}>
                    {t(msg)}
                  </FormHelperText>
                ))}
            </Grid>
          )}
          {!this.props.useOptional && (
            <>
              <Grid item xs={4} paddingRight="10px">
                <AdormentTextField
                  startAdorment={!this.props.isPose ? 'A' : 'J4'}
                  endAdorment={`\u00B0`}
                  // value={dataFormated[3] || ''}
                  value={Object.values(this.props.data)[3] || ''}
                  error={(Object.values(this.props.errorMessage[1])[0] as string) || ''}
                  name={Object.keys(this.props.data)[3] || ''}
                  onChange={(event) => this.props.handleChangeInput?.(event)}
                  disabled={this.props.displayOptional || this.props.disabled}
                  onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[1])[0])}
                />
              </Grid>
              <Grid item xs={4} paddingRight="10px">
                <AdormentTextField
                  startAdorment={!this.props.isPose ? 'B' : 'J5'}
                  endAdorment={`\u00B0`}
                  // value={dataFormated[4] || ''}
                  value={Object.values(this.props.data)[4] || ''}
                  error={(Object.values(this.props.errorMessage[1])[1] as string) || ''}
                  name={Object.keys(this.props.data)[4] || ''}
                  onChange={(event) => this.props.handleChangeInput?.(event)}
                  disabled={this.props.displayOptional || this.props.disabled}
                  onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[1])[1])}
                />
              </Grid>
              <Grid item xs={4}>
                <AdormentTextField
                  startAdorment={!this.props.isPose ? 'C' : 'J6'}
                  endAdorment={`\u00B0`}
                  // value={dataFormated[5] || ''}
                  value={Object.values(this.props.data)[5] || ''}
                  error={(Object.values(this.props.errorMessage[1])[2] as string) || ''}
                  name={Object.keys(this.props.data)[5] || ''}
                  onChange={(event) => this.props.handleChangeInput?.(event)}
                  disabled={this.props.displayOptional || this.props.disabled}
                  onBlur={(e) => this.props.validationInput?.(e, Object.keys(this.props.errorMessage[1])[2])}
                />
              </Grid>
              {!this.props.displayOptional && (
                <Grid container item md={12} lg={12}>
                  {showGroupMessage(Object.values(this.props.errorMessage[1]))?.map((msg: string, index: number) => (
                    <FormHelperText className={PalletStyles['error-common']} key={index}>
                      {t(msg)}
                    </FormHelperText>
                  ))}
                </Grid>
              )}
            </>
          )}
        </Grid>
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(PointsPosition);
