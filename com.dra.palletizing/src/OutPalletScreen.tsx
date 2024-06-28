/* eslint-disable @typescript-eslint/no-unused-vars */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import {
  Container,
  Divider,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  Radio,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { Context, IDartDatabase } from 'dart-api';
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import SelectPallet from './components/SelectPallet';
import { NUMBER_OF_DECIMAL, TABLE_OUT_PALLET } from './consts';
import { ModuleContext } from './ModuleContext';
import { setInputOutPallet } from './redux/OutPalletSlice';
import { OnlyRunMapStateToProps, OutPalletInformation } from './type';
import {
  checkNumber,
  deepCompareEqual,
  getDiffKey,
  isArrayIntersect,
  validateNumberInput
} from './util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import PALLET_DIMENTIONS from './assets/images/pallet_dimensions.png';
import { TFunction, withTranslation } from 'react-i18next';
import PalletStyles from './assets/styles/style.scss';
import FeederScreenStyles from './assets/styles/feederScreen.scss';

declare const window: any;

interface OutPalletScreenProps {
  hidden: boolean;
  projectId: string;
  setCalibSettingChanged: (changed: boolean) => void;
  setInputOutPallet: (action: { payload: { [key: string]: string | boolean } }) => void;
  running: boolean;
  outPalletScreen: OutPalletInformation;
  setDataChanged?: (changed: boolean) => void;
  t: TFunction;
}

interface OutPalletScreenState {
  loaded: boolean;
  changed: boolean;
}

const PALLET_MIN = 1;
const PALLET_MAX = 1300;
const OVERHANG_MIN = 0;
const OVERHANG_MAX = 300;
const UNDERHANG_MIN = 0;
const UNDERHANG_MAX = 300;
const MAX_LAYER_MIN = 1;
const MAX_LAYER_MAX = 100;
const BOX_PADDING_MIN = 0;
const BOX_PADDING_MAX = 500;

class OutPalletScreen extends React.Component<OutPalletScreenProps, OutPalletScreenState> {
  private db: IDartDatabase;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: OutPalletScreenProps) {
    super(props);
    this.state = {
      loaded: false,
      changed: false
    };
    window.saveOutPallet = this.saveOutPallet.bind(this);
  }

  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadOutPallet().finally(() => this.setState({ loaded: true }));
  }

  shouldComponentUpdate(nextProps: OutPalletScreenProps) {
    /* istanbul ignore next */
    if (!nextProps.hidden) {
      return true;
    } else {
      /* istanbul ignore next */
      if (!this.props.hidden) {
        return true;
      } else {
        return false;
      }
    }
  }

  loadOutPallet = async () => {
    /* istanbul ignore next */
    const queryResult = await this.db?.query(TABLE_OUT_PALLET.name, TABLE_OUT_PALLET.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const data = {
        selectedPallet: queryResult[0].data['selectedPallet'],
        length: queryResult[0].data['length'],
        width: queryResult[0].data['width'],
        useOverhangUnderhang: queryResult[0].data['useOverhangUnderhang'],
        isOverhang: queryResult[0].data['isOverhang'],
        overhang: queryResult[0].data['overhang'],
        underhang: queryResult[0].data['underhang'],
        boxPadding: queryResult[0].data['boxPadding'],
        maxLayer: queryResult[0].data['maxLayer'],
        lengthError: queryResult[0].data['lengthError'],
        widthError: queryResult[0].data['widthError'],
        overhangError: queryResult[0].data['overhangError'],
        underhangError: queryResult[0].data['underhangError'],
        boxPaddingError: queryResult[0].data['boxPaddingError'],
        maxLayerError: queryResult[0].data['maxLayerError']
      };
      this.props.setInputOutPallet({ payload: data } as unknown as {
        payload: { [key: string]: string };
      });
    }
  };

  saveOutPallet = async (projectId: string) => {
    const { outPalletScreen } = this.props;
    /* istanbul ignore next */
    await this.db
      ?.update(
        TABLE_OUT_PALLET.name,
        { projectId: projectId },
        {
          projectId: projectId,
          selectedPallet: outPalletScreen.selectedPallet,
          length: outPalletScreen.length,
          width: outPalletScreen.width,
          useOverhangUnderhang: outPalletScreen.useOverhangUnderhang,
          isOverhang: outPalletScreen.isOverhang,
          overhang: outPalletScreen.overhang,
          underhang: outPalletScreen.underhang,
          boxPadding: outPalletScreen.boxPadding,
          maxLayer: outPalletScreen.maxLayer,
          lengthError: outPalletScreen.lengthError,
          widthError: outPalletScreen.widthError,
          overhangError: outPalletScreen.overhangError,
          underhangError: outPalletScreen.underhangError,
          boxPaddingError: outPalletScreen.boxPaddingError,
          maxLayerError: outPalletScreen.maxLayerError
        }
      )
      .then(async (countRowUpdate) => {
        if (countRowUpdate === 0) {
          await this.db
            ?.delete(TABLE_OUT_PALLET.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_OUT_PALLET.name, [
                projectId,
                outPalletScreen.selectedPallet,
                outPalletScreen.length,
                outPalletScreen.width,
                outPalletScreen.useOverhangUnderhang,
                outPalletScreen.isOverhang,
                outPalletScreen.overhang,
                outPalletScreen.underhang,
                outPalletScreen.boxPadding,
                outPalletScreen.maxLayer,
                outPalletScreen.lengthError,
                outPalletScreen.widthError,
                outPalletScreen.overhangError,
                outPalletScreen.underhangError,
                outPalletScreen.boxPaddingError,
                outPalletScreen.maxLayerError
              ]);
            });
        }
      });
  };

  componentDidUpdate(prevProps: OutPalletScreenProps, prevState: OutPalletScreenState) {
    const { ...previousProps } = prevProps.outPalletScreen;
    const { ...currentProps } = this.props.outPalletScreen;
    /* istanbul ignore next */
    if (!deepCompareEqual(prevProps.outPalletScreen, this.props.outPalletScreen)) {
      this.props.setDataChanged?.(true);
    }
    /* istanbul ignore next */
    if (prevState.loaded && !this.state.changed && JSON.stringify(previousProps) !== JSON.stringify(currentProps)) {
      this.setState({ changed: true });
    }

    const fieldTocheck = [
      'length',
      'width',
      'useOverhangUnderhang',
      'isOverhang',
      'overhang',
      'underhang',
      'maxLayer',
      'boxPadding'
    ];
    if (isArrayIntersect(fieldTocheck, getDiffKey({ ...currentProps }, { ...previousProps }))) {
      this.props.setCalibSettingChanged(true);
    }
  }

  haschanged = (): boolean => {
    return this.state.changed;
  };
  saved = () => {
    this.setState({ changed: false });
  };

  checkInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: 'length' | 'width' | 'overhang' | 'underhang' | 'boxPadding' | 'maxLayer',
    isCheckFloat = true,
    acceptNegative = false
  ) => {
    this.setState({ changed: true });
    const { value, selectionStart, selectionEnd } = event.target;
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }
    if (checkNumber(event.target.value, isCheckFloat, acceptNegative)) {
      this.props.setInputOutPallet({
        payload: {
          [fieldName]: value
        }
      });
    } else {
      event.target.selectionStart = selectionStart - 1;
      event.target.selectionEnd = selectionEnd - 1;
    }
  };
  controlSelectValueOutFeeder = (e: SelectChangeEvent<string>) => {
    this.setState({ changed: true });
    if (e.target.value !== 'CustomSize') {
      const length = e.target.value.slice(0, e.target.value.indexOf('-'));
      const width = e.target.value.slice(e.target.value.indexOf('-') + 1, e.target.value.length);
      this.props.setInputOutPallet({
        payload: {
          lengthError: '',
          widthError: '',
          length: length,
          width: width,
          selectedPallet: e.target.value
        }
      });
    } else {
      this.props.setInputOutPallet({
        payload: {
          lengthError: '',
          widthError: '',
          length: '',
          width: '',
          selectedPallet: 'CustomSize'
        }
      });
    }
  };
  validateLength = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    this.setState({ changed: true });
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      PALLET_MIN,
      PALLET_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInputOutPallet({
          payload: {
            length: formatedValue,
            lengthError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_008');

        this.props.setInputOutPallet({
          payload: {
            lengthError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateWidth = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    this.setState({ changed: true });
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      PALLET_MIN,
      PALLET_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInputOutPallet({
          payload: {
            width: formatedValue,
            widthError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_008');
        this.props.setInputOutPallet({
          payload: {
            widthError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };

  toggleOverhangUnderhang = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    this.props.setInputOutPallet({
      payload: {
        useOverhangUnderhang: checked
      }
    });
  };
  changeOverhangUnderhang = (isOverhang: boolean) => {
    this.props.setInputOutPallet({
      payload: {
        isOverhang: isOverhang
      }
    });
  };
  validateOverhang = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      OVERHANG_MIN,
      OVERHANG_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        if (event !== null) {
          event.target.value = formatedValue;
        }
        this.props.setInputOutPallet({
          payload: {
            overhang: formatedValue,
            overhangError: ''
          }
        });
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_009');
        this.props.setInputOutPallet({
          payload: {
            overhangError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateUnderhang = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      UNDERHANG_MIN,
      UNDERHANG_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInputOutPallet({
          payload: {
            underhang: formatedValue,
            underhangError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_009');
        this.props.setInputOutPallet({
          payload: {
            underhangError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateBoxPadding = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      BOX_PADDING_MIN,
      BOX_PADDING_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInputOutPallet({
          payload: {
            boxPadding: formatedValue,
            boxPaddingError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_010');
        this.props.setInputOutPallet({
          payload: {
            boxPaddingError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateMaxLayer = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      MAX_LAYER_MIN,
      MAX_LAYER_MAX,
      0,
      (formatedValue) => {
        this.props.setInputOutPallet({
          payload: {
            maxLayer: formatedValue,
            maxLayerError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_011');
        this.props.setInputOutPallet({
          payload: {
            maxLayerError: error
          }
        });
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  render() {
    const { outPalletScreen, t } = this.props;
    const showOverhangError =
      outPalletScreen.useOverhangUnderhang && outPalletScreen.isOverhang && outPalletScreen.overhangError.length > 0;
    const overhangError = showOverhangError ? outPalletScreen.overhangError : '';
    const showUnderhangError =
      outPalletScreen.useOverhangUnderhang && !outPalletScreen.isOverhang && outPalletScreen.underhangError.length > 0;
    const underhangError = showUnderhangError ? outPalletScreen.underhangError : '';
    return (
      <>
        <Grid
          item={true}
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${FeederScreenStyles['out-feeder-screen']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false} className={FeederScreenStyles['out-feeder-container']}>
            <Typography className={FeederScreenStyles['title']} variant="h6">
              {t('out-feeder-pallet-dimensions')}
            </Typography>
            <Grid item={true} container xs>
              <Grid xs={6} md={6} lg={7} paddingRight="1em" item>
                <SelectPallet
                  defaultValue={outPalletScreen.selectedPallet}
                  value={outPalletScreen.selectedPallet}
                  controlSelectValue={this.controlSelectValueOutFeeder}
                  running={this.props.running}
                  palletLength={outPalletScreen.length}
                  checkInputLength={(e) => this.checkInput(e, 'length')}
                  checkInputWidth={(e) => this.checkInput(e, 'width')}
                  validateLength={(e) => this.validateLength(e)}
                  validateWidth={(e) => this.validateWidth(e)}
                  isLengthError={outPalletScreen.lengthError?.length > 0 ? true : false}
                  lengthError={outPalletScreen.lengthError}
                  selectedPallet={outPalletScreen.selectedPallet}
                  palletWidth={outPalletScreen.width}
                  isWidthError={outPalletScreen.widthError?.length > 0 ? true : false}
                  widthError={outPalletScreen.widthError}
                ></SelectPallet>
              </Grid>
              <Grid className={PalletStyles['guided-image']} item xs={6} md={6} lg={5}>
                <img src={PALLET_DIMENTIONS} alt="pallet dimensions" width="100%" />
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Typography variant="h6" className={PalletStyles['title']}>
              {t('pallet-overhang-underhang')}
            </Typography>
            <Grid item container xs className={FeederScreenStyles['overhang-container']}>
              <Grid xs={12} md={12} lg={4} item className={FeederScreenStyles['inline-grid']}>
                <Switch
                  className={PalletStyles['custom-switch']}
                  checked={outPalletScreen.useOverhangUnderhang}
                  onChange={this.toggleOverhangUnderhang}
                  disabled={this.props.running}
                />
                <Typography variant="body1" className={PalletStyles['text-for-switch']}>
                  {t('use-overhang-underhang')}
                </Typography>
              </Grid>
              <Grid item xs={12} className={FeederScreenStyles['over-under-hang']}>
                <Grid xs={12} md={6} lg={4} item className={FeederScreenStyles['overhang']} paddingRight="1em">
                  <FormControlLabel
                    value="start"
                    control={<Radio />}
                    checked={outPalletScreen.isOverhang}
                    disabled={!outPalletScreen.useOverhangUnderhang}
                    onChange={() => this.changeOverhangUnderhang(true)}
                    label={t('overhang')}
                    className={FeederScreenStyles['label']}
                  />
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    className={PalletStyles['form-label-textfield']}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    disabled={
                      !outPalletScreen.useOverhangUnderhang || !outPalletScreen.isOverhang || this.props.running
                    }
                    onChange={(e) => this.checkInput(e, 'overhang')}
                    value={outPalletScreen.overhang}
                    onBlur={(e) => this.validateOverhang(e)}
                    error={showOverhangError}
                  />
                </Grid>
                <Grid xs={12} md={6} lg={4} item className={FeederScreenStyles['overhang']}>
                  <FormControlLabel
                    value="start"
                    control={<Radio />}
                    checked={!outPalletScreen.isOverhang}
                    disabled={!outPalletScreen.useOverhangUnderhang || this.props.running}
                    onChange={() => this.changeOverhangUnderhang(false)}
                    label={t('underhang')}
                    className={FeederScreenStyles['label']}
                  />
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    className={PalletStyles['form-label-textfield']}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                    disabled={
                      !!(!outPalletScreen.useOverhangUnderhang || outPalletScreen.isOverhang || this.props.running)
                    }
                    onChange={(e) => this.checkInput(e, 'underhang')}
                    value={outPalletScreen.underhang}
                    onBlur={(e) => this.validateUnderhang(e)}
                    error={!!showUnderhangError}
                  />
                </Grid>
              </Grid>
              <Grid xs={12} md={12} lg={12} item>
                <FormHelperText className={PalletStyles['error-common']}>{overhangError}</FormHelperText>
              </Grid>
              <Grid xs={12} md={12} lg={12} item>
                <FormHelperText className={PalletStyles['error-common']}>{underhangError}</FormHelperText>
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Typography variant="h6" className={PalletStyles['title-margin-xs']}>
              {t('box-padding')}
            </Typography>
            <Grid item container xs className={FeederScreenStyles['box-padding-container']}>
              <Grid xs={12}>
                <FormLabel htmlFor="box-padding" className={PalletStyles['form-label-item']}>
                  {t('min-space-prd')}
                </FormLabel>
              </Grid>
              <Grid xs={5} md={4} lg={3}>
                <TextField
                  type="tel"
                  inputProps={{ maxLength: 11 }}
                  id="box-padding"
                  onChange={(e) => this.checkInput(e, 'boxPadding')}
                  value={outPalletScreen.boxPadding}
                  className={PalletStyles['form-label-textfield']}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                  onBlur={(e) => this.validateBoxPadding(e)}
                  error={outPalletScreen.boxPaddingError?.length > 0}
                  disabled={this.props.running}
                />
              </Grid>
              <Grid xs={12}>
                <FormHelperText className={PalletStyles['error-common']}>
                  {outPalletScreen.boxPaddingError}
                </FormHelperText>
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Typography variant="h6" className={PalletStyles['title-margin-xs']}>
              {t('max-layer')}
            </Typography>
            <Grid item container xs className={FeederScreenStyles['box-padding-container']}>
              <Grid xs={5} md={4} lg={3}>
                <TextField
                  type="tel"
                  inputProps={{ maxLength: 11 }}
                  id="max-layer"
                  onChange={(e) => this.checkInput(e, 'maxLayer', false)}
                  value={outPalletScreen.maxLayer}
                  className={PalletStyles['form-label-textfield-no-unit']}
                  onBlur={(e) => this.validateMaxLayer(e)}
                  error={outPalletScreen.maxLayerError?.length > 0}
                  disabled={this.props.running}
                />
              </Grid>
              <Grid xs={12}>
                <FormHelperText
                  className={`${PalletStyles['error-common']} ${PalletStyles['error-common--last-item']}`}
                >
                  {outPalletScreen.maxLayerError}
                </FormHelperText>
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
    setInputOutPallet: (action: { payload: { [key: string]: string | boolean } }) =>
      dispatch(setInputOutPallet(action.payload))
  };
}

function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    outPalletScreen: state.outPallet
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true
})(withTranslation('com.dra.palletizing', { withRef: true })(OutPalletScreen));
