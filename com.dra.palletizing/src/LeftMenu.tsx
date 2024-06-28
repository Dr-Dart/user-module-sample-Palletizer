/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import ErrorIcon from '@mui/icons-material/Error';
import {
  Button,
  ButtonGroup,
  Grid,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import {
  Context,
  IRobotParameterManager,
  logger,
  ModuleContext as DartModuleContext,
} from 'dart-api';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import NavLink from './components/NavLink';
import { LEFT_MENU, NUMBER_SELECT_PROCESS } from './consts';
import DialogCommon from './DialogCommon';
import { ModuleContext } from './ModuleContext';
import { setCalibInitial } from './redux/CalibrationSlice';
import { setCheckPickInitial } from './redux/CheckPickPlaceSlice';
import { setGripperType } from './redux/DeviceShortcutSlice';
import { GripperReducer, setGripperInformation, setGripperInitial } from './redux/GripperSlice';
import { setInpalletInitial } from './redux/InpalletSlice';
import { setOutpalletInitial } from './redux/OutPalletSlice';
import { setProductInitial } from './redux/ProductSlice';
import { OnlyRunMapStateToProps, ProjectInformation } from './type';
import { deepCompareEqual, handleOpenMenu } from './util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import THUMBNAIL_FILE from './assets/images/thumbnail-file.png';
import { TFunction, withTranslation } from 'react-i18next';
import LeftMenuStyles from './assets/styles/leftMenu.scss';
import ApiManager_IUH3459EDG from './ApiManager';
import { Coordinate, EulerType } from 'dart-api/dart-api-math';

const SELECT_ID = 'CheckTCP';
type LeftMenuState = {
  anchorEl: any;
  openConfirmDialog: boolean;
  openSaveDialog: boolean;
  openSaveAsDialog: boolean;
  openGoToMainDialog: boolean;
  loadingDialog: boolean;
  new_project_name: string;
  project_name_err: string;
  gripperType: string;
  changed: boolean;
  isSelectOtherProject: boolean;
  isChangePostion: boolean;
};

export type LeftMenuProps = {
  running: boolean;
  settingStep: number;
  processStep: number;
  deviceStep: number;
  setDefaultState: () => void;
  projectId: string;
  projectName: string;
  saveProject: (projectId: string) => Promise<number | void>;
  onSelectSetting: (value: number) => void;
  onSelectProcess: (value: number) => void;
  onSelectDevice: (value: number) => void;
  hasChanged: () => boolean | undefined;
  handleSaveAsActionConfirm: (NewProjectName: string) => Promise<string>;
  handleInputProject: (projectName: string) => Promise<string>;
  setInitialData: () => void;
  gripperScreen: GripperReducer;
  setGripperType: (action: { payload: { [key: string]: string } }) => void;
  setGripperInformation: (action: { payload: { [key: string]: string | boolean } }) => void;
  gripperType: string;
  t: TFunction;
  setDataChanged?: (changed: boolean) => void;
  saveProjectBeforeGotomain?: (projectId: string) => Promise<number | void>;
  projectList?: any;
  deleteProject?: (projectId: string | string[]) => Promise<void>;
};
export const ZERO_LENGTH = 3;
class LeftMenu extends Component<LeftMenuProps, LeftMenuState> {
  private thisApp = false;
  private robotParameterManager?: IRobotParameterManager;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  private apiManager!: ApiManager_IUH3459EDG;
  constructor(props: LeftMenuProps) {
    super(props);
    this.state = {
      anchorEl: null,
      openConfirmDialog: false,
      openSaveDialog: false,
      openSaveAsDialog: false,
      openGoToMainDialog: false,
      new_project_name: '',
      project_name_err: '',
      loadingDialog: false,
      gripperType: this.props.gripperType ?? '',
      changed: this.props.hasChanged() ?? false,
      isSelectOtherProject: false,
      isChangePostion: false
    };
  }
  /* istanbul ignore next */
  selectionCallback = (data: string) => {
    if (!this.thisApp && !!data) {
      const { gripperScreen } = this.props;
      const tcpValue = [
        Number(gripperScreen.x),
        Number(gripperScreen.y),
        Number(gripperScreen.z),
        Number(gripperScreen.a),
        Number(gripperScreen.b),
        Number(gripperScreen.c)
      ];
      const tcpList = this.robotParameterManager?.tcp.get();
      const currentPos = tcpList?.find((tcp) => tcp.symbol === data)?.tcp.targetPose;
      const poseZYX = currentPos?.map((pos) => Number(pos.toFixed(ZERO_LENGTH)));
      const fixedCurrPos = this.apiManager.MathLib.convertEuler({ pose: poseZYX, type: EulerType.ZYX } as Coordinate, EulerType.ZYZ);

      if (this.state.gripperType !== data) {
        if (!deepCompareEqual(fixedCurrPos.pose, tcpValue)) {
          this.setState({ gripperType: '', isSelectOtherProject: true });
          this.props.setGripperType({ payload: { gripperType: '' } });
        } else {
          this.setState({ gripperType: data, isSelectOtherProject: true });
          this.props.setGripperType({ payload: { gripperType: data } });
        }
      }
    } else {
      this.thisApp = false;
    }
  };

  componentDidMount() {
    this.robotParameterManager = this.context.getSystemManager(
      Context.ROBOT_PARAMETER_MANAGER
    ) as IRobotParameterManager;
    this.robotParameterManager = this.context.getSystemManager(
      Context.ROBOT_PARAMETER_MANAGER
    ) as IRobotParameterManager;
    this.robotParameterManager.tcp.selection.register(this.context, this.selectionCallback);
    // this.toolManager.tcp.selection.register(this.context, this.selectionCallback);
    this.apiManager = ApiManager_IUH3459EDG.inst();
    if (!this.apiManager.isInitialized()) {
      this.apiManager.initialize(this.context as DartModuleContext);
    }
  }
  /* istanbul ignore next */
  shouldComponentUpdate(prevProps: Readonly<LeftMenuProps>, prevState: Readonly<LeftMenuState>) {
    const obj1 = [prevProps, prevState];
    const obj2 = [this.props, this.state];
    return !deepCompareEqual(obj1, obj2);
  }
  /* istanbul ignore next */
  componentDidUpdate(prevProps: Readonly<LeftMenuProps>, prevStates: Readonly<LeftMenuState>): void {
    const obj1 = {
      X: this.props.gripperScreen?.x,
      Y: this.props.gripperScreen?.y,
      Z: this.props.gripperScreen?.z,
      A: this.props.gripperScreen?.a,
      B: this.props.gripperScreen?.b,
      C: this.props.gripperScreen?.c,
      errorX: this.props.gripperScreen?.errorX,
      errorY: this.props.gripperScreen?.errorY,
      errorZ: this.props.gripperScreen?.errorZ,
      errorA: this.props.gripperScreen?.errorA,
      errorB: this.props.gripperScreen?.errorB,
      errorC: this.props.gripperScreen?.errorC,
      selectedGripper: this.props.gripperScreen?.selectedGripper
    };
    const obj2 = {
      X: prevProps.gripperScreen?.x,
      Y: prevProps.gripperScreen?.y,
      Z: prevProps.gripperScreen?.z,
      A: prevProps.gripperScreen?.a,
      B: prevProps.gripperScreen?.b,
      C: prevProps.gripperScreen?.c,
      errorX: prevProps.gripperScreen?.errorX,
      errorY: prevProps.gripperScreen?.errorY,
      errorZ: prevProps.gripperScreen?.errorZ,
      errorA: prevProps.gripperScreen?.errorA,
      errorB: prevProps.gripperScreen?.errorB,
      errorC: prevProps.gripperScreen?.errorC,
      selectedGripper: prevProps.gripperScreen?.selectedGripper
    };
    const isChangePostion = !deepCompareEqual(obj1, obj2);
    if (isChangePostion) {
      this.setState({
        isChangePostion,
        gripperType: '',
        isSelectOtherProject: false
      });
    }
    if (isChangePostion && this.state.gripperType !== '') {
      this.props.setGripperType({
        payload: {
          gripperType: ''
        }
      });
    }
    const object1 = {
      gripperType: this.state.gripperType
    };
    const object2 = {
      gripperType: prevStates.gripperType
    };
    if (!deepCompareEqual(object1, object2)) {
      this.props.setDataChanged?.(true);
      this.setState({ changed: true });
    }
  }
  componentWillUnmount(): void {
    // this.toolManager?.tcp.selection.unregister(this.context, this.selectionCallback);
    this.robotParameterManager?.tcp.selection.unregister(this.context, this.selectionCallback);
  }

  /* istanbul ignore next */
  handleDeleteProject = async () => {
    const autoProjectExisted = this.props.projectList.filter((project: ProjectInformation) =>
      project.projectId.startsWith(`\u00a0AutoSave_${this.props.projectName}_2`)
    );
    const projectIdList = [...autoProjectExisted?.map((item: ProjectInformation) => item?.projectId)];
    await this.props.deleteProject?.(projectIdList);
  };

  /* istanbul ignore next */
  handleProcessBtn = () => {
    this.setState({ ...this.state, openSaveAsDialog: true, anchorEl: null });
  };

  /* istanbul ignore next */
  handleOnClickGoToMain = () => {
    this.setState({ anchorEl: null });
    if (this.props.hasChanged() || this.state.changed) {
      this.setState({ openGoToMainDialog: true });
    } else {
      this.goToMain();
    }
  };

  /* istanbul ignore next */
  openSaveConfirmDialog = () => {
    this.setState({ openConfirmDialog: true, anchorEl: null });
  };

  /* istanbul ignore next */
  handleCloseConfirm = () => {
    if (!this.state.loadingDialog) {
      this.setState({ ...this.state, openConfirmDialog: false, anchorEl: null });
    }
  };

  /* istanbul ignore next */
  handleCloseSaveAsDialog = () => {
    if (!this.state.loadingDialog) {
      this.setState({
        openSaveAsDialog: false,
        anchorEl: null,
        new_project_name: '',
        project_name_err: ''
      });
    }
  };

  /* istanbul ignore next */
  handleSaveAs = () => {
    this.handleDeleteProject().finally(() => {
      this.setState({ loadingDialog: true });
      this.props
        .handleSaveAsActionConfirm(this.state.new_project_name)
        .then(async (message: string) => {
          if (this.props.projectName.startsWith(`\u00a0AutoSave_`)) {
            await this.props.deleteProject?.(this.props.projectId);
          }
          if (message === '') {
            this.setState({
              openSaveAsDialog: false,
              anchorEl: null,
              new_project_name: '',
              project_name_err: '',
              loadingDialog: false
            });
          } else {
            this.setState({
              loadingDialog: false
            });
          }
        })
        .catch((err) => logger.info('save as error: ' + err));
    });
  };

  /* istanbul ignore next */
  goToMain = () => {
    this.handleDeleteProject().finally(() => {
      setTimeout(() => {
        this.setState(
          {
            new_project_name: '',
            project_name_err: '',
            anchorEl: null,
            openGoToMainDialog: false
          },
          () => this.props.setDefaultState()
        );
        this.props.setInitialData();
      }, 100);
    });
  };

  /* istanbul ignore next */
  closeGoToMainPopup = () => {
    if (!this.state.loadingDialog) {
      this.setState({ openGoToMainDialog: false, anchorEl: null });
    }
  };

  /* istanbul ignore next */
  onSaveProject = () => {
    this.handleDeleteProject().finally(() => {
      setTimeout(() => {
        this.setState(
          {
            anchorEl: null,
            openConfirmDialog: false,
            openSaveDialog: false,
            loadingDialog: true
          },
          () => {
            this.props.saveProject(this.props.projectId).then(() => {
              this.setState({ loadingDialog: false });
            });
          }
        );
      }, 100);
    });
  };

  /* istanbul ignore next */
  handleOpenMoreOptions(e: React.MouseEvent<HTMLAnchorElement>) {
    this.setState({ ...this.state, anchorEl: e.currentTarget });
  }

  /* istanbul ignore next */
  handleCloseMoreOptions = () => {
    this.setState({ anchorEl: null });
  };

  /* istanbul ignore next */
  validationFileName = async () => {
    const message = await this.props.handleInputProject(this.state.new_project_name);
    this.setState({ project_name_err: message });
  };

  /* istanbul ignore next */
  handleSaveBeforeGoToMain = () => {
    this.handleDeleteProject().finally(() => {
      setTimeout(() => {
        this.setState({ loadingDialog: true });
        this.props.saveProject(this.props.projectId).then(() => {
          this.props.setDefaultState();
          this.setState({ loadingDialog: false });
        });
      }, 100);
    });
  };

  /* istanbul ignore next */
  handleOnChangeSaveAs = (value: string) => {
    this.setState({ new_project_name: value });
  };

  /* istanbul ignore next */
  handleChangeTCP = async (e: SelectChangeEvent<any>) => {
    this.thisApp = true;
    try {
      const _fTargetPosError = {
        errorX: this.props.gripperScreen?.errorX,
        errorY: this.props.gripperScreen?.errorY,
        errorZ: this.props.gripperScreen?.errorZ,
        errorA: this.props.gripperScreen?.errorA,
        errorB: this.props.gripperScreen?.errorB,
        errorC: this.props.gripperScreen?.errorC
      };
      const isErrorTCP = Object.values(_fTargetPosError).some((item) => item !== '');
      if (!isErrorTCP) {
        const value = e.target.value as string;
        await this.robotParameterManager?.tcp.delete(value);
        const targetPose = this.apiManager.MathLib.convertEuler(
          {
            pose: [
              Number(this.props.gripperScreen?.x ?? 0),
              Number(this.props.gripperScreen?.y ?? 0),
              Number(this.props.gripperScreen?.z ?? 0),
              Number(this.props.gripperScreen?.a ?? 0),
              Number(this.props.gripperScreen?.b ?? 0),
              Number(this.props.gripperScreen?.c ?? 0)
            ],
            type: EulerType.ZYZ
          },
          EulerType.ZYX
        );

        await this.robotParameterManager?.tcp.add({
          symbol: value,
          tcp: {
            targetPose: targetPose.pose
          }
        });
        await this.robotParameterManager?.tcp.select(value);
        this.setState({
          gripperType: value,
          isChangePostion: false,
          isSelectOtherProject: false
        });
        this.props.setGripperType({
          payload: {
            gripperType: value
          }
        });
        this.props.setGripperInformation({
          payload: {
            showTCP: true
          }
        });
      } else {
        this.props.setGripperInformation({
          payload: {
            showTCP: false
          }
        });
      }
    } catch (error) {
      logger.error(error);
    }
  };

  CheckTCPComponent(): React.ReactNode {
    return (
      <div className={LeftMenuStyles['check-tcp']}>
        <ErrorIcon color={'warning'} className={LeftMenuStyles['err-icon']} />
        <Typography>{this.props.t('check-tcp')}</Typography>
      </div>
    );
  }

  /* istanbul ignore next */
  // handleOpenMenu = (event: any) => {
  //   if (!SELECT_ID || !document) {
  //     return;
  //   }
  //   const html = document.documentElement;
  //   const clientY = event.clientY;
  //   const footerHeight = 48;
  //   const bonusPoint = 20;
  //   const offsetsOfSelectId: any = document.getElementById(`${SELECT_ID}`);
  //   if (offsetsOfSelectId) {
  //     const positionOfSelectId = offsetsOfSelectId.getBoundingClientRect();
  //     setTimeout(() => {
  //       const paperDoc = document.getElementsByClassName('MuiMenu-paper') as HTMLCollectionOf<HTMLElement>;
  //       if (paperDoc && paperDoc[0]) {
  //         let cusTop = 0;
  //         const offsetHeight = paperDoc[0].offsetHeight;
  //         const overHeight = clientY + offsetHeight + footerHeight + bonusPoint - html.clientHeight;
  //         if (overHeight > 0) {
  //           cusTop = positionOfSelectId.top - offsetHeight - 2;
  //           paperDoc[0].style.top = `${cusTop}px`;
  //         }
  //       }
  //     }, 20);
  //   }
  // };

  render() {
    const _fTargetPosError = {
      errorX: this.props.gripperScreen?.errorX,
      errorY: this.props.gripperScreen?.errorY,
      errorZ: this.props.gripperScreen?.errorZ,
      errorA: this.props.gripperScreen?.errorA,
      errorB: this.props.gripperScreen?.errorB,
      errorC: this.props.gripperScreen?.errorC
    };
    const isErrorTCP = Object.values(_fTargetPosError).some((item) => item !== '');
    const { isChangePostion, isSelectOtherProject } = this.state;
    const { t } = this.props;
    return (
      <>
        <Grid item={true} className={LeftMenuStyles['left-menu']} md={4} lg={3.5}>
          <Grid container item xs={12} md={12} lg={12} className={LeftMenuStyles['current-file-name-region']}>
            <Grid container item xs={10} md={10} lg={10} paddingRight="0.5em">
              <Grid container item xs={12} className={LeftMenuStyles['file-container']}>
                <img src={THUMBNAIL_FILE} alt="file" className={LeftMenuStyles['image-file']} />
                <Typography className={LeftMenuStyles['project-name']}>
                  {this.props.projectName.replace(/ /g, '\u00a0')}
                </Typography>
              </Grid>
            </Grid>
            <Grid xs={2} md={2} lg={2} item container className={LeftMenuStyles['container-more-option']}>
              <Button
                className={LeftMenuStyles['button-more-option']}
                aria-controls={this.state.anchorEl !== null ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={this.state.anchorEl !== null}
                onClick={(e: any) => this.handleOpenMoreOptions(e)}
                disabled={this.props.running}
              >
                ...
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={this.state.anchorEl}
                open={this.state.anchorEl !== null}
                onClose={() => this.handleCloseMoreOptions()}
                MenuListProps={{
                  'aria-labelledby': 'basic-button'
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <MenuItem onClick={() => this.openSaveConfirmDialog()}>{t('save')}</MenuItem>
                <MenuItem onClick={() => this.handleProcessBtn()}>{t('save-as')}</MenuItem>
                <MenuItem onClick={() => this.handleOnClickGoToMain()}>{t('go-to-main')}</MenuItem>
              </Menu>
            </Grid>
          </Grid>
          {/* TuPT5 end show current file name */}
          <ButtonGroup aria-label="outlined button group" className={LeftMenuStyles['setting-buttons']}>
            <Button
              className={`${LeftMenuStyles['process-button']} ${LeftMenuStyles['setting-button']} ${
                this.props.settingStep === 1 ? LeftMenuStyles['selected'] : ''
              }`}
              onClick={() => this.props.onSelectSetting(1)}
            >
              {t('process')}
            </Button>
            <Button
              className={`${LeftMenuStyles['device-button']} ${LeftMenuStyles['setting-button']} ${
                this.props.settingStep === 2 ? LeftMenuStyles['selected'] : ''
              }`}
              onClick={() => this.props.onSelectSetting(2)}
            >
              {t('device')}
            </Button>
          </ButtonGroup>
          {this.props.settingStep === NUMBER_SELECT_PROCESS.ONE ? (
            <ButtonGroup
              orientation="vertical"
              aria-label="vertical outlined button group"
              className={LeftMenuStyles['step-buttons']}
            >
              {LEFT_MENU.map((item: Record<string, string | number>, index: number) => {
                if (item.type === 'process') {
                  return (
                    <NavLink
                      key={index}
                      processStep={this.props.processStep}
                      value={item.value}
                      onClick={this.props.onSelectProcess}
                      title={t(`${item.title}`)}
                    />
                  );
                }
                return <></>;
              })}
            </ButtonGroup>
          ) : (
            <ButtonGroup
              orientation="vertical"
              aria-label="vertical outlined button group"
              className={LeftMenuStyles['step-buttons']}
            >
              {LEFT_MENU.map((item: Record<string, string | number>, index: number) => {
                if (item.type === 'device') {
                  return (
                    <NavLink
                      key={index}
                      processStep={this.props.deviceStep}
                      value={item.value}
                      onClick={this.props.onSelectDevice}
                      title={t(`${item.title}`)}
                    />
                  );
                }
                return <></>;
              })}
            </ButtonGroup>
          )}
          <div className={LeftMenuStyles['lm-wrapper-bottom']}>
            <div className={LeftMenuStyles['lm-wrapper-bottom-header']}>{t('device-short-cut')}</div>

            <div className={LeftMenuStyles['lm-wrapper-bottom-body']}>
              <div className={LeftMenuStyles['lm-wrapper-bottom-body-label']}>
                <Typography noWrap>{t('current-tcp')}</Typography>
              </div>
              <div className={LeftMenuStyles['lm-wrapper-bottom-body-content']}>
                <Select
                  className={LeftMenuStyles['gripper-select']}
                  disabled={this.props.running}
                  fullWidth={true}
                  onChange={this.handleChangeTCP}
                  value={!isChangePostion || isSelectOtherProject ? this.state.gripperType : ''}
                  displayEmpty
                  renderValue={
                    !!this.state.gripperType && (isSelectOtherProject || !isChangePostion)
                      ? undefined
                      : () => this.CheckTCPComponent()
                  }
                  id={SELECT_ID}
                  MenuProps={{
                    className: 'tcp-select'
                  }}
                  onOpen={(e) => handleOpenMenu(e, SELECT_ID)}
                >
                  <MenuItem disabled={isErrorTCP} value={'pallet-Gripper1'}>
                    {t('gripper-1')}
                  </MenuItem>
                </Select>
              </div>
            </div>
          </div>
        </Grid>
        {/* save  */}
        <DialogCommon
          openDialog={this.state.openConfirmDialog}
          handleCloseDialog={this.handleCloseConfirm}
          type="confirm"
          content="save"
          messageContent={t('SAVE_CONF')}
          loading={this.state.loadingDialog}
          handleConfirm={this.onSaveProject}
        />
        {/* save as */}
        <DialogCommon
          openDialog={this.state.openSaveAsDialog}
          handleCloseDialog={this.handleCloseSaveAsDialog}
          handleConfirm={this.handleSaveAs}
          type="saveas"
          content="saveas"
          new_project_name={this.state.new_project_name}
          project_name_err={this.state.project_name_err}
          handleInputProject={this.validationFileName}
          handleOnChange={this.handleOnChangeSaveAs}
          loading={this.state.loadingDialog}
        />

        {/* go to main */}
        <DialogCommon
          openDialog={this.state.openGoToMainDialog}
          messageContent={t('WAR_001')}
          type="warning"
          content="gotomain"
          handleConfirm={this.handleSaveBeforeGoToMain}
          loading={this.state.loadingDialog}
          cancelGotomain={this.goToMain}
          handleCloseDialog={this.closeGoToMainPopup}
        />
      </>
    );
  }
}
/* istanbul ignore next */
const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setInitialData: () => {
      dispatch(setCalibInitial());
      dispatch(setCheckPickInitial());
      dispatch(setGripperInitial());
      dispatch(setInpalletInitial());
      dispatch(setOutpalletInitial());
      dispatch(setProductInitial());
    },
    setGripperType: (action: { payload: { [key: string]: string } }) => dispatch(setGripperType(action.payload)),
    setGripperInformation: (action: { payload: { [key: string]: string | boolean } }) =>
      dispatch(setGripperInformation(action.payload))
  };
};
function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    gripperScreen: state.gripper,
    gripperType: state.deviceShortCut.gripperType
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation('com.dra.palletizing')(LeftMenu));

if ('DEV_MODE' in globalThis) {
  const DUMMY_PROPS_DATA = {
    running: false,
    settingStep: 1,
    processStep: 1,
    deviceStep: 1,
    setDefaultState: () => {},
    projectId: 'project1',
    projectName: 'project',
    saveProject: async (projectId: string) => 1,
    onSelectSetting: (value: number) => void 0,
    onSelectProcess: (value: number) => void 0,
    onSelectDevice: (value: number) => void 0,
    hasChanged: () => false,
    handleSaveAsActionConfirm: (NewProjectName: string) => '',
    handleInputProject: (projectName: string) => '',
    setInitialData: () => void 0,
    gripperScreen: {},
    setGripperType: (action: {
      payload: {
        [key: string]: string;
      };
    }) => void 0,
    setGripperInformation: (action: {
      payload: {
        [key: string]: string | boolean;
      };
    }) => void 0,
    gripperType: '',
    setDataChanged: (changed: boolean) => void 0,
    saveProjectBeforeGotomain: (projectId: string) => 1,
    projectList: [],
    deleteProject: (projectId: string | string[]) => void 0
  };
}
