/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button, Container, Grid, Typography } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { SDKViewer } from './sdk';
import { ModuleContext } from './ModuleContext';
import { GripperReducer } from './redux/GripperSlice';
import { OnlyRunMapStateToProps } from './type';
import { TFunction, withTranslation } from 'react-i18next';
import PalletStyles from './assets/styles/style.scss';
import DeviceScreenStyles from './assets/styles/setDeviceScreen.scss';

interface SetDeviceSreenProps {
  hidden: boolean;
  onGoToSetClick: () => void;
  onGraspClick: () => void;
  onReleaseClick: () => void;
  isRobotConnected: boolean;
  isServoOn: boolean;
  running: boolean;
  moduleRootPath: string;
  robotModel: string;
  gripper: GripperReducer;
  t: TFunction;
  showSDK?: boolean;
}
class SetDeviceSreen extends React.Component<SetDeviceSreenProps> {
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: SetDeviceSreenProps) {
    super(props);
  }
  render(): React.ReactNode {
    const { showSDK = true, t } = this.props;
    return (
      <>
        <Grid
          item
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${DeviceScreenStyles['device-screen']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false} className={`${PalletStyles['space-bottom']} ${DeviceScreenStyles['grid-width']}`}>
            <Typography variant="h6" className={PalletStyles['title']}>
              {t('required-device')}
            </Typography>
            <Grid item container xs>
              <Grid item xs={12} md={12} lg={7} className={DeviceScreenStyles['table']}>
                <Grid container item rowSpacing={2}>
                  <Grid item xs={1} className={DeviceScreenStyles['table-header']}>
                    {t('device')}
                  </Grid>
                  <Grid
                    item
                    xs={3}
                    className={`${DeviceScreenStyles['table-header']} ${PalletStyles['responsive-col']}`}
                  >
                    {t('ready-to-use')}
                  </Grid>
                  <Grid item xs={5} className={DeviceScreenStyles['table-header']}>
                    {t('test')}
                  </Grid>
                  <Grid item xs={3} className={DeviceScreenStyles['table-header']}>
                    {t('setting')}
                  </Grid>
                  <Grid item xs={1} className={DeviceScreenStyles['table-content']}>
                    {t('gripper')}
                  </Grid>
                  <Grid item xs={3} className={DeviceScreenStyles['table-content']}>
                    {t('n-a')}
                  </Grid>
                  <Grid item xs={5} className={DeviceScreenStyles['table-content']}>
                    <Button
                      className={DeviceScreenStyles['test-button']}
                      variant="contained"
                      onClick={this.props.onGraspClick}
                      disabled={!this.props.isServoOn || !this.props.isRobotConnected || this.props.running}
                    >
                      {t('grasp')}
                    </Button>
                    <Button
                      className={DeviceScreenStyles['test-button']}
                      variant="contained"
                      onClick={this.props.onReleaseClick}
                      disabled={!this.props.isServoOn || !this.props.isRobotConnected || this.props.running}
                    >
                      {t('release')}
                    </Button>
                  </Grid>
                  <Grid item xs={3} className={DeviceScreenStyles['table-content']}>
                    <Button
                      disabled={this.props.running}
                      className={DeviceScreenStyles['setting-button']}
                      variant="outlined"
                      onClick={this.props.onGoToSetClick}
                    >
                      {t('go-to-set')}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={12} lg={5} height="450px">
                {showSDK && !this.props.hidden && (
                  <SDKViewer
                    context={this.context}
                    moduleRootPath={this.props.moduleRootPath}
                    robotModel={this.props.robotModel}
                    showRobot={true}
                    showDirection={true}
                    monitorMotion={true}
                    showTCP={this.props.gripper.showTCP}
                  ></SDKViewer>
                )}
              </Grid>
            </Grid>
          </Container>
        </Grid>
      </>
    );
  }
}
function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    gripper: state.gripper
  };
}
export default connect(mapStateToProps)(withTranslation('com.dra.palletizing')(SetDeviceSreen));
