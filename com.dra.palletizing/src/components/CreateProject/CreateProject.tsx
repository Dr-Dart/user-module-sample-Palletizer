/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button, Container, FormHelperText, FormLabel, Grid, TextField, Typography } from '@mui/material';
import React, { Component } from 'react';
import PalletStyles from '../../assets/styles/style.scss';
import { TFunction, withTranslation } from 'react-i18next';
interface CreateProjectProps {
  title: string;
  lable: string;
  handlerOnBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handlerOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  projectNameError: string;
  projectName: string;
  disabled: boolean;
  handlerOnMouseDown: () => void;
  hanlderOnClick: () => void;
  t: TFunction;
}
class CreateProject extends Component<CreateProjectProps, unknown> {
  constructor(props: CreateProjectProps) {
    super(props);
  }
  handlerOnblur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.handlerOnBlur(e);
  };
  handlerOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.handlerOnChange(e);
  };
  render() {
    const { t } = this.props;
    return (
      <>
        <Container component="main" maxWidth="sm">
          <Typography className={PalletStyles['title']}>{this.props.title}</Typography>
          <Grid item md={12} lg={12} className={PalletStyles['form-create']}>
            <FormLabel htmlFor="filename" className={PalletStyles['label']}>
              {this.props.lable}
            </FormLabel>
            <TextField
              inputProps={{ maxLength: 30 }}
              onBlur={this.handlerOnblur}
              error={!!this.props.projectNameError}
              className={PalletStyles['form-input']}
              name="project_name"
              id="filename"
              placeholder={t('enter-prj-name')}
              onChange={this.handlerOnChange}
              value={this.props.projectName}
            />
            <FormHelperText className={PalletStyles['error-appmain']}>{this.props.projectNameError}</FormHelperText>
            <Grid className={PalletStyles['create-button']}>
              <Button
                disabled={this.props.disabled}
                variant="contained"
                className={PalletStyles['button-create']}
                onMouseDown={this.props.handlerOnMouseDown}
                onClick={this.props.hanlderOnClick}
              >
                {`${t('create')}`}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(CreateProject);
