/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Container, FormLabel, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { Context, IRobotManager } from 'dart-api';
import { TFunction, withTranslation } from 'react-i18next';
import React from 'react';
import { ModuleContext } from './ModuleContext';
import PalletStyles from './assets/styles/style.scss';

interface RobotInformationScreenProps {
  hidden: boolean;
  isRobotConnected: boolean;
  t: TFunction;
}
interface RobotInformationState {
  model: string;
  payload: string;
  reach: string;
}
class RobotInformationScreen extends React.Component<RobotInformationScreenProps, RobotInformationState> {
  private checkRobotTimeout: NodeJS.Timer | undefined;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  private robotManager: IRobotManager;
  constructor(props: RobotInformationScreenProps) {
    super(props);
    this.state = {
      model: '',
      payload: '',
      reach: ''
    };
  }
  getRobotModel = () => {
    /* istanbul ignore next */
    try {
      this.robotManager = this.context.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
      const model = this.robotManager.getRobotModel() || '';
      const robotInforRegex = /[0-9]{4}/;
      const reachPayloadInfo = model.match(robotInforRegex);
      const indexSubStr = 2;
      const numberFixed = 3;
      const reachNumber = 100;
      if (reachPayloadInfo !== null && reachPayloadInfo !== undefined) {
        const payloadStr = model.substr(reachPayloadInfo.index, indexSubStr);
        const reachStr = model.substr(reachPayloadInfo.index + indexSubStr, indexSubStr);
        this.setState({
          model: model,
          payload: parseFloat(payloadStr).toFixed(numberFixed),
          reach: (parseFloat(reachStr) * reachNumber).toFixed(numberFixed)
        });
      } else {
        this.setState({
          model: model,
          payload: '',
          reach: ''
        });
      }
    } catch (e) {
      // For UT - DEL - Start
      // logger.info('Get robot model Error: ' + e);
      // For UT - DEL - End
    }
    const timeOut = 1000;
    this.checkRobotTimeout = setTimeout(this.getRobotModel, timeOut);
  };
  componentDidMount() {
    this.getRobotModel();
  }
  componentWillUnmount() {
    if (this.checkRobotTimeout) {
      clearTimeout(this.checkRobotTimeout);
    }
  }
  render() {
    const { t } = this.props;
    return (
      <>
        <Grid
          item={true}
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${PalletStyles['robot-screen']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false}>
            <Grid className={PalletStyles['module-robot-setting']}>
              <Typography className={PalletStyles['title']}>{t('robot-information')}</Typography>
              <Grid className={PalletStyles['row-spacing']}>
                <FormLabel className={PalletStyles['form-label-item']}>{t('robot-model')}</FormLabel>
                <TextField
                  type="tel"
                  inputProps={{ maxLength: 11 }}
                  value={this.state.model}
                  className={`${PalletStyles['form-label-textfield']} ${PalletStyles['text-align-left']}`}
                  disabled
                ></TextField>
              </Grid>
              <Grid className={PalletStyles['row-spacing']}>
                <FormLabel className={PalletStyles['form-label-item']}>{t('payload')}</FormLabel>
                <TextField
                  type="tel"
                  inputProps={{ maxLength: 11 }}
                  value={this.state.payload}
                  className={PalletStyles['form-label-textfield']}
                  InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  disabled
                ></TextField>
              </Grid>
              <Grid className={PalletStyles['row-spacing']}>
                <FormLabel className={PalletStyles['form-label-item']}>{t('reach')}</FormLabel>
                <TextField
                  type="tel"
                  inputProps={{ maxLength: 11 }}
                  value={this.state.reach}
                  className={PalletStyles['form-label-textfield']}
                  InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                  disabled
                ></TextField>
              </Grid>
            </Grid>
          </Container>
        </Grid>
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(RobotInformationScreen);
