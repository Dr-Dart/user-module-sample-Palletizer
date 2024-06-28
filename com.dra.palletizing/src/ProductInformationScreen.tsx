/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import React from 'react';
import { Container, FormHelperText, FormLabel, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { Context, IDartDatabase } from 'dart-api';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { NUMBER_OF_DECIMAL, TABLE_PRODUCT } from './consts';
import { ModuleContext } from './ModuleContext';
import { setProductInformation } from './redux/ProductSlice';
import { OnlyRunMapStateToProps, ProductInformation } from './type';
import { checkNumber, getDiffKey, isArrayIntersect, scrollToElement, validateNumberInput } from './util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import PRODUCT_INFO from './assets/images/product_infomation.png';
import PalletStyles from './assets/styles/style.scss';

import { TFunction, withTranslation } from 'react-i18next';
export interface ProductInformationScreenProps {
  hidden: boolean;
  setCalibSettingChanged: (changed: boolean) => void;
  projectId: string;
  setProductInformation: (action: { payload: { [key: string]: string } }) => void;
  running: boolean;
  productScreen: ProductInformation;
  setDataChanged?: (changed: boolean) => void;
  t: TFunction;
}
export interface ProductInformationScreenState {
  loaded: boolean;
  changed: boolean;
}

declare const window: any;

const LENGTH_MIN = 1;
const LENGTH_MAX = 1000;
const WIDTH_MIN = 1;
const WIDTH_MAX = 1000;
const HEIGHT_MIN = 1;
const HEIGHT_MAX = 1000;
const WEIGHT_MIN = 0;
const WEIGHT_MAX = 30;

class ProductInformationScreen extends React.Component<ProductInformationScreenProps, ProductInformationScreenState> {
  private db: IDartDatabase;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: ProductInformationScreenProps) {
    super(props);
    this.state = {
      loaded: false,
      changed: false
    };
    window.saveProduct = this.saveProduct.bind(this);
  }

  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadProduct().finally(() => this.setState({ loaded: true }));
  }
  shouldComponentUpdate(nextProps: ProductInformationScreenProps) {
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

  loadProduct = async () => {
    const queryResult = await this.db?.query(TABLE_PRODUCT.name, TABLE_PRODUCT.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const data = {
        length: queryResult[0].data['length'],
        width: queryResult[0].data['width'],
        height: queryResult[0].data['height'],
        weight: queryResult[0].data['weight'],
        lengthError: queryResult[0].data['lengthError'],
        widthError: queryResult[0].data['widthError'],
        heightError: queryResult[0].data['heightError'],
        weightError: queryResult[0].data['weightError']
      };
      this.props.setProductInformation({ payload: data } as unknown as { payload: { [key: string]: string } });
    }
  };

  /* istanbul ignore next */
  saveProduct = async (projectId: string) => {
    const { productScreen } = this.props;
    return await this.db
      ?.update(
        TABLE_PRODUCT.name,
        { projectId: projectId },
        {
          projectId: projectId,
          length: productScreen.length,
          width: productScreen.width,
          height: productScreen.height,
          weight: productScreen.weight,
          lengthError: productScreen.lengthError,
          widthError: productScreen.widthError,
          heightError: productScreen.heightError,
          weightError: productScreen.weightError
        }
      )
      .then(async (updatedRowCount) => {
        if (updatedRowCount === 0) {
          await this.db
            ?.delete(TABLE_PRODUCT.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_PRODUCT.name, [
                projectId,
                productScreen.length,
                productScreen.width,
                productScreen.height,
                productScreen.weight,
                productScreen.lengthError,
                productScreen.widthError,
                productScreen.heightError,
                productScreen.weightError
              ]);
            });
        }
      });
  };
  componentDidUpdate(prevProps: ProductInformationScreenProps, prevState: ProductInformationScreenState) {
    const { loaded: prevLoaded } = prevState;
    const { changed } = this.state;
    const { ...previousProps } = prevProps.productScreen;
    const { ...currentProps } = this.props.productScreen;

    if (prevLoaded && !changed) {
      if (JSON.stringify(currentProps) !== JSON.stringify(previousProps)) {
        this.setState({ changed: true });
      }
    }
    const fieldTocheck = ['length', 'width', 'weight', 'height'];
    if (isArrayIntersect(fieldTocheck, getDiffKey({ ...previousProps }, { ...currentProps }))) {
      this.props.setDataChanged?.(true);
      this.props.setCalibSettingChanged(true);
    }
  }

  haschanged = (): boolean => this.state.changed;

  saved = () => {
    this.setState({ changed: false });
  };
  checkInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: 'length' | 'width' | 'height' | 'weight'
  ) => {
    const { value, selectionStart, selectionEnd } = event.target;
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }
    if (checkNumber(event.target.value)) {
      this.props.setProductInformation({
        payload: {
          [fieldName]: value
        }
      });
    } else {
      event.target.selectionStart = selectionStart - 1;
      event.target.selectionEnd = selectionEnd - 1;
    }
  };

  validateLength = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      LENGTH_MIN,
      LENGTH_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue: string) => {
        if (event !== null) {
          event.target.value = formatedValue;
        }
        this.props.setProductInformation({
          payload: {
            length: formatedValue,
            lengthError: ''
          }
        });
      },
      (reason: string) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_006');
        if (reason === 'EMPTY') {
          this.props.setProductInformation({
            payload: { length: '', lengthError: error }
          });
        }
        this.props.setProductInformation({
          payload: { lengthError: error }
        });
        if (event !== null) scrollToElement(event.target);
      }
    );
  };
  validateWidth = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      WIDTH_MIN,
      WIDTH_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue: string) => {
        this.props.setProductInformation({
          payload: {
            width: formatedValue,
            widthError: ''
          }
        });
        if (event !== null) event.target.value = formatedValue;
      },
      (reason: string) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_006');
        this.props.setProductInformation({
          payload: {
            widthError: error
          }
        });
        if (event !== null) {
          scrollToElement(event.target);
        }
      }
    );
  };

  validateHeight(event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      HEIGHT_MIN,
      HEIGHT_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue: string) => {
        if (event !== null) {
          event.target.value = formatedValue;
        }
        this.props.setProductInformation({
          payload: {
            height: formatedValue,
            heightError: ''
          }
        });
      },
      (reason: string) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_006');
        this.props.setProductInformation({
          payload: {
            heightError: error
          }
        });
        if (event !== null) {
          scrollToElement(event.target);
        }
      }
    );
  }
  validateWeight(event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      WEIGHT_MIN,
      WEIGHT_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue: string) => {
        this.props.setProductInformation({
          payload: {
            weight: formatedValue,
            weightError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      (reason: string) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_007');
        this.props.setProductInformation({
          payload: {
            weightError: error
          }
        });
        if (event !== null) {
          scrollToElement(event.target);
        }
      }
    );
  }
  render(): React.ReactNode {
    const { productScreen, t } = this.props;
    return (
      <>
        <Grid
          item
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${PalletStyles['space-bottom']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false}>
            <Grid item container xs>
              <Typography variant="h6" className={PalletStyles['title']}>
                {t('product-dimensions')}
              </Typography>
              <Grid item xs={12}>
                <Grid item container xs>
                  <Grid item container xs={6} md={6} lg={7} paddingRight="1em">
                    <Grid item container xs={12}>
                      <Grid item xs={12}>
                        <FormLabel htmlFor="length" className={PalletStyles['form-label-item']}>
                          {t('length')}
                        </FormLabel>
                      </Grid>
                      <Grid item xs={12} md={9} lg={6}>
                        <TextField
                          type="tel"
                          inputProps={{ maxLength: 11 }}
                          id="length"
                          defaultValue={productScreen.length}
                          onChange={(e) => this.checkInput(e, 'length')}
                          className={PalletStyles['form-label-textfield']}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                          onBlur={(e) => this.validateLength(e)}
                          error={productScreen.lengthError?.length > 0}
                          value={productScreen.length}
                          disabled={this.props.running}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormHelperText className={PalletStyles['error-common']}>
                          {productScreen.lengthError}
                        </FormHelperText>
                      </Grid>
                    </Grid>
                    <Grid item container xs={12} className={PalletStyles['row-spacing']}>
                      <Grid item xs={12}>
                        <FormLabel htmlFor="width" className={PalletStyles['form-label-item']}>
                          {t('width')}
                        </FormLabel>
                      </Grid>
                      <Grid item xs={12} md={9} lg={6}>
                        <TextField
                          type="tel"
                          inputProps={{ maxLength: 11 }}
                          id="width"
                          onChange={(e) => this.checkInput(e, 'width')}
                          defaultValue={productScreen.width}
                          className={PalletStyles['form-label-textfield']}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                          onBlur={(e) => this.validateWidth(e)}
                          error={productScreen.widthError?.length > 0}
                          value={productScreen.width}
                          disabled={this.props.running}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormHelperText className={PalletStyles['error-common']}>
                          {productScreen.widthError}
                        </FormHelperText>
                      </Grid>
                    </Grid>
                    <Grid item container xs={12} className={PalletStyles['row-spacing']}>
                      <Grid item xs={12}>
                        <FormLabel htmlFor="height" className={PalletStyles['form-label-item']}>
                          {t('height')}
                        </FormLabel>
                      </Grid>
                      <Grid item xs={12} md={9} lg={6}>
                        <TextField
                          type="tel"
                          inputProps={{ maxLength: 11 }}
                          id="height"
                          onChange={(e) => this.checkInput(e, 'height')}
                          defaultValue={productScreen.height}
                          className={PalletStyles['form-label-textfield']}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                          onBlur={(e) => this.validateHeight(e)}
                          error={productScreen.heightError?.length > 0}
                          value={productScreen.height}
                          disabled={this.props.running}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormHelperText className={PalletStyles['error-common']}>
                          {productScreen.heightError}
                        </FormHelperText>
                      </Grid>
                    </Grid>
                    <Grid item container xs={12} className={PalletStyles['row-spacing']}>
                      <Grid item xs={12}>
                        <FormLabel htmlFor="weight" className={PalletStyles['form-label-item']}>
                          {t('weight')}
                        </FormLabel>
                      </Grid>
                      <Grid item xs={12} md={9} lg={6}>
                        <TextField
                          type="tel"
                          inputProps={{ maxLength: 11 }}
                          id="weight"
                          onChange={(e) => this.checkInput(e, 'weight')}
                          defaultValue={productScreen.weight}
                          className={PalletStyles['form-label-textfield']}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">kg</InputAdornment>
                          }}
                          onBlur={(e) => this.validateWeight(e)}
                          error={productScreen.weightError?.length > 0}
                          value={productScreen.weight}
                          disabled={this.props.running}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormHelperText className={PalletStyles['error-common']}>
                          {productScreen.weightError}
                        </FormHelperText>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={6} md={6} lg={5} className={PalletStyles['guided-image']}>
                    <img src={PRODUCT_INFO} alt="product info" width="100%" />
                  </Grid>
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
    setProductInformation: (action: { payload: { [key: string]: string } }) =>
      dispatch(setProductInformation(action.payload))
  };
}
function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    productScreen: state.product
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing', { withRef: true })(ProductInformationScreen)
);
