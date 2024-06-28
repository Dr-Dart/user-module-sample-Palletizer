/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Grid } from '@mui/material';
import { logger } from 'dart-api';
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import PalletStyles from './assets/styles/style.scss';
import ProjectList from './components/ProjectList';
import DialogCommon from './DialogCommon';
import { setCalibInitial } from './redux/CalibrationSlice';
import { setCheckPickInitial } from './redux/CheckPickPlaceSlice';
import { setGripperInitial } from './redux/GripperSlice';
import { setInpalletInitial } from './redux/InpalletSlice';
import { setOutpalletInitial } from './redux/OutPalletSlice';
import { setProductInitial } from './redux/ProductSlice';
import { ProjectInformation } from './type';
import CreateProject from './components/CreateProject/CreateProject';
import { setGripperType } from './redux/DeviceShortcutSlice';
import { TFunction, withTranslation } from 'react-i18next';

interface AppMainProps {
  onCreateProject: (projectName: string) => void;
  projectList: ProjectInformation[];
  checkProjectNameExistence: (projectName: string) => Promise<boolean>;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string | string[]) => Promise<void>;
  onLoadProject: () => Promise<void>;
  dbInitialized: boolean;
  setInitialData: () => void;
  setGripperType: (action: { payload: { [key: string]: string } }) => void;
  t: TFunction;
}
interface AppMainState {
  openDialog: boolean;
  selected: string[];
  page: number;
  rowsPerPage: number;
  project_name: string;
  project_name_err: string;
  loading: boolean;
  confirmMessage: string;
  deleting: boolean;
  clickedCreate: boolean;
}

// declare const window: any;
class AppMain extends React.Component<AppMainProps, AppMainState> {
  constructor(props: AppMainProps) {
    super(props);
    this.handleSelectAllClick = this.handleSelectAllClick.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.handleDeleteProject = this.handleDeleteProject.bind(this);
    this.handleSortDate = this.handleSortDate.bind(this);
    this.confirmDeleteProject = this.confirmDeleteProject.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleInputProject = this.handleInputProject.bind(this);
    this.handleOpenProject = this.handleOpenProject.bind(this);
    this.state = {
      openDialog: false,
      selected: [],
      page: 0,
      rowsPerPage: 10,
      project_name: '',
      project_name_err: '',
      loading: false,
      confirmMessage: '',
      deleting: false,
      clickedCreate: false
    };
  }

