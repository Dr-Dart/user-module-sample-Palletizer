/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import {
  Button,
  Checkbox,
  createTheme,
  Grid,
  IconButton,
  TablePagination,
  Toolbar,
  Tooltip,
  Typography,
  Box
} from '@mui/material';
import React, { Component } from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import { ProjectInformation } from '../type';
import PalletStyles from '../assets/styles/style.scss';
interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}
interface ProjectListProps {
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  sortedProjectsList: ProjectInformation[];
  selected: string[];
  confirmDeleteProject: () => void;
  handleSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSelected: (id: string) => boolean;
  handleClickCheckBox: (event: React.MouseEvent<unknown>, id: string) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleOpenProject: () => void;
  handleOnPageChange: (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number) => void;
  t: TFunction;
}
class ProjectList extends Component<ProjectListProps, unknown> {
  constructor(props: ProjectListProps) {
    super(props);
  }
  TablePaginationActions(props: TablePaginationActionsProps) {
    const { count, page, rowsPerPage, onPageChange } = props;
    const theme = createTheme();
    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
      <Box flexShrink={0} ml={2.5}>
        <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label="first page">
          {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
        </IconButton>
        <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
          {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="next page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </IconButton>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="last page"
        >
          {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
        </IconButton>
      </Box>
    );
  }
  handlerConfirmDelete = () => {
    this.props.confirmDeleteProject();
  };
  handlerSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.handleSelectAllClick(event);
  };
  isSelected = (id: string) => {
    return this.props.isSelected(id);
  };
  handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    this.props.handleClickCheckBox(event, id);
  };

  onChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.props.handleChangeRowsPerPage(event);
  };
  onOpenProject = () => {
    this.props.handleOpenProject();
  };
  onPageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    this.props.handleOnPageChange(event, newPage);
  };
  render() {
    const { t } = this.props;
    return (
      <>
        <Toolbar className={PalletStyles['toolbar']}>
          <Typography
            className={PalletStyles['typo-toolbal']}
            id="tableTitle"
            component="div"
          >
            {t('saved-list')}
          </Typography>
          <Button
            disabled={this.props.selected.length < 1 || this.props.isLoading}
            variant="outlined"
            className={PalletStyles['toolbar-button']}
            onClick={this.handlerConfirmDelete}
          >
            {t('delete')}
          </Button>
        </Toolbar>
        <Grid className={PalletStyles['table']}>
          <Grid item container>
            <Grid className={PalletStyles['table-header']}>
              <Grid item>
                <Checkbox
                  className={PalletStyles['check-box']}
                  indeterminate={
                    this.props.selected.length > 0 && this.props.selected.length < this.props.sortedProjectsList.length
                  }
                  checked={
                    this.props.sortedProjectsList.length > 0 &&
                    this.props.selected.length === this.props.sortedProjectsList.length
                  }
                  onChange={this.handlerSelectAll}
                />
              </Grid>
              <Grid item md={12} lg={12} className={PalletStyles['header']}>
                <Grid item md={6} lg={6} className={PalletStyles['table-cell']}>
                  {t('project')}
                </Grid>
                <Grid item xs={6} md={6} lg={6} className={PalletStyles['table-cell']}>
                  {t('updated-date')}
                </Grid>
              </Grid>
            </Grid>
            <Grid item className={PalletStyles['table-content']}>
              {(this.props.sortedProjectsList?.length > 0
                ? this.props.sortedProjectsList.slice(
                    this.props.page * this.props.rowsPerPage,
                    this.props.page * this.props.rowsPerPage + this.props.rowsPerPage
                  )
                : this.props.sortedProjectsList
              )?.map((row: ProjectInformation, index: number) => {
                const isItemSelected = this.isSelected(row.projectId);
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <Grid item className={PalletStyles['item-table']} key={row.projectId}>
                    <Grid item>
                      <Checkbox
                        className={PalletStyles['check-box']}
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId
                        }}
                        onClick={(event: React.MouseEvent<unknown>) => this.handleClick(event, row.projectId)}
                      />
                    </Grid>
                    <Grid item className={PalletStyles['items']}>
                      <Grid
                        xs={6}
                        item
                        md={6}
                        lg={6}
                        className={`${PalletStyles['align-left-item']} ${PalletStyles['align-item']}`}
                      >
                        <Grid
                          container
                          item
                          xs={6}
                          md={12}
                          lg={12}
                          className={`${PalletStyles['align-left-item']} ${PalletStyles['align-item']}`}
                        >
                          <Tooltip placement="top" title={row.projectName.replace(/ /g, '\u00a0')}>
                            <div
                              className={`${PalletStyles['project-name-container']} ${PalletStyles['prj-name']}`}
                            >
                              {row.projectName.replace(/ /g, '\u00a0')}
                            </div>
                          </Tooltip>
                        </Grid>
                      </Grid>
                      <Grid md={6} lg={6} item className={PalletStyles['align-item']}>
                        {row.updateDate.replace(/ /g, '\u00a0')}
                      </Grid>
                    </Grid>
                  </Grid>
                );
              })}
              {this.props.sortedProjectsList.length === 0 && null}
            </Grid>
          </Grid>
        </Grid>
        <TablePagination
          className={PalletStyles["table-pagination"]}
          component="div"
          count={this.props.sortedProjectsList?.length}
          rowsPerPage={this.props.rowsPerPage}
          page={this.props.page}
          onPageChange={this.onPageChange}
          onRowsPerPageChange={this.onChangeRowsPerPage}
          ActionsComponent={this.TablePaginationActions}
        />
        <Grid className={PalletStyles["open-button"]}>
          <Button
            className={`${PalletStyles["button"]} ${PalletStyles["btn-open"]}`}
            variant="contained"
            disabled={this.props.selected.length > 1 || this.props.selected.length < 1 || this.props.isLoading}
            onClick={this.onOpenProject}
          >
            {t('open')}
          </Button>
        </Grid>
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(ProjectList);
