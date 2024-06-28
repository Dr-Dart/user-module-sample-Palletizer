/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Button,
  Card,
  CardActionArea,
  Chip,
  Container,
  Divider,
  FormHelperText,
  Grid,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import { Context, IDartDatabase } from 'dart-api';
import React from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { GRIPPER_TCP, TABLE_GRIPPER } from './consts';
import { ModuleContext } from './ModuleContext';
import { GripperReducer, Gripper_name, setGripperInformation, setGripperInitial } from './redux/GripperSlice';
import { GripperInformation, OnlyRunMapStateToProps } from './type';
import {
  deepCompareEqual,
  isFloatNumber,
  isIntegerNumber,
  // scrollToElement,
  showGroupMessage,
  validationPosition
} from './util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Zimmer_HRC_03 from './assets/images/zimmer_hrc_03.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Onrobot_Vgp20 from './assets/images/onrobot_vgp20.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Schmalz_Fmcb from './assets/images/schmalz_fmcb.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Robotic_Airq from './assets/images/robotic_airq.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Onrobot_Fgp20 from './assets/images/onrobot_fgp20.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Logo_Zimmer_HRC_03 from './assets/images/img_logo_zimmer.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Logo_Onrobot from './assets/images/img_logo_onrobot.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Logo_Schmalz_Fmcb from './assets/images/img_logo_schmalz.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import Logo_Robotic_Airq from './assets/images/img_logo_robotiq.png';
import PalletStyles from './assets/styles/style.scss';
import GripperScreenStyles from './assets/styles/gripperScreen.scss';

declare const window: any;
interface GripperScreenProps {
  hidden: boolean;
  onGraspClick: () => void;
  onReleaseClick: () => void;
  projectId: string;
  isRobotConnected: boolean;
  isServoOn: boolean;
  setGripperInformation: (action: { payload: { [key: string]: string | boolean } }) => void;
  setGripperInitial: () => void;
  running: boolean;
  gripperScreen: GripperReducer;
  setDataChanged?: (changed: boolean) => void;
  t: TFunction;
}
interface GripperScreenState {
  [x: string]: string | boolean | null | number | GripperInformation;
  loaded: boolean;
  changed: boolean;
  selectedAction: 'grasp' | 'release';
  selectedGripper: GripperInformation;
  errorX: string;
  errorY: string;
  errorZ: string;
  errorA: string;
  errorB: string;
  errorC: string;
  x: string | number | null;
  y: string | number | null;
  z: string | number | null;
  a: string | number | null;
  b: string | number | null;
  c: string | number | null;
  changeLocal: boolean;
  logoGripper: string;
}

class GripperScreen extends React.Component<GripperScreenProps, GripperScreenState> {
  private db: IDartDatabase;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;