  handleSelectAllClick(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      const newSelecteds = this.props.projectList.map((item: ProjectInformation) => item.projectId);
      this.setState({ selected: newSelecteds, confirmMessage: this.props.t('CON_004') });
      return;
    }
    this.setState({ selected: [] });
  }

  handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    this.setState({ rowsPerPage: parseInt(event.target.value, 10) });
    this.setState({ page: 0 });
  }

  onPageChange(event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) {
    this.setState({ page: newPage });
  }

  handleClick(event: React.MouseEvent<unknown>, id: string) {
    const selectedIndex = this.state.selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex < 0) {
      newSelected = newSelected.concat(this.state.selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(this.state.selected.slice(1));
    } else if (selectedIndex === this.state.selected.length - 1) {
      newSelected = newSelected.concat(this.state.selected.slice(0, -1));
    } else {
      newSelected = newSelected.concat(
        this.state.selected.slice(0, selectedIndex),
        this.state.selected.slice(selectedIndex + 1)
      );
    }
    this.setState({ selected: newSelected });
    if (newSelected.length === 1) {
      this.setState({ confirmMessage: this.props.t('CON_002') });
    } else if (newSelected.length === this.props.projectList.length) {
      this.setState({ confirmMessage: this.props.t('CON_004') });
    } else {
      this.setState({ confirmMessage: this.props.t('CON_003') });
    }
  }

  isSelected(id: string) {
    return this.state.selected.indexOf(id) !== -1;
  }

  handleDeleteProject() {
    this.setState({ deleting: true });
    this.props
      .onDeleteProject(this.state.selected)
      .then(() => {
        this.props.onLoadProject().then(() => {
          this.setState({ openDialog: false, selected: [], deleting: false });
        });
      })
      .catch((error) => {
        logger.error(error);
        this.setState({ openDialog: false, deleting: true });
      });
  }

  handleSortDate(projectList: ProjectInformation[]) {
    const sortedRows = projectList?.sort((datea: ProjectInformation, dateb: ProjectInformation) => {
      const date1 = datea.updateDate.replace(' ', '.').split('.');
      const date2 = dateb.updateDate.replace(' ', '.').split('.');
      const YEAR_INDEX = 2;
      const MONTH_INDEX = 1;
      const DATE_INDEX = 0;
      const HOUR_INDEX = 3;
      const MINUTES_INDEX = 4;
      const SECONDE_INDEX = 5;
      const aDate = new Date(
        Number(date1[YEAR_INDEX]),
        Number(date1[MONTH_INDEX]),
        Number(date1[DATE_INDEX]),
        Number(date1[HOUR_INDEX]),
        Number(date1[MINUTES_INDEX]),
        Number(date1[SECONDE_INDEX])
      );
      const bDate = new Date(
        Number(date2[YEAR_INDEX]),
        Number(date2[MONTH_INDEX]),
        Number(date2[DATE_INDEX]),
        Number(date2[HOUR_INDEX]),
        Number(date2[MINUTES_INDEX]),
        Number(date2[SECONDE_INDEX])
      );
      return aDate.getTime() - bDate.getTime();
    });
    return sortedRows.reverse();
  }

  componentDidMount() {
    this.props.onLoadProject();
  }

  componentDidUpdate(prevProps: AppMainProps, prevState: AppMainState) {
    if (prevState.clickedCreate !== this.state.clickedCreate && this.state.clickedCreate && this.props.dbInitialized) {
      this.handleCreateProject();
    }
    if (this.props.projectList.length === 0) {
      this.props.setGripperType({ payload: { gripperType: '' } });
    }
  }

  confirmDeleteProject() {
    this.setState({ openDialog: true });
  }
  handleCloseDialog = () => {
    this.setState({ openDialog: false });
  };

  checkEmptyValue(event: React.FocusEvent<HTMLInputElement>) {
    if (event.target.value.trim() === '') {
      return true;
    }
    return false;
  }

  validateProjectName = (projectName: string): boolean => {
    const MAX_LENGTH_PROJECT_NAME = 30;
    const special_character = new RegExp(/[\\/:*?"<>|]/);
    return projectName !== '' && projectName.length <= MAX_LENGTH_PROJECT_NAME && !special_character.test(projectName);
  };

  handleInputProject = (event: React.FocusEvent<HTMLInputElement>) => {
    const special_character = new RegExp(/[\\/:*?"<>|]/);
    const value = event.target.value.toString().trim();

    if (this.checkEmptyValue(event)) {
      this.setState({
        project_name_err: this.props.t('ERR_004')
      });
      return;
    } else if (value.length > 30) {
      this.setState({
        project_name_err: this.props.t('ERR_002')
      });
    } else if (special_character.test(value)) {
      this.setState({
        project_name_err: this.props.t('ERR_003')
      });
    } else {
      this.setState({
        project_name_err: ''
      });
    }
  };
  handleCreateProject = () => {
    if (this.validateProjectName(this.state.project_name.trim())) {
      this.props.checkProjectNameExistence(this.state.project_name.trim()).then((existed: boolean) => {
        if (!existed) {
          if (!this.state.loading) {
            this.setState({ loading: true }, () => {
              this.props.onCreateProject(this.state.project_name.trim());
            });
          }
        } else {
          this.setState({ project_name_err: this.props.t('ERR_001') });
        }
      });
    }
    this.setState({ clickedCreate: false });
  };
  onClickCreate = () => {
    this.props.setInitialData();
    this.setState({ clickedCreate: true });
  };
  handleOpenProject = async () => {
    this.props.onOpenProject(this.state.selected[0]);
  };
  handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ project_name: event.target.value });
  };
  render() {
    const sortedList = this.handleSortDate(this.props.projectList);
    const { t } = this.props;
    return (
      <>
        <Grid item className={`${PalletStyles['container']} ${PalletStyles['app-container']}`}>
          <Grid item xs={8} md={8} lg={8} className={PalletStyles['file-list']}>
            <ProjectList
              confirmDeleteProject={this.confirmDeleteProject}
              handleChangeRowsPerPage={this.handleChangeRowsPerPage}
              handleOnPageChange={this.onPageChange}
              handleSelectAllClick={this.handleSelectAllClick}
              page={this.state.page}
              rowsPerPage={this.state.rowsPerPage}
              sortedProjectsList={sortedList}
              selected={this.state.selected}
              isLoading={this.state.loading}
              isSelected={this.isSelected}
              handleOpenProject={this.handleOpenProject}
              handleClickCheckBox={this.handleClick}
            />
          </Grid>
          <Grid item md={4} lg={3.5} className={PalletStyles['create-file']}>
            <CreateProject
              title={t('start-palletizing')}
              lable={t('project-name')}
              handlerOnBlur={this.handleInputProject}
              handlerOnChange={this.handleOnChange}
              handlerOnMouseDown={this.onClickCreate}
              hanlderOnClick={this.onClickCreate}
              projectName={this.state.project_name}
              projectNameError={this.state.project_name_err}
              disabled={
                this.state.loading ||
                !this.props.dbInitialized ||
                !this.validateProjectName(this.state.project_name.trim())
              }
            />
          </Grid>
        </Grid>
        <DialogCommon
          openDialog={this.state.openDialog}
          handleCloseDialog={this.handleCloseDialog}
          handleConfirm={this.handleDeleteProject}
          messageContent={this.state.confirmMessage}
          loading={this.state.deleting}
          type="confirm"
          content="appmain"
        />
      </>
    );
  }
}
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
    setGripperType: (action: { payload: { [key: string]: string } }) => dispatch(setGripperType(action.payload))
  };
};
export default connect(null, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing')(AppMain)
);

if ('DEV_MODE' in globalThis) {
  const DUMMY_PROPS_DATA = {
    onCreateProject: (projectName: string) => {},
    projectList: [],
    checkProjectNameExistence: (projectName: string) => false,
    onOpenProject: (projectId: string) => {},
    onDeleteProject: (projectId: string | string[]) => void 0,
    onLoadProject: () => void 0,
    dbInitialized: false,
    setInitialData: () => void 0,
    setGripperType: (action: {
      payload: {
        [key: string]: string;
      };
    }) => void 0
  };
}
