/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormHelperText,
  FormLabel,
  Grid,
  TextField,
  Typography
} from '@mui/material';
import React, { Component } from 'react';
import { TFunction, withTranslation } from 'react-i18next';
import PalletStyles from './assets/styles/style.scss';
import DialogCommonStyles from './assets/styles/dialogCommon.scss';
type DialogProps = {
  openDialog: boolean;
  handleCloseDialog: () => void;
  handleConfirm: () => void;
  loading?: boolean;
  messageContent?: string;
  type?: 'warning' | 'error' | 'confirm' | 'saveas' | 'info' | 'getposition';
  content?: 'save' | 'saveas' | 'appmain' | 'gotomain' | 'getposition';
  handleInputProject?: () => void;
  new_project_name?: string;
  project_name_err?: string;
  handleOnChange?: (value: string) => void;
  cancelGotomain?: () => void;
  t: TFunction;
};
type DialogState = {
  project_name_err: string;
  new_project_name: string;
};
class DialogCommon extends Component<DialogProps, DialogState> {
  constructor(props: DialogProps) {
    super(props);
  }
  render() {
    const { t } = this.props;
    return (
      <>
        {this.props.openDialog && (
          <div id="dialog-container" data-gjs-type="dialog-container" className="gjs-dialog-container">
            <Dialog open={this.props.openDialog} className={DialogCommonStyles['common-dialog']} id={'dialog-common'}>
              <DialogContent className={DialogCommonStyles['dialog-content-container-block']}>
                <DialogContentText className={DialogCommonStyles['dialog-content-container']}>
                  <Grid className={DialogCommonStyles['dialog-content-title']}>
                    {this.props.type === 'info' && (
                      <>
                        <InfoIcon color="primary" className={DialogCommonStyles['alert-icon']}></InfoIcon>
                        <Typography className={DialogCommonStyles['label']}>{t('information')}</Typography>
                      </>
                    )}
                    {this.props.type === 'confirm' && (
                      <>
                        <InfoIcon color="primary" className={DialogCommonStyles['alert-icon']}></InfoIcon>
                        <Typography className={DialogCommonStyles['label']}>{t('confirmation')}</Typography>
                      </>
                    )}
                    {this.props.type === 'warning' && (
                      <>
                        <ErrorIcon color="warning" className={DialogCommonStyles['alert-icon']}></ErrorIcon>
                        <Typography className={DialogCommonStyles['label']}>{t('warning')}</Typography>
                      </>
                    )}
                    {this.props.type === 'getposition' && (
                      <>
                        <ErrorIcon color="warning" className={DialogCommonStyles['alert-icon']}></ErrorIcon>
                        <Typography className={DialogCommonStyles['label']}>{t('check-current-tcp')}</Typography>
                      </>
                    )}
                    {this.props.type === 'saveas' && (
                      <>
                        <MoreHorizIcon
                          className={`${DialogCommonStyles['alert-icon']} ${PalletStyles['save-icon']}`}
                        ></MoreHorizIcon>
                        <Typography className={DialogCommonStyles['label']}>{t('save-as')}</Typography>
                      </>
                    )}
                    <Button
                      className={DialogCommonStyles['icon-container']}
                      onClick={() => this.props.handleCloseDialog()}
                      disabled={this.props.loading}
                    >
                      <CloseIcon className={DialogCommonStyles['cancel-icon']}></CloseIcon>
                    </Button>
                  </Grid>
                  <Grid className={DialogCommonStyles['dialog-content']}>
                    {this.props.content === 'appmain' && (
                      <Typography className={PalletStyles['title']}>{this.props.messageContent}</Typography>
                    )}
                    {this.props.content === 'save' && (
                      <Typography className={PalletStyles['title']}>{this.props.messageContent}</Typography>
                    )}
                    {this.props.content === 'gotomain' && (
                      <Typography className={PalletStyles['title']}>{this.props.messageContent}</Typography>
                    )}
                    {this.props.content === 'getposition' && (
                      <Typography className={PalletStyles['title']}>{this.props.messageContent}</Typography>
                    )}
                    {this.props.content === 'saveas' && (
                      <>
                        <FormLabel htmlFor="filename" className={DialogCommonStyles['label-save-as']}>
                          {t('project-name')}
                        </FormLabel>
                        <TextField
                          inputProps={{
                            maxLength: 30
                          }}
                          onBlur={this.props.handleInputProject}
                          error={!!this.props?.project_name_err}
                          className={DialogCommonStyles['input-filename-save-as']}
                          id="filename"
                          placeholder={t('enter-project-name')}
                          value={this.props?.new_project_name}
                          onChange={(e) => this.props.handleOnChange?.(e.target.value)}
                        />
                        <FormHelperText className={PalletStyles['error-common']}>
                          {this.props.project_name_err}
                        </FormHelperText>
                      </>
                    )}
                  </Grid>
                </DialogContentText>
              </DialogContent>
              <DialogActions className={DialogCommonStyles['dialog-actions-container']}>
                {this.props.content === 'gotomain' && (
                  <>
                    <Button
                      onClick={this.props.cancelGotomain}
                      variant="outlined"
                      disabled={this.props.loading}
                      className={PalletStyles['button--cancel__custom']}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      className={PalletStyles['button--confirm']}
                      variant="contained"
                      autoFocus
                      disabled={this.props.loading}
                      onClick={() => this.props.handleConfirm()}
                    >
                      {t('confirm')}
                    </Button>
                  </>
                )}
                {this.props.content === 'getposition' && (
                  <Button
                    variant="contained"
                    className={PalletStyles['button--confirm']}
                    onClick={this.props.handleConfirm}
                  >
                    {t('ok')}
                  </Button>
                )}
                {this.props.content === 'save' && (
                  <>
                    <Button
                      onClick={this.props.handleCloseDialog}
                      autoFocus
                      variant="outlined"
                      disabled={this.props.loading}
                      className={PalletStyles['button--cancel__custom']}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="contained"
                      className={PalletStyles['button--confirm']}
                      onClick={() => this.props.handleConfirm()}
                      disabled={this.props.loading}
                    >
                      {t('confirm')}
                    </Button>
                  </>
                )}
                {this.props.content === 'appmain' && (
                  <>
                    <Button
                      onClick={() => this.props.handleCloseDialog()}
                      autoFocus
                      variant="outlined"
                      disabled={this.props.loading}
                      className={PalletStyles['button--cancel__custom']}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="contained"
                      className={PalletStyles['button--confirm']}
                      onClick={() => this.props.handleConfirm()}
                      disabled={this.props.loading}
                    >
                      {t('confirm')}
                    </Button>
                  </>
                )}
                {this.props.content === 'saveas' && (
                  <>
                    <Button
                      onClick={this.props.handleCloseDialog}
                      autoFocus
                      variant="outlined"
                      disabled={this.props.loading}
                      className={PalletStyles['button--cancel__custom']}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="contained"
                      className={PalletStyles['button--confirm']}
                      onClick={() => this.props.handleConfirm()}
                      disabled={this.props.loading}
                    >
                      {t('confirm')}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Dialog>
          </div>
        )}
      </>
    );
  }
}
export default withTranslation('com.dra.palletizing')(DialogCommon);