  constructor(props: GripperScreenProps) {
    super(props);
    const gripperNameSelected = this.props.gripperScreen.selectedGripper.name;
    const valueTCPStore = this.props.gripperScreen;
    this.state = {
      selectedAction: this.props.gripperScreen.selectedAction,
      loaded: false,
      changed: false,
      selectedGripper: GRIPPER_TCP[gripperNameSelected],
      x: this.props.gripperScreen.x,
      y: this.props.gripperScreen.y,
      z: this.props.gripperScreen.z,
      a: this.props.gripperScreen.a,
      b: this.props.gripperScreen.b,
      c: this.props.gripperScreen.c,
      errorX: this.props.gripperScreen.errorX,
      errorY: this.props.gripperScreen.errorY,
      errorZ: this.props.gripperScreen.errorZ,
      errorA: this.props.gripperScreen.errorA,
      errorB: this.props.gripperScreen.errorB,
      errorC: this.props.gripperScreen.errorC,
      changeLocal: false,
      logoGripper: Logo_Zimmer_HRC_03
    };
    window.saveGripper = this.saveGripper.bind(this);
  }
  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadGripper().finally(() => this.setState({ loaded: true }));
  }

  /* istanbul ignore next */
  shouldComponentUpdate(nextProps: GripperScreenProps) {
    if (!nextProps.hidden) {
      return true;
    } else {
      if (!this.props.hidden) {
        return true;
      } else {
        return false;
      }
    }
  }

  loadGripper = async () => {
    const queryResult = await this.db?.query(TABLE_GRIPPER.name, TABLE_GRIPPER.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const gripperName = queryResult[0].data['name'];
      const dataGripper = {
        x: queryResult[0].data['x'],
        y: queryResult[0].data['y'],
        z: queryResult[0].data['z'],
        a: queryResult[0].data['a'],
        b: queryResult[0].data['b'],
        c: queryResult[0].data['c'],
        selectedAction: queryResult[0].data['selectedAction'],
        errorX: queryResult[0].data['errorX'],
        errorY: queryResult[0].data['errorY'],
        errorZ: queryResult[0].data['errorZ'],
        errorA: queryResult[0].data['errorA'],
        errorB: queryResult[0].data['errorB'],
        errorC: queryResult[0].data['errorC']
      };

      const data = {
        selectedGripper: GRIPPER_TCP[gripperName],
        ...dataGripper,
        zimmer_hrc_03: JSON.parse(queryResult[0].data['zimmer_hrc_03']),
        schmalz_fmcb: JSON.parse(queryResult[0].data['schmalz_fmcb']),
        onrobot_vgp20: JSON.parse(queryResult[0].data['onrobot_vgp20']),
        robotic_airq: JSON.parse(queryResult[0].data['robotic_airq']),
        onrobot_fgp20: JSON.parse(queryResult[0].data['onrobot_fgp20'])
      };
      this.props.setGripperInformation({ payload: data } as unknown as { payload: { [key: string]: string } });
      const dataSetState = {
        ...dataGripper,
        selectedGripper: GRIPPER_TCP[gripperName],
        logoGripper: this.handleLoadLogo(GRIPPER_TCP[gripperName].logo)
      };
      this.setState(dataSetState);
    } else {
      const defaultState = {
        errorX: '',
        errorY: '',
        errorZ: '',
        errorA: '',
        errorB: '',
        errorC: '',
        x: GRIPPER_TCP.zimmer_hrc_03.setting.x,
        y: GRIPPER_TCP.zimmer_hrc_03.setting.y,
        z: GRIPPER_TCP.zimmer_hrc_03.setting.z,
        a: GRIPPER_TCP.zimmer_hrc_03.setting.a,
        b: GRIPPER_TCP.zimmer_hrc_03.setting.b,
        c: GRIPPER_TCP.zimmer_hrc_03.setting.c,
        selectedGripper: GRIPPER_TCP.zimmer_hrc_03,
        selectedAction: 'grasp' as 'grasp' | 'release'
      };
      this.setState({ ...defaultState, logoGripper: Logo_Zimmer_HRC_03 }, () => {
        this.props.setGripperInitial();
      });
    }
  };
  saveGripper = async (projectId: string) => {
    // Sync local to redux
    // this.setGripperTCP();
    // Get data from local save to db
    /* istanbul ignore next */
    return await this.db
      ?.update(
        TABLE_GRIPPER.name,
        { projectId: projectId },
        {
          projectId: projectId,
          name: this.state.selectedGripper.name,
          x: this.state.x,
          y: this.state.y,
          z: this.state.z,
          a: this.state.a,
          b: this.state.b,
          c: this.state.c,
          selectedAction: this.state.selectedAction,
          errorX: this.state.errorX,
          errorY: this.state.errorY,
          errorZ: this.state.errorZ,
          errorA: this.state.errorA,
          errorB: this.state.errorB,
          errorC: this.state.errorC,
          zimmer_hrc_03: JSON.stringify(this.props.gripperScreen.zimmer_hrc_03),
          schmalz_fmcb: JSON.stringify(this.props.gripperScreen.schmalz_fmcb),
          onrobot_vgp20: JSON.stringify(this.props.gripperScreen.onrobot_vgp20),
          robotic_airq: JSON.stringify(this.props.gripperScreen.robotic_airq),
          onrobot_fgp20: JSON.stringify(this.props.gripperScreen.onrobot_fgp20)
        }
      )
      .then(async (countRowUpdated) => {
        if (countRowUpdated === 0) {
          await this.db
            ?.delete(TABLE_GRIPPER.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_GRIPPER.name, [
                projectId,
                this.state.selectedGripper.name,
                this.state.x,
                this.state.y,
                this.state.z,
                this.state.a,
                this.state.b,
                this.state.c,
                this.state.selectedAction,
                this.state.errorX,
                this.state.errorY,
                this.state.errorZ,
                this.state.errorA,
                this.state.errorB,
                this.state.errorC,
                JSON.stringify(this.props.gripperScreen.zimmer_hrc_03),
                JSON.stringify(this.props.gripperScreen.schmalz_fmcb),
                JSON.stringify(this.props.gripperScreen.onrobot_vgp20),
                JSON.stringify(this.props.gripperScreen.robotic_airq),
                JSON.stringify(this.props.gripperScreen.onrobot_fgp20)
              ]);
            });
        }
      });
  };

  componentDidUpdate(prevProps: GripperScreenProps, prevState: GripperScreenState) {
    const { loaded: prevLoaded } = prevState;
    const { changed: currentChanged } = this.state;
    const { ...previousProps } = prevProps.gripperScreen;
    const { ...currentProps } = this.props.gripperScreen;
    /* istanbul ignore next */
    if (!deepCompareEqual(prevProps.gripperScreen, this.props.gripperScreen)) {
      this.props.setDataChanged?.(true);
    }

    /* istanbul ignore next */
    if (prevLoaded && !currentChanged) {
      if (JSON.stringify(previousProps) !== JSON.stringify(currentProps)) {
        this.setState({ changed: true });
      }
    }

    // When change step, reset input to value set nearest
    if (this.state.changeLocal && this.props.hidden) {
      const data = {
        selectedGripper: this.props.gripperScreen.selectedGripper,
        x: this.props.gripperScreen.x,
        y: this.props.gripperScreen.y,
        z: this.props.gripperScreen.z,
        a: this.props.gripperScreen.a,
        b: this.props.gripperScreen.b,
        c: this.props.gripperScreen.c,
        selectedAction: this.props.gripperScreen.selectedAction,
        errorX: this.props.gripperScreen.errorX,
        errorY: this.props.gripperScreen.errorY,
        errorZ: this.props.gripperScreen.errorZ,
        errorA: this.props.gripperScreen.errorA,
        errorB: this.props.gripperScreen.errorB,
        errorC: this.props.gripperScreen.errorC,
        changeLocal: false
      };
      this.setState(data);
    }
  }
  /** Use this function in index for leftMenu */
  /* istanbul ignore next */
  saved = () => {
    this.setState({ changed: false });
  };

  /** Use this function in index for leftMenu */
  /* istanbul ignore next */
  haschanged = (): boolean => {
    return this.state.changed;
  };

  handleSelectGriper = (gripper: GripperInformation) => {
    const dataStore = this.props.gripperScreen[gripper.name as Gripper_name];
    const data = {
      selectedGripper: gripper,
      errorX: dataStore.errorX,
      errorY: dataStore.errorY,
      errorZ: dataStore.errorZ,
      errorA: dataStore.errorA,
      errorB: dataStore.errorB,
      errorC: dataStore.errorC,
      x: dataStore.setting.x,
      y: dataStore.setting.y,
      z: dataStore.setting.z,
      a: dataStore.setting.a,
      b: dataStore.setting.b,
      c: dataStore.setting.c,
      selectedAction: dataStore.selectedAction
    };
    this.props.setGripperInformation({ payload: data } as unknown as { payload: { [key: string]: string } });

    // Change local
    this.setState({ ...data, changeLocal: false, logoGripper: this.handleLoadLogo(gripper.logo) }, () => {
      // this.setTCP();
    });
  };

  /* istanbul ignore next */
  checkInput(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isCheckFloat = true,
    acceptNegative = false
  ) {
    const { name, value, selectionStart, selectionEnd } = event.target;
    /* istanbul ignore next */
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }

    const isNumber = isCheckFloat ? isFloatNumber(value, acceptNegative) : isIntegerNumber(value, acceptNegative);
    if (value === '' || isNumber) {
      this.setState({ [name]: value }, () => {
        this.updateDataStateToStore();
      });
    } else {
      /* istanbul ignore next */
      event.target.selectionStart = selectionStart - 1;
      event.target.selectionEnd = selectionEnd - 1;
    }
    this.setState({ changeLocal: true });
  }

  /* istanbul ignore next */
  validationPosition(
    event: React.ChangeEvent<HTMLInputElement>,
    errorType: 'errorX' | 'errorY' | 'errorZ' | 'errorA' | 'errorB' | 'errorC'
  ) {
    const { name } = event.target;
    const result = validationPosition(event);
    if (typeof result !== 'string') {
      this.setState(
        {
          [errorType]: '',
          [name]: result.value
        },
        () => {
          this.updateDataStateToStore();
        }
      );
    } else {
      /* istanbul ignore next */
      this.setState(
        {
          [errorType]: result
        },
        () => {
          this.updateDataStateToStore();
        }
      );
      // return scrollToElement(event.target);
    }
  }

  /* istanbul ignore next */
  onTestButtonClick = () => {
    if (this.state.selectedAction === 'grasp') {
      this.props.onGraspClick();
    } else {
      this.props.onReleaseClick();
    }
  };

  /* istanbul ignore next */
  changeAction = (e: SelectChangeEvent<'grasp' | 'release'>) => {
    this.setState({ selectedAction: e.target.value as 'grasp' | 'release' }, () => {
      this.updateDataStateToStore();
    });
  };

  updateDataStateToStore = () => {
    const gripperSelectedName = this.state.selectedGripper.name;
    const dataGripperTcp: GripperInformation = {
      ...GRIPPER_TCP[gripperSelectedName],
      setting: {
        x: this.state.x,
        y: this.state.y,
        z: this.state.z,
        a: this.state.a,
        b: this.state.b,
        c: this.state.c
      },
      errorX: this.state.errorX,
      errorY: this.state.errorY,
      errorZ: this.state.errorZ,
      errorA: this.state.errorA,
      errorB: this.state.errorB,
      errorC: this.state.errorC,
      selectedAction: this.state.selectedAction
    };
    const dataForSaveStore = {
      x: this.state.x,
      y: this.state.y,
      z: this.state.z,
      a: this.state.a,
      b: this.state.b,
      c: this.state.c,
      errorX: this.state.errorX,
      errorY: this.state.errorY,
      errorZ: this.state.errorZ,
      errorA: this.state.errorA,
      errorB: this.state.errorB,
      errorC: this.state.errorC,
      selectedAction: this.state.selectedAction,
      [gripperSelectedName]: {
        ...dataGripperTcp
      }
    };
    this.props.setGripperInformation({ payload: dataForSaveStore } as unknown as {
      payload: { [key: string]: string };
    });
  };

  handleLoadLogo = (logoName?: string) => {
    switch (logoName) {
      case 'img_logo_zimmer.png':
        return Logo_Zimmer_HRC_03;
      case 'img_logo_onrobot.png':
        return Logo_Onrobot;
      case 'img_logo_schmalz.png':
        return Logo_Schmalz_Fmcb;
      case 'img_logo_robotiq.png':
        return Logo_Robotic_Airq;
      default:
        return Logo_Zimmer_HRC_03;
    }
  };

  render() {
    const gripperScreen = {
      selectedGripper: this.state.selectedGripper,
      errorX: this.state.errorX,
      errorY: this.state.errorY,
      errorZ: this.state.errorZ,
      errorA: this.state.errorA,
      errorB: this.state.errorB,
      errorC: this.state.errorC,
      x: this.state.x,
      y: this.state.y,
      z: this.state.z,
      a: this.state.a,
      b: this.state.b,
      c: this.state.c,
      selectedAction: this.state.selectedAction,
      logoGripper: this.state.logoGripper
    };
    const { t } = this.props;
    return (
      <>
        <Grid
          item={true}
          flex="1"
          xs
          className={`${PalletStyles['screen']} ${GripperScreenStyles['gripper-screen']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false}>
            <Typography variant="h5" fontWeight="bold" className={PalletStyles['title']}>
              {t('gripper-interface-settings')}
            </Typography>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Typography fontWeight="400" fontSize="12px" marginY={'16px'}>
              {t('select-gripper-model')}
            </Typography>
            <RadioGroup defaultValue={gripperScreen.selectedGripper?.name}>
              <Grid container className={GripperScreenStyles['gripper-select-container']}>
                <Grid item md={4} lg={2} className={GripperScreenStyles['gripper-items']}>
                  <Card className={GripperScreenStyles['card-items']}>
                    <CardActionArea
                      disabled={this.props.running}
                      onClick={() => this.handleSelectGriper(GRIPPER_TCP.zimmer_hrc_03)}
                    >
                      <img src={Zimmer_HRC_03} alt="zimmer_hrc_03" className={GripperScreenStyles['grip-image']} />
                      <Radio
                        checkedIcon={<span className={GripperScreenStyles['radio-btn--checked']} />}
                        icon={<span className={GripperScreenStyles['radio-btn']} />}
                        value={GRIPPER_TCP.zimmer_hrc_03.name}
                        checked={gripperScreen.selectedGripper === GRIPPER_TCP.zimmer_hrc_03}
                        name="img_logo_zimmer"
                        onClick={() => this.handleSelectGriper(GRIPPER_TCP.zimmer_hrc_03)}
                      />
                      <Typography variant="body1" fontSize="14px" lineHeight="20px" fontWeight="400px">
                        Zimmer HRC 03
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item md={4} lg={2} className={GripperScreenStyles['gripper-items']}>
                  <Card className={GripperScreenStyles['card-items']}>
                    <CardActionArea
                      disabled={this.props.running}
                      onClick={() => this.handleSelectGriper(GRIPPER_TCP.onrobot_vgp20)}
                    >
                      <img src={Onrobot_Vgp20} alt="onrobot_vgp20" className={GripperScreenStyles['grip-image']} />
                      <Radio
                        checkedIcon={<span className={GripperScreenStyles['radio-btn--checked']} />}
                        icon={<span className={GripperScreenStyles['radio-btn']} />}
                        value={GRIPPER_TCP.onrobot_vgp20.name}
                        checked={gripperScreen.selectedGripper === GRIPPER_TCP.onrobot_vgp20}
                        name="img_logo_onrobot"
                        onClick={() => this.handleSelectGriper(GRIPPER_TCP.onrobot_vgp20)}
                      />
                      <Typography variant="body1" fontSize="14px" lineHeight="20px" fontWeight="400px">
                        OnRobot VGP 20
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item md={4} lg={2} className={GripperScreenStyles['gripper-items']}>
                  <Card className={GripperScreenStyles['card-items']}>
                    <CardActionArea
                      disabled={this.props.running}
                      onClick={() => this.handleSelectGriper(GRIPPER_TCP.schmalz_fmcb)}
                    >
                      <img src={Schmalz_Fmcb} alt="schmalz_fmcb" className={GripperScreenStyles['grip-image']} />
                      <Radio
                        checkedIcon={<span className={GripperScreenStyles['radio-btn--checked']} />}
                        icon={<span className={GripperScreenStyles['radio-btn']} />}
                        value={GRIPPER_TCP.schmalz_fmcb.name}
                        checked={gripperScreen.selectedGripper === GRIPPER_TCP.schmalz_fmcb}
                        name="img_logo_schmalz"
                        onClick={() => this.handleSelectGriper(GRIPPER_TCP.schmalz_fmcb)}
                      />
                      <Typography variant="body1" fontSize="14px" lineHeight="20px" fontWeight="400px">
                        Schmalz FMCB
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item md={4} lg={2} className={GripperScreenStyles['gripper-items']}>
                  <Card className={GripperScreenStyles['card-items']}>
                    <CardActionArea
                      disabled={this.props.running}
                      onClick={() => this.handleSelectGriper(GRIPPER_TCP.robotic_airq)}
                    >
                      <img src={Robotic_Airq} alt="robotic_airq" className={GripperScreenStyles['grip-image']} />
                      <Radio
                        checkedIcon={<span className={GripperScreenStyles['radio-btn--checked']} />}
                        icon={<span className={GripperScreenStyles['radio-btn']} />}
                        value={GRIPPER_TCP.robotic_airq.name}
                        checked={gripperScreen.selectedGripper === GRIPPER_TCP.robotic_airq}
                        name="img_logo_robotiq"
                        onClick={() => this.handleSelectGriper(GRIPPER_TCP.robotic_airq)}
                      />
                      <Typography variant="body1" fontSize="14px" lineHeight="20px" fontWeight="400px">
                        Robotiq Air Pick
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item md={4} lg={2} className={GripperScreenStyles['gripper-items']}>
                  <Card className={GripperScreenStyles['card-items']}>
                    <CardActionArea
                      disabled={this.props.running}
                      onClick={() => this.handleSelectGriper(GRIPPER_TCP.onrobot_fgp20)}
                    >
                      <img src={Onrobot_Fgp20} alt="onrobot_fgp20" className={GripperScreenStyles['grip-image']} />
                      <Radio
                        checkedIcon={<span className={GripperScreenStyles['radio-btn--checked']} />}
                        icon={<span className={GripperScreenStyles['radio-btn']} />}
                        value={GRIPPER_TCP.onrobot_fgp20.name}
                        checked={gripperScreen.selectedGripper === GRIPPER_TCP.onrobot_fgp20}
                        name="img_logo_onrobot"
                        onClick={() => this.handleSelectGriper(GRIPPER_TCP.onrobot_fgp20)}
                      />
                      <Typography variant="body1" fontSize="14px" lineHeight="20px" fontWeight="400px">
                        OnRobot 2FGP20
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
            </RadioGroup>

            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Grid container xs className={PalletStyles['producer-container']}>
              <Grid item xs={2} maxWidth="12em" paddingRight="16px">
                <img
                  src={gripperScreen.logoGripper}
                  alt="producer"
                  className={GripperScreenStyles['grip-image--producer']}
                />
              </Grid>
              <Grid container item xs={10} paddingLeft="10px">
                <Grid item xs={12} className={GripperScreenStyles['flange-io']}>
                  <Chip label={t('flange-IO')} className={PalletStyles['tag__custom']} />
                </Grid>
                <Grid xs={12} container item className={GripperScreenStyles['action-space']}>
                  <Grid item xs={2} className={GripperScreenStyles['gripper-status']}>
                    {t('n-a')}
                  </Grid>
                  <Grid item xs={3} className={GripperScreenStyles['action-title']}>
                    {t('action')}
                  </Grid>
                  <Grid item xs={4}>
                    <Select
                      className={GripperScreenStyles['form-select']}
                      value={gripperScreen.selectedAction}
                      onChange={this.changeAction}
                      IconComponent={ExpandMoreIcon}
                      disabled={this.props.running}
                      MenuProps={{
                        className: 'grasp-release-select'
                      }}
                    >
                      <MenuItem value="grasp">{t('grasp')}</MenuItem>
                      <MenuItem value="release">{t('release')}</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={3} paddingLeft="2em">
                    <Button
                      variant="contained"
                      className={GripperScreenStyles['test-button']}
                      onClick={this.onTestButtonClick}
                      disabled={!this.props.isRobotConnected || this.props.running}
                    >
                      {t('test')}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid
              container
              display="flex"
              alignItems="flex-start"
              className={GripperScreenStyles['grid-ctn']}
            >
              <Typography
                className={GripperScreenStyles['typo-tool']}
              >
                {t('tool-center-point')}
              </Typography>
              <Grid container md={12} lg={12} xl={6} className={GripperScreenStyles['tcp-position']}>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    defaultValue={gripperScreen.x}
                    variant="outlined"
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorX')}
                    error={!!gripperScreen.errorX?.length}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">X</InputAdornment>,
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.x}
                    disabled={this.props.running}
                    name="x"
                  />
                </Grid>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorY')}
                    error={!!gripperScreen.errorY?.length}
                    defaultValue={gripperScreen.y}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Y</InputAdornment>,
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.y}
                    disabled={this.props.running}
                    name="y"
                  />
                </Grid>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorZ')}
                    error={!!gripperScreen.errorZ?.length}
                    defaultValue={gripperScreen.z}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Z</InputAdornment>,
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.z}
                    disabled={this.props.running}
                    name="z"
                  />
                </Grid>
                <Grid xs={12} md={12} lg={12}>
                  {showGroupMessage([gripperScreen.errorX, gripperScreen.errorY, gripperScreen.errorZ]).map(
                    (msg: string, index: number) => (
                      <FormHelperText className={PalletStyles['error-common']} key={index}>
                        {t(msg)}
                      </FormHelperText>
                    )
                  )}
                </Grid>
              </Grid>

              <Grid container md={12} lg={12} xl={6} className={GripperScreenStyles['tcp-position']}>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorA')}
                    defaultValue={gripperScreen.a}
                    error={!!gripperScreen.errorA?.length}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">A</InputAdornment>,
                      endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.a}
                    disabled={this.props.running}
                    name="a"
                  />
                </Grid>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorB')}
                    error={!!gripperScreen.errorB?.length}
                    defaultValue={gripperScreen.b}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">B</InputAdornment>,
                      endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.b}
                    disabled={this.props.running}
                    name="b"
                  />
                </Grid>
                <Grid xs={4} md={4} lg={4}>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => this.validationPosition(e, 'errorC')}
                    error={!!gripperScreen.errorC?.length}
                    defaultValue={gripperScreen.c}
                    className={GripperScreenStyles['form-label-textfield']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">C</InputAdornment>,
                      endAdornment: <InputAdornment position="end">{`\u00B0`}</InputAdornment>
                    }}
                    onChange={(e) => this.checkInput(e, true, true)}
                    value={gripperScreen.c}
                    disabled={this.props.running}
                    name="c"
                  />
                </Grid>
                <Grid xs={12} md={12} lg={12}>
                  {showGroupMessage([gripperScreen.errorA, gripperScreen.errorB, gripperScreen.errorC]).map(
                    (msg: string, index: number) => (
                      <FormHelperText className={PalletStyles['error-common']} key={index}>
                        {t(msg)}
                      </FormHelperText>
                    )
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Grid>
      </>
    );
  }
}
function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setGripperInformation: (action: { payload: { [key: string]: string | boolean } }) =>
      dispatch(setGripperInformation(action.payload)),
    setGripperInitial: () => dispatch(setGripperInitial())
  };
}

function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    gripperScreen: state.gripper
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing')(GripperScreen)
);
