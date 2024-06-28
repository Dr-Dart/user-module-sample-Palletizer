/* eslint-disable @typescript-eslint/no-unused-vars */

/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import ErrorIcon from '@mui/icons-material/Error';
import {
  Container,
  Divider,
  FormHelperText,
  FormLabel,
  Grid,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import React, { FocusEvent } from 'react';
import { NUMBER_OF_DECIMAL, NUMBER_OF_DECIMAL_DEGREE, STRING_EMPTY, TABLE_INFEEDER_PALLET } from './consts';
import { OnlyRunMapStateToProps, HoldButton, SetPosition, InPalletReducer, Point } from './type';
import {
  checkDataBeforeMoving,
  checkNumber,
  isArrayIntersect,
  showGroupMessage,
  validateNumberInput,
  validationPosition,
  getDiffKey,
  isDuplicateTwoPoint,
  isPlane,
  isDuplicateThreePoint,
  acceptRightAngle,
  deepCompareEqual
} from './util';
import { Context, IDartDatabase, RobotSpace, SixNumArray } from 'dart-api';
import { setInPalletValue } from './redux/InpalletSlice';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import PointsPosition from './components/PointsPosition';
import SelectPallet from './components/SelectPallet';
import { ModuleContext } from './ModuleContext';
import DialogCommon from './DialogCommon';
import { TFunction, withTranslation } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import PALLET_DIMENTIONS from './assets/images/pallet_dimensions.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignored
import PRODUCT_POSITION from './assets/images/product_position.png';
import PalletStyles from './assets/styles/style.scss';
import FeederScreenStyles from './assets/styles/feederScreen.scss';
interface InPalletScreenProps {
  hidden: boolean;
  getCurrentPosition: (roboSapce: RobotSpace, cb: SetPosition) => void;
  movesToPositionLJ: (type: RobotSpace, postions: SixNumArray, holdButton?: HoldButton) => void;
  stopMoveToPosition: () => void;
  setCalibSettingChanged: (changed: boolean) => void;
  holdButton: HoldButton;
  setHoldButton: (button: HoldButton) => void;
  isRobotConnected: boolean;
  projectId: string;
  setInPalletValue: (action: { payload: { [key: string]: string } }) => void;
  running: boolean;
  inPalletInfor: InPalletReducer;
  gripperType: string;
  projectName?: string;
  setDataChanged?: (changed: boolean) => void;
  t: TFunction;
}
interface InPalletScreenState {
  changed: boolean;
  loaded: boolean;
  getPoseWarning: boolean;
}
const PALLET_MIN = 1;
const PALLET_MAX = 1300;
const ERR_018 = 'ERR_018';
const ERR_019 = 'ERR_019';
const ERR_020 = 'ERR_020';
const errorMultiPoint = [ERR_018, ERR_019, ERR_020];
declare const window: any;

class InPalletScreen extends React.Component<InPalletScreenProps, InPalletScreenState> {
  private db: IDartDatabase;
  static contextType = ModuleContext;
  context!: React.ContextType<typeof ModuleContext>;
  constructor(props: InPalletScreenProps) {
    super(props);
    this.state = {
      changed: false,
      loaded: false,
      getPoseWarning: false
    };
    window.saveInFeederPallet = this.saveInFeederPallet.bind(this);
  }
  async componentDidMount() {
    this.db = this.context.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    await this.loadInFeederPallet().finally(() => this.setState({ ...this.state, loaded: true }));
  }

  shouldComponentUpdate(nextProps: InPalletScreenProps) {
    /* istanbul ignore next */
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

  loadInFeederPallet = async () => {
    const queryResult = await this.db?.query(TABLE_INFEEDER_PALLET.name, TABLE_INFEEDER_PALLET.columns, {
      projectId: this.props.projectId
    });
    /* istanbul ignore next */
    if (queryResult?.length > 0) {
      const data = {
        selectedPallet: queryResult[0].data['selectedPallet'],
        inPalletLength: queryResult[0].data['length'],
        inPalletWidth: queryResult[0].data['width'],
        inPalletRow: queryResult[0].data['row'],
        inPalletColumn: queryResult[0].data['column'],
        inPalletLayer: queryResult[0].data['layer'],
        posX1: queryResult[0].data['xPos1'],
        posY1: queryResult[0].data['yPos1'],
        posZ1: queryResult[0].data['zPos1'],
        posA1: queryResult[0].data['aPos1'],
        posB1: queryResult[0].data['bPos1'],
        posC1: queryResult[0].data['cPos1'],
        posX2: queryResult[0].data['xPos2'],
        posY2: queryResult[0].data['yPos2'],
        posZ2: queryResult[0].data['zPos2'],
        posA2: queryResult[0].data['aPos2'],
        posB2: queryResult[0].data['bPos2'],
        posC2: queryResult[0].data['cPos2'],
        posX3: queryResult[0].data['xPos3'],
        posY3: queryResult[0].data['yPos3'],
        posZ3: queryResult[0].data['zPos3'],
        posA3: queryResult[0].data['aPos3'],
        posB3: queryResult[0].data['bPos3'],
        posC3: queryResult[0].data['cPos3'],
        lengthError: queryResult[0].data['lengthError'],
        widthError: queryResult[0].data['widthError'],
        rowError: queryResult[0].data['rowError'],
        columnError: queryResult[0].data['columnError'],
        layerError: queryResult[0].data['layerError'],
        x1Error: queryResult[0].data['x1Error'],
        x2Error: queryResult[0].data['x2Error'],
        x3Error: queryResult[0].data['x3Error'],
        y1Error: queryResult[0].data['y1Error'],
        y2Error: queryResult[0].data['y2Error'],
        y3Error: queryResult[0].data['y3Error'],
        z1Error: queryResult[0].data['z1Error'],
        z2Error: queryResult[0].data['z2Error'],
        z3Error: queryResult[0].data['z3Error'],
        a1Error: queryResult[0].data['a1Error'],
        a2Error: queryResult[0].data['a2Error'],
        a3Error: queryResult[0].data['a3Error'],
        b1Error: queryResult[0].data['b1Error'],
        b2Error: queryResult[0].data['b2Error'],
        b3Error: queryResult[0].data['b3Error'],
        c1Error: queryResult[0].data['c1Error'],
        c2Error: queryResult[0].data['c2Error'],
        c3Error: queryResult[0].data['c3Error']
      };

      this.props.setInPalletValue({ payload: data } as unknown as { payload: { [key: string]: string } });
    }
  };

  /* istanbul ignore next */
  saveInFeederPallet = async (projectId: string) => {
    await this.db
      ?.update(
        TABLE_INFEEDER_PALLET.name,
        { projectId: projectId },
        {
          projectId: projectId,
          selectedPallet: this.props.inPalletInfor.selectedPallet,
          length: this.props.inPalletInfor.inPalletLength,
          width: this.props.inPalletInfor.inPalletWidth,
          row: this.props.inPalletInfor.inPalletRow,
          column: this.props.inPalletInfor.inPalletColumn,
          layer: this.props.inPalletInfor.inPalletLayer,
          xPos1: this.props.inPalletInfor.posX1,
          yPos1: this.props.inPalletInfor.posY1,
          zPos1: this.props.inPalletInfor.posZ1,
          aPos1: this.props.inPalletInfor.posA1,
          bPos1: this.props.inPalletInfor.posB1,
          cPos1: this.props.inPalletInfor.posC1,
          xPos2: this.props.inPalletInfor.posX2,
          yPos2: this.props.inPalletInfor.posY2,
          zPos2: this.props.inPalletInfor.posZ2,
          aPos2: this.props.inPalletInfor.posA2,
          bPos2: this.props.inPalletInfor.posB2,
          cPos2: this.props.inPalletInfor.posC2,
          xPos3: this.props.inPalletInfor.posX3,
          yPos3: this.props.inPalletInfor.posY3,
          zPos3: this.props.inPalletInfor.posZ3,
          aPos3: this.props.inPalletInfor.posA3,
          bPos3: this.props.inPalletInfor.posB3,
          cPos3: this.props.inPalletInfor.posC3,
          lengthError: this.props.inPalletInfor.lengthError,
          widthError: this.props.inPalletInfor.widthError,
          rowError: this.props.inPalletInfor.rowError,
          columnError: this.props.inPalletInfor.columnError,
          layerError: this.props.inPalletInfor.layerError,
          x1Error: this.props.inPalletInfor.x1Error,
          x2Error: this.props.inPalletInfor.x2Error,
          x3Error: this.props.inPalletInfor.x3Error,
          y1Error: this.props.inPalletInfor.y1Error,
          y2Error: this.props.inPalletInfor.y2Error,
          y3Error: this.props.inPalletInfor.y3Error,
          z1Error: this.props.inPalletInfor.z1Error,
          z2Error: this.props.inPalletInfor.z2Error,
          z3Error: this.props.inPalletInfor.z3Error,
          a1Error: this.props.inPalletInfor.a1Error,
          a2Error: this.props.inPalletInfor.a2Error,
          a3Error: this.props.inPalletInfor.a3Error,
          b1Error: this.props.inPalletInfor.b1Error,
          b2Error: this.props.inPalletInfor.b2Error,
          b3Error: this.props.inPalletInfor.b3Error,
          c1Error: this.props.inPalletInfor.c1Error,
          c2Error: this.props.inPalletInfor.c2Error,
          c3Error: this.props.inPalletInfor.c3Error
        }
      )
      .then(async (updatedRowCount) => {
        if (updatedRowCount === 0) {
          await this.db
            ?.delete(TABLE_INFEEDER_PALLET.name, {
              projectId: projectId
            })
            .then(() => {
              this.db?.insert(TABLE_INFEEDER_PALLET.name, [
                projectId,
                this.props.inPalletInfor.selectedPallet,
                this.props.inPalletInfor.inPalletLength,
                this.props.inPalletInfor.inPalletWidth,
                this.props.inPalletInfor.inPalletRow,
                this.props.inPalletInfor.inPalletColumn,
                this.props.inPalletInfor.inPalletLayer,
                this.props.inPalletInfor.posX1,
                this.props.inPalletInfor.posY1,
                this.props.inPalletInfor.posZ1,
                this.props.inPalletInfor.posA1,
                this.props.inPalletInfor.posB1,
                this.props.inPalletInfor.posC1,
                this.props.inPalletInfor.posX2,
                this.props.inPalletInfor.posY2,
                this.props.inPalletInfor.posZ2,
                this.props.inPalletInfor.posA2,
                this.props.inPalletInfor.posB2,
                this.props.inPalletInfor.posC2,
                this.props.inPalletInfor.posX3,
                this.props.inPalletInfor.posY3,
                this.props.inPalletInfor.posZ3,
                this.props.inPalletInfor.posA3,
                this.props.inPalletInfor.posB3,
                this.props.inPalletInfor.posC3,
                this.props.inPalletInfor.lengthError,
                this.props.inPalletInfor.widthError,
                this.props.inPalletInfor.rowError,
                this.props.inPalletInfor.columnError,
                this.props.inPalletInfor.layerError,
                this.props.inPalletInfor.x1Error,
                this.props.inPalletInfor.x2Error,
                this.props.inPalletInfor.x3Error,
                this.props.inPalletInfor.y1Error,
                this.props.inPalletInfor.y2Error,
                this.props.inPalletInfor.y3Error,
                this.props.inPalletInfor.z1Error,
                this.props.inPalletInfor.z2Error,
                this.props.inPalletInfor.z3Error,
                this.props.inPalletInfor.a1Error,
                this.props.inPalletInfor.a2Error,
                this.props.inPalletInfor.a3Error,
                this.props.inPalletInfor.b1Error,
                this.props.inPalletInfor.b2Error,
                this.props.inPalletInfor.b3Error,
                this.props.inPalletInfor.c1Error,
                this.props.inPalletInfor.c2Error,
                this.props.inPalletInfor.c3Error
              ]);
            });
        }
      });
  };

  /* istanbul ignore next */
  haschanged = (): boolean => {
    return this.state.changed;
  };

  /* istanbul ignore next */
  saved = () => {
    this.setState({ changed: false });
  };

  /* istanbul ignore next */
  hasError = (): boolean => {
    let isError = false;
    for (const [key, value] of Object.entries(this.props.inPalletInfor)) {
      if (key.includes('Error') && typeof value === 'string' && !!value.length) {
        isError = true;
        break;
      }
    }
    return isError;
  };

  componentDidUpdate(prevProps: InPalletScreenProps, prevState: InPalletScreenState) {
    const { ...previousProps } = prevProps.inPalletInfor;
    const { ...currentProps } = this.props.inPalletInfor;
    /* istanbul ignore next */
    if (
      prevState.loaded &&
      !this.state.changed &&
      !deepCompareEqual(prevProps.inPalletInfor, this.props.inPalletInfor)
    ) {
      this.setState({ changed: true });
    }
    if (!deepCompareEqual(prevProps.inPalletInfor, this.props.inPalletInfor)) {
      this.setState({ changed: true });
      this.props.setDataChanged?.(true);
    }

    // When change value of field below, set message change setting in calibrate enable
    const fieldTocheck = ['inPalletRow', 'inPalletColumn', 'inPalletLayer'];
    if (isArrayIntersect(fieldTocheck, getDiffKey({ ...currentProps }, { ...previousProps }))) {
      this.props.setCalibSettingChanged(true);
    }
  }

  validateLength = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      PALLET_MIN,
      PALLET_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInPalletValue({
          payload: {
            inPalletLength: formatedValue,
            lengthError: ''
          }
        });
        if (event !== null) {
          event.target.value = formatedValue;
        }
      },
      /* istanbul ignore next */
      (reason) => {
        const error = reason === 'EMPTY' ? this.props.t('ERR_014') : this.props.t('ERR_008');
        this.props.setInPalletValue({
          payload: {
            lengthError: error
          }
        });
      }
    );
  };
  validateWidth = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const valueToValidate = event?.target.value;
    validateNumberInput(
      valueToValidate,
      PALLET_MIN,
      PALLET_MAX,
      NUMBER_OF_DECIMAL,
      (formatedValue) => {
        this.props.setInPalletValue({
          payload: {
            inPalletWidth: formatedValue,
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
        this.props.setInPalletValue({
          payload: {
            widthError: error
          }
        });
      }
    );
  };

  /* istanbul ignore next */
  checkInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: 'length' | 'width' | 'overhang' | 'underhang' | 'boxPadding' | 'maxLayer',
    isCheckFloat = true,
    acceptNegative = false
  ) => {
    const { name, value, selectionStart, selectionEnd } = event.target;
    if (value === null || selectionStart === null || selectionEnd === null) {
      return;
    }
    if (checkNumber(value, isCheckFloat, acceptNegative)) {
      this.props.setInPalletValue({
        payload: {
          [name]: value
        }
      });
    } else {
      // event.target.selectionStart = selectionStart - 1;
      // event.target.selectionEnd = selectionEnd - 1;
    }
  };
  controlSelectValueInFeeder = (e: SelectChangeEvent<string>) => {
    this.setState({ changed: true });
    const { value } = e.target;
    if (value !== 'CustomSize') {
      const length = parseFloat(value.slice(0, value.indexOf('-')));
      const width = parseFloat(value.slice(value.indexOf('-') + 1, value.length));
      this.props.setInPalletValue({
        payload: {
          lengthError: '',
          widthError: '',
          inPalletLength: length.toFixed(NUMBER_OF_DECIMAL),
          inPalletWidth: width.toFixed(NUMBER_OF_DECIMAL),
          selectedPallet: e.target.value
        }
      });
    } else {
      this.props.setInPalletValue({
        payload: {
          lengthError: '',
          widthError: '',
          inPalletLength: '',
          inPalletWidth: '',
          selectedPallet: 'CustomSize'
        }
      });
    }
  };
  isMaxItem = (row: any, column: any, layer: any, event: any) => {
    if (row * column * layer > 1000) {
      const error = 'ERR_021';
      this.props.setInPalletValue({
        payload: {
          columnError: error,
          rowError: error,
          layerError: error
        }
      });
      if (event !== null) {
        // scrollToElement(event.target);
      }
      return true;
    }
    return false;
  };
  /* istanbul ignore next */
  removeRowErrorMaxProduct = () => {
    if (this.props.inPalletInfor.rowError === 'ERR_021') {
      this.props.setInPalletValue({
        payload: {
          rowError: ''
        }
      });
    }
  };

  removeLayerErrorMaxProduct = () => {
    if (this.props.inPalletInfor.layerError === 'ERR_021') {
      this.props.setInPalletValue({
        payload: {
          layerError: ''
        }
      });
    }
  };

  removeColumnErrorMaxProduct = () => {
    if (this.props.inPalletInfor.columnError === 'ERR_021') {
      this.props.setInPalletValue({
        payload: {
          columnError: ''
        }
      });
    }
  };

  removeErrorMaxProduct = () => {
    const { inPalletInfor } = this.props;
    this.props.setInPalletValue({
      payload: {
        columnError: inPalletInfor.columnError === 'ERR_021' ? '' : inPalletInfor.columnError,
        rowError: inPalletInfor.rowError === 'ERR_021' ? '' : inPalletInfor.rowError,
        layerError: inPalletInfor.layerError === 'ERR_021' ? '' : inPalletInfor.layerError
      }
    });
  };
  setValueColumn = (formatedValue: any, event: any) => {
    this.props.setInPalletValue({
      payload: {
        inPalletColumn: formatedValue,
        columnError: ''
      }
    });
    if (event !== null) {
      event.target.value = formatedValue;
    }
  };

  setValueRow = (formatedValue: any, event: any) => {
    this.props.setInPalletValue({
      payload: {
        inPalletRow: formatedValue,
        rowError: ''
      }
    });
    if (event !== null) {
      event.target.value = formatedValue;
    }
  };

  setValueLayer = (formatedValue: string, event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    this.props.setInPalletValue({
      payload: {
        inPalletLayer: formatedValue,
        layerError: ''
      }
    });
    if (event !== null) {
      event.target.value = formatedValue;
    }
  };

  /* istanbul ignore next */
  validateColumn = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const { inPalletInfor } = this.props;
    const valueToValidate = event?.target.value;
    const minValidate = 2;
    const maxValidate = 100;
    validateNumberInput(
      valueToValidate,
      minValidate,
      maxValidate,
      0,
      (formatedValue) => {
        if (
          (inPalletInfor.rowError !== '' && inPalletInfor.rowError !== 'ERR_021') ||
          (inPalletInfor.layerError !== '' && inPalletInfor.layerError !== 'ERR_021')
        ) {
          this.setValueColumn(formatedValue, event);
          return;
        }
        if (!this.isMaxItem(inPalletInfor.inPalletRow, formatedValue, inPalletInfor.inPalletLayer, event)) {
          this.removeErrorMaxProduct();
          this.setValueColumn(formatedValue, event);
        }
      },
      (reason) => {
        const error = reason === 'EMPTY' ? 'ERR_014' : 'ERR_022';
        this.props.setInPalletValue({
          payload: {
            columnError: error
          }
        });

        this.removeRowErrorMaxProduct();
        this.removeLayerErrorMaxProduct();
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateRow = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const { inPalletInfor } = this.props;
    const valueToValidate = event?.target.value;
    const minValidate = 2;
    const maxValidate = 100;
    validateNumberInput(
      valueToValidate,
      minValidate,
      maxValidate,
      0,
      (formatedValue) => {
        if (
          (inPalletInfor.columnError !== '' && inPalletInfor.columnError !== 'ERR_021') ||
          (inPalletInfor.layerError !== '' && inPalletInfor.layerError !== 'ERR_021')
        ) {
          this.setValueRow(formatedValue, event);
          return;
        }
        if (!this.isMaxItem(formatedValue, inPalletInfor.inPalletColumn, inPalletInfor.inPalletLayer, event)) {
          this.removeErrorMaxProduct();
          this.setValueRow(formatedValue, event);
        }
      },
      (reason) => {
        const error = reason === 'EMPTY' ? 'ERR_014' : 'ERR_022';
        this.props.setInPalletValue({
          payload: {
            rowError: error
          }
        });

        this.removeColumnErrorMaxProduct();
        this.removeLayerErrorMaxProduct();
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };
  validateLayer = (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const { inPalletInfor } = this.props;
    const valueToValidate = event?.target.value;
    const minValidate = 1;
    const maxValidate = 100;
    validateNumberInput(
      valueToValidate,
      minValidate,
      maxValidate,
      0,
      /* istanbul ignore next */
      (formatedValue) => {
        if (
          (inPalletInfor.columnError !== '' && inPalletInfor.columnError !== 'ERR_021') ||
          (inPalletInfor.rowError !== '' && inPalletInfor.rowError !== 'ERR_021')
        ) {
          this.setValueLayer(formatedValue, event);
        } else if (!this.isMaxItem(inPalletInfor.inPalletRow, inPalletInfor.inPalletColumn, formatedValue, event)) {
          /* istanbul ignore next */
          this.removeErrorMaxProduct();
          this.setValueLayer(formatedValue, event);
        }
      },
      (reason) => {
        const error = reason === 'EMPTY' ? 'ERR_014' : 'ERR_012';

        this.props.setInPalletValue({
          payload: {
            layerError: error
          }
        });

        this.removeColumnErrorMaxProduct();
        this.removeRowErrorMaxProduct();
        if (event !== null) {
          // scrollToElement(event.target);
        }
      }
    );
  };

  /**
   * Get Props old for position 1 2 3
   * @param isBlur Event blur or event Get Position
   */
  getPropsOld = (isBlur: boolean) => {
    const errorField: { [key: string]: string } = {
      x1Error: '',
      x2Error: '',
      x3Error: '',
      y1Error: '',
      y2Error: '',
      y3Error: '',
      z1Error: '',
      z2Error: '',
      z3Error: '',
      a1Error: '',
      a2Error: '',
      a3Error: '',
      b1Error: '',
      b2Error: '',
      b3Error: '',
      c1Error: '',
      c2Error: '',
      c3Error: ''
    };
    const field: { [key: string]: string } = {
      posX1: '',
      posY1: '',
      posZ1: '',
      posX2: '',
      posY2: '',
      posZ2: '',
      posX3: '',
      posY3: '',
      posZ3: '',
      posA1: '',
      posB1: '',
      posC1: '',
      posA2: '',
      posB2: '',
      posC2: '',
      posA3: '',
      posB3: '',
      posC3: ''
    };
    const propInPallet: { [key: string]: string } = { ...this.props.inPalletInfor };

    // If event "Get Position" all isolated error is empty
    // If event "blur field", get all error nearest of field
    if (isBlur) {
      for (const item of Object.keys(errorField)) {
        if (!errorMultiPoint.includes(propInPallet[item])) {
          errorField[item] = propInPallet[item];
        }
      }
    }

    // Merge all value position 1 2 3
    for (const item of Object.keys(field)) {
      field[item] = propInPallet[item];
    }

    return Object.assign(errorField, field);
  };

  /**
   * Set error for xyz of positionType
   * @param errorField list field of position
   * @param positionType index position
   * @param errorMessage message error
   */
  setErrorForPositionCluster = (
    errorField: { [key: string]: string },
    positionType: 1 | 2 | 3,
    errorMessage: string
  ) => {
    errorField[`x${positionType}Error`] = errorMessage;
    errorField[`y${positionType}Error`] = errorMessage;
    errorField[`z${positionType}Error`] = errorMessage;
  };
  /**
   * Handle duplicate Point
   * @param errorField list field of position
   * @param position array contain position index duplicate
   */
  handleDuplicatePoint = (errorField: { [key: string]: string }, position: number[]) => {
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    if (position.includes(positionIndexOne)) {
      this.setErrorForPositionCluster(errorField, positionIndexOne, ERR_018);
    }
    if (position.includes(positionIndexTwo)) {
      this.setErrorForPositionCluster(errorField, positionIndexTwo, ERR_018);
    }
    if (position.includes(positionIndexThree)) {
      this.setErrorForPositionCluster(errorField, positionIndexThree, ERR_018);
    }
  };
  /**
   * Handle Validate XYZ Cluster
   * @param errorField list field of position
   */
  handleValidateXYZCluster = (errorField: { [key: string]: string }) => {
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    const [position1, position2, position3] = this.getPoint(errorField);

    // Duplicate validate
    const [isDuplicate, position] = this.checkDuplicatePoint(errorField);
    if (isDuplicate) {
      this.handleDuplicatePoint(errorField, position);
      return true;
    }
    // Plane validte
    if (position1 !== null && position2 !== null && position3 !== null) {
      if (!this.checkIsPlane(position1, position2, position3)) {
        this.setErrorForPositionCluster(errorField, positionIndexOne, ERR_018);
        this.setErrorForPositionCluster(errorField, positionIndexTwo, ERR_018);
        this.setErrorForPositionCluster(errorField, positionIndexThree, ERR_018);
        return true;
      }
      /* istanbul ignore next */
      if (!this.acceptRightAngle(errorField)) {
        // The X, Y, Z values of Position 1, Position 2 and Position 3 don't form a right angle.
        this.setErrorForPositionCluster(errorField, positionIndexOne, ERR_019);
        this.setErrorForPositionCluster(errorField, positionIndexTwo, ERR_019);
        this.setErrorForPositionCluster(errorField, positionIndexThree, ERR_019);
        return true;
      }
    }
    return false;
  };
  /**
   * The A, B, C values of Position 1, Position 2 and Position 3 are less/greater than 5 degrees with each other
   * @param errorField list field of position
   */
  /* istanbul ignore next */
  handleValidateABCCluster = (errorField: { [key: string]: string }) => {
    const [acceptMeasurement, positionABC] = this.acceptMeasurementError(errorField);
    if (!acceptMeasurement) {
      const errorABC = Object.entries(positionABC);
      for (const [key, value] of errorABC) {
        if (value) {
          errorField[`${key}Error`] = ERR_020;
        }
      }
    }
    return !acceptMeasurement;
  };

  /**
   * Validate Cluster Position
   * @param errorType errorType correcsponding with fieldBlur
   * @param fieldBlur fieldBlur
   * @param result if blur field no error type is string, else object
   * @param isBlur event blur or event get Position
   */
  validationHandle = (
    errorType: string,
    fieldBlur: string,
    result: string | { [key: string]: string },
    isBlur: boolean
  ) => {
    const fieldMegre: { [key: string]: string } = this.getPropsOld(isBlur);
    if (isBlur) {
      if (typeof result !== 'string') {
        fieldMegre[fieldBlur] = result.value;
        fieldMegre[errorType] = STRING_EMPTY;
      } else {
        fieldMegre[errorType] = result;
      }
    }
    const isErrorXYZ = this.handleValidateXYZCluster(fieldMegre);
    const isErrorABC = this.handleValidateABCCluster(fieldMegre);
    this.props.setInPalletValue({
      payload: fieldMegre
    });
    return isErrorXYZ || isErrorABC;
  };

  validationPosition = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>, errorType: string) => {
    const { name } = event.target;
    const result = validationPosition(event);
    // Validate cluster position
    const isError = this.validationHandle(errorType, name, result, true);
    const TIME_OUT = 100;
    // If has error, scroll to target element
    if (typeof result === 'string') {
      // return scrollToElement(event.target);
    } else if (isError) {
      // return scrollToElement(event.target);
    } else {
      return;
    }
  };

  /* istanbul ignore next */
  setValueToPosition = (typeMove: RobotSpace, positionType: 1 | 2 | 3 | 4) => {
    const isCurrentProject = !!this.props.gripperType;
    if (isCurrentProject) {
      this.props.getCurrentPosition(typeMove, (data: SixNumArray) => {
        const posX = 0;
        const posY = 1;
        const posZ = 2;
        const posA = 3;
        const posB = 4;
        const posC = 5;
        const stateData = {
          [`posX${positionType}`]: data[posX].toFixed(NUMBER_OF_DECIMAL),
          [`posY${positionType}`]: data[posY].toFixed(NUMBER_OF_DECIMAL),
          [`posZ${positionType}`]: data[posZ].toFixed(NUMBER_OF_DECIMAL),
          [`posA${positionType}`]: data[posA].toFixed(NUMBER_OF_DECIMAL_DEGREE),
          [`posB${positionType}`]: data[posB].toFixed(NUMBER_OF_DECIMAL_DEGREE),
          [`posC${positionType}`]: data[posC].toFixed(NUMBER_OF_DECIMAL_DEGREE),
          [`x${positionType}Error`]: '',
          [`y${positionType}Error`]: '',
          [`z${positionType}Error`]: '',
          [`a${positionType}Error`]: '',
          [`b${positionType}Error`]: '',
          [`c${positionType}Error`]: ''
        };
        this.props.setInPalletValue({
          payload: stateData
        } as unknown as { payload: { [key: string]: string } });
        this.validationHandle('', '', '', false);
      });
    } else {
      this.setState({ getPoseWarning: true });
    }
  };

  /* istanbul ignore next */
  moveToPosition = (typeMove: RobotSpace, positionType: 1 | 2 | 3, holdButton: HoldButton) => {
    const { inPalletInfor } = this.props;
    const pos = [
      Number(this.props.inPalletInfor[`posX${positionType}`]),
      Number(this.props.inPalletInfor[`posY${positionType}`]),
      Number(this.props.inPalletInfor[`posZ${positionType}`]),
      Number(this.props.inPalletInfor[`posA${positionType}`]),
      Number(this.props.inPalletInfor[`posB${positionType}`]),
      Number(this.props.inPalletInfor[`posC${positionType}`])
    ] as SixNumArray;
    if (
      checkDataBeforeMoving({
        x: inPalletInfor[`posX${positionType}`],
        y: inPalletInfor[`posY${positionType}`],
        z: inPalletInfor[`posZ${positionType}`],
        a: inPalletInfor[`posA${positionType}`],
        b: inPalletInfor[`posB${positionType}`],
        c: inPalletInfor[`posC${positionType}`]
      })
    ) {
      return this.props.movesToPositionLJ(typeMove, pos, holdButton);
    }
  };
  getXYZPosition = (positionType: 1 | 2 | 3, fieldName: { [key: string]: string }): Point | null => {
    let x, y, z;
    // Set no value when field has error isolated
    if (fieldName[`x${positionType}Error`] === STRING_EMPTY && fieldName[`posX${positionType}`] !== STRING_EMPTY) {
      x = Number(this.props.inPalletInfor[`posX${positionType}`]);
    } else {
      return null;
    }

    if (fieldName[`y${positionType}Error`] === STRING_EMPTY && fieldName[`posY${positionType}`] !== STRING_EMPTY) {
      y = Number(this.props.inPalletInfor[`posY${positionType}`]);
    } else {
      return null;
    }

    if (fieldName[`z${positionType}Error`] === STRING_EMPTY && fieldName[`posZ${positionType}`] !== STRING_EMPTY) {
      z = Number(this.props.inPalletInfor[`posZ${positionType}`]);
    } else {
      return null;
    }

    return { x, y, z };
  };
  /**
   * Get position (X,Y,Z)
   * Position null when XYZ has any error
   * @param fieldName represent for field has error
   */
  getPoint = (errorField: { [key: string]: string }) => {
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    const position1 = this.getXYZPosition(positionIndexOne, errorField);
    const position2 = this.getXYZPosition(positionIndexTwo, errorField);
    const position3 = this.getXYZPosition(positionIndexThree, errorField);
    return [position1, position2, position3];
  };
  checkDuplicatePoint = (fieldName: { [key: string]: string }): [boolean, number[]] => {
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    const [position1, position2, position3] = this.getPoint(fieldName);
    if (position1 === null) {
      return this.checkDuplicatePosition1HasValue(position2, position3);
    }
    if (position2 !== null && position3 !== null) {
      /* istanbul ignore next */
      if (isDuplicateThreePoint(position1, position2, position3)) {
        return [true, [positionIndexOne, positionIndexTwo, positionIndexThree]];
      }
      if (isDuplicateTwoPoint(position2, position3)) {
        return [true, [positionIndexTwo, positionIndexThree]];
      }
    }
    if (position2 !== null && isDuplicateTwoPoint(position1, position2)) {
      return [true, [positionIndexOne, positionIndexTwo]];
    }
    /* istanbul ignore next */
    if (position3 !== null && isDuplicateTwoPoint(position1, position3)) {
      return [true, [positionIndexOne, positionIndexThree]];
    }
    return [false, []];
  };

  /**
   * Check duplicate position cluster when Position 1 is null
   * Just check duplicate two point, case three point catch another method
   * Return boolean for validate and array number position error
   */
  checkDuplicatePosition1HasValue = (position2: Point | null, position3: Point | null): [boolean, number[]] => {
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    if (position2 === null) {
      return [false, []];
    }

    if (position3 !== null) {
      return [isDuplicateTwoPoint(position2, position3), [positionIndexTwo, positionIndexThree]];
    }

    return [false, []];
  };

  checkIsPlane = (position1: Point, position2: Point, position3: Point) => {
    return isPlane(position1, position2, position3);
  };

  /**
   * From three point in screen, calc three angle
   * return true at least one angle from 85 degree to 95 degree
   */
  /* istanbul ignore next */
  acceptRightAngle = (fieldName: { [key: string]: string }) => {
    const [position1, position2, position3] = this.getPoint(fieldName);

    if (position1 !== null && position2 !== null && position3 !== null) {
      return acceptRightAngle(position1, position2, position3);
    }
    return false;
  };

  /**
   * Get angle ABC of position 1 2 3
   * @param fieldChar A | B | C
   * @param position 1 | 2 | 3
   * @param propsField this is field on blur and has error isolated, null if field no error
   */
  getValueAngle = (
    fieldChar: 'A' | 'B' | 'C',
    errorChar: 'a' | 'b' | 'c',
    position: 1 | 2 | 3,
    propsField: { [key: string]: string }
  ) => {
    // Set no value when field has error isolated
    if (
      propsField[`${errorChar}${position}Error`] === STRING_EMPTY &&
      propsField[`pos${fieldChar}${position}`] !== STRING_EMPTY
    ) {
      return Number(propsField[`pos${fieldChar}${position}`]);
    }
    return null;
  };

  /**
   * Validate each angle 5 degree apart
   */
  hasErrorAngle = (pos1: number | null, pos2: number | null, pos3: number | null): [boolean, boolean, boolean] => {
    const MAX_APART_DEGREE = 5;
    if (pos1 !== null) {
      return this.hasErrorAnglePos1NotNull(pos1, pos2, pos3);
    }
    /* istanbul ignore next */
    if (pos2 !== null && pos3 !== null && Math.abs(pos2 - pos3) > MAX_APART_DEGREE) {
      return [false, true, true];
    }
    return [false, false, false];
  };
  hasErrorAnglePos1NotNull = (pos1: number, pos2: number | null, pos3: number | null): [boolean, boolean, boolean] => {
    const MAX_APART_DEGREE = 5;
    if (pos2 !== null && pos3 !== null) {
      if (
        Math.abs(pos1 - pos2) > MAX_APART_DEGREE ||
        Math.abs(pos2 - pos3) > MAX_APART_DEGREE ||
        Math.abs(pos1 - pos3) > MAX_APART_DEGREE
      ) {
        return [true, true, true];
      }
      return [false, false, false];
    } else if (pos2 !== null && Math.abs(pos1 - pos2) > MAX_APART_DEGREE) {
      return [true, true, false];
    } else if (pos3 !== null && Math.abs(pos1 - pos3) > MAX_APART_DEGREE) {
      return [true, false, true];
    } else {
      return [false, false, false];
    }
  };
  /**
   * Angle has error
   * @param propsField has value if on blur field has error
   */
  acceptMeasurementError = (propsField: { [key: string]: string }): [boolean, { [key: string]: boolean }] => {
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    const a1 = this.getValueAngle('A', 'a', positionIndexOne, propsField);
    const a2 = this.getValueAngle('A', 'a', positionIndexTwo, propsField);
    const a3 = this.getValueAngle('A', 'a', positionIndexThree, propsField);
    const b1 = this.getValueAngle('B', 'b', positionIndexOne, propsField);
    const b2 = this.getValueAngle('B', 'b', positionIndexTwo, propsField);
    const b3 = this.getValueAngle('B', 'b', positionIndexThree, propsField);
    const c1 = this.getValueAngle('C', 'c', positionIndexOne, propsField);
    const c2 = this.getValueAngle('C', 'c', positionIndexTwo, propsField);
    const c3 = this.getValueAngle('C', 'c', positionIndexThree, propsField);
    const errorField: { [key: string]: boolean } = {};
    let hasError = false;
    let [pos1, pos2, pos3] = this.hasErrorAngle(a1, a2, a3);

    errorField.a1 = pos1;
    errorField.a2 = pos2;
    errorField.a3 = pos3;
    hasError = hasError || pos1 || pos2 || pos3;

    [pos1, pos2, pos3] = this.hasErrorAngle(b1, b2, b3);
    errorField.b1 = pos1;
    errorField.b2 = pos2;
    errorField.b3 = pos3;
    hasError = hasError || pos1 || pos2 || pos3;

    [pos1, pos2, pos3] = this.hasErrorAngle(c1, c2, c3);
    errorField.c1 = pos1;
    errorField.c2 = pos2;
    errorField.c3 = pos3;
    hasError = hasError || pos1 || pos2 || pos3;
    return [!hasError, errorField];
  };

  render(): React.ReactNode {
    const { inPalletInfor } = this.props;
    const position1 = {
      value: {
        posX1: inPalletInfor.posX1,
        posY1: inPalletInfor.posY1,
        posZ1: inPalletInfor.posZ1,
        posA1: inPalletInfor.posA1,
        posB1: inPalletInfor.posB1,
        posC1: inPalletInfor.posC1
      },
      error: [
        {
          x1Error: inPalletInfor.x1Error,
          y1Error: inPalletInfor.y1Error,
          z1Error: inPalletInfor.z1Error
        },
        {
          a1Error: inPalletInfor.a1Error,
          b1Error: inPalletInfor.b1Error,
          c1Error: inPalletInfor.c1Error,
          x1Error: errorMultiPoint.includes(inPalletInfor.x1Error) ? inPalletInfor.x1Error : '',
          y1Error: errorMultiPoint.includes(inPalletInfor.y1Error) ? inPalletInfor.y1Error : '',
          z1Error: errorMultiPoint.includes(inPalletInfor.z1Error) ? inPalletInfor.z1Error : ''
        }
      ]
    };
    const position2 = {
      value: {
        posX2: inPalletInfor.posX2,
        posY2: inPalletInfor.posY2,
        posZ2: inPalletInfor.posZ2,
        posA2: inPalletInfor.posA2,
        posB2: inPalletInfor.posB2,
        posC2: inPalletInfor.posC2
      },
      error: [
        {
          x2Error: inPalletInfor.x2Error,
          y2Error: inPalletInfor.y2Error,
          z2Error: inPalletInfor.z2Error
        },
        {
          a2Error: inPalletInfor.a2Error,
          b2Error: inPalletInfor.b2Error,
          c2Error: inPalletInfor.c2Error,
          x2Error: errorMultiPoint.includes(inPalletInfor.x2Error) ? inPalletInfor.x2Error : '',
          y2Error: errorMultiPoint.includes(inPalletInfor.y2Error) ? inPalletInfor.y2Error : '',
          z2Error: errorMultiPoint.includes(inPalletInfor.z2Error) ? inPalletInfor.z2Error : ''
        }
      ]
    };
    const position3 = {
      value: {
        posX3: inPalletInfor.posX3,
        posY3: inPalletInfor.posY3,
        posZ3: inPalletInfor.posZ3,
        posA3: inPalletInfor.posA3,
        posB3: inPalletInfor.posB3,
        posC3: inPalletInfor.posC3
      },
      error: [
        {
          x3Error: inPalletInfor.x3Error,
          y3Error: inPalletInfor.y3Error,
          z3Error: inPalletInfor.z3Error
        },
        {
          a3Error: inPalletInfor.a3Error,
          b3Error: inPalletInfor.b3Error,
          c3Error: inPalletInfor.c3Error,
          x3Error: errorMultiPoint.includes(inPalletInfor.x3Error) ? inPalletInfor.x3Error : '',
          y3Error: errorMultiPoint.includes(inPalletInfor.y3Error) ? inPalletInfor.y3Error : '',
          z3Error: errorMultiPoint.includes(inPalletInfor.z3Error) ? inPalletInfor.z3Error : ''
        }
      ]
    };
    const positionIndexOne = 1;
    const positionIndexTwo = 2;
    const positionIndexThree = 3;
    const { t } = this.props;
    return (
      <>
        <Grid
          item={true}
          md={8}
          lg={8.5}
          className={`${PalletStyles['screen']} ${FeederScreenStyles['in-feeder-screen']} ${PalletStyles['pb-bottom']}`}
          hidden={this.props.hidden}
        >
          <Container maxWidth={false}>
            <Grid item container xs>
              <Typography className={PalletStyles['title']} variant="h6">
                {t('in-feeder-pallet-dimensions')}
              </Typography>
              <Grid item xs={12} md={12} lg={12}>
                <Grid item={true} container xs>
                  <Grid xs={6} md={6} lg={7} paddingRight="1em" item>
                    <SelectPallet
                      defaultValue={this.props.inPalletInfor.selectedPallet}
                      value={this.props.inPalletInfor.selectedPallet}
                      controlSelectValue={this.controlSelectValueInFeeder}
                      running={this.props.running}
                      palletLength={this.props.inPalletInfor.inPalletLength}
                      checkInputLength={(e) => this.checkInput(e, 'length')}
                      checkInputWidth={(e) => this.checkInput(e, 'width')}
                      validateLength={(e) => this.validateLength(e)}
                      validateWidth={(e) => this.validateWidth(e)}
                      isLengthError={!!this.props.inPalletInfor.lengthError?.length}
                      lengthError={this.props.inPalletInfor.lengthError}
                      selectedPallet={this.props.inPalletInfor.selectedPallet}
                      palletWidth={this.props.inPalletInfor.inPalletWidth}
                      isWidthError={!!this.props.inPalletInfor.widthError?.length}
                      widthError={this.props.inPalletInfor.widthError}
                    ></SelectPallet>
                  </Grid>
                  <Grid className={PalletStyles['guided-image']} item xs={6} md={6} lg={5}>
                    <img src={PALLET_DIMENTIONS} alt="pallet dimensions" width="100%" />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />
            <Typography variant="h6" className={PalletStyles['title']}>
              {t('pallet-row-col-layer')}
            </Typography>
            <Grid container item xs={12} md={12} lg={12}>
              <Grid container item xs={12} md={12} lg={7} className={FeederScreenStyles['define-pallet-layer']}>
                <Grid item xs={4} paddingRight="10px">
                  <FormLabel htmlFor="define-palllet-row" className={PalletStyles['form-label-item']}>
                    {t('row')}
                  </FormLabel>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    id="define-palllet-row"
                    defaultValue={this.props.inPalletInfor.inPalletRow?.toString()}
                    onChange={(e) => this.checkInput(e, 'width', false)}
                    className={PalletStyles['form-label-textfield-no-unit']}
                    onBlur={(e) => this.validateRow(e)}
                    error={!!this.props.inPalletInfor.rowError?.length}
                    value={this.props.inPalletInfor.inPalletRow}
                    disabled={this.props.running}
                    name="inPalletRow"
                  />
                </Grid>
                <Grid item xs={4} paddingRight="10px">
                  <FormLabel htmlFor="define-palllet-col" className={PalletStyles['form-label-item']}>
                    {t('column')}
                  </FormLabel>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    id="define-palllet-col"
                    defaultValue={this.props.inPalletInfor.inPalletColumn?.toString()}
                    onChange={(e) => this.checkInput(e, 'width', false)}
                    className={PalletStyles['form-label-textfield-no-unit']}
                    onBlur={(e) => this.validateColumn(e)}
                    error={!!this.props.inPalletInfor.columnError?.length}
                    value={this.props.inPalletInfor.inPalletColumn}
                    disabled={this.props.running}
                    name="inPalletColumn"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormLabel htmlFor="define-palllet-layer" className={PalletStyles['form-label-item']}>
                    {t('layer')}
                  </FormLabel>
                  <TextField
                    type="tel"
                    inputProps={{ maxLength: 11 }}
                    id="define-palllet-layer"
                    defaultValue={this.props.inPalletInfor.inPalletLayer?.toString()}
                    onChange={(e) => this.checkInput(e, 'width', false)}
                    className={PalletStyles['form-label-textfield-no-unit']}
                    onBlur={(e) => this.validateLayer(e)}
                    error={!!this.props.inPalletInfor.layerError?.length}
                    value={this.props.inPalletInfor.inPalletLayer}
                    disabled={this.props.running}
                    name="inPalletLayer"
                  />
                </Grid>
              </Grid>
              <Grid container xs={12} item>
                <Grid className={PalletStyles['container-message-group']}>
                  {showGroupMessage([
                    this.props.inPalletInfor.columnError,
                    this.props.inPalletInfor.rowError,
                    this.props.inPalletInfor.layerError
                  ]).map((msg: string, index: number) => (
                    <FormHelperText className={PalletStyles['error-common']} key={index}>
                      {t(msg)}
                    </FormHelperText>
                  ))}
                </Grid>
              </Grid>
            </Grid>
            <Divider variant="middle" className={PalletStyles['custom-devider']} />

            <Grid item container xs className={FeederScreenStyles['product-position']}>
              <Grid className={FeederScreenStyles['product']}>
                <Grid md={12} lg={7} item>
                  <Typography className={FeederScreenStyles['product-position--title']}>
                    {t('product-position')}
                  </Typography>
                  <Container className={FeederScreenStyles['warning-content']}>
                    <ErrorIcon />
                    <Typography>{t('inpallet-prd-width-must-be-aligned')}</Typography>
                  </Container>
                  <Container className={FeederScreenStyles['warning-content']}>
                    <ErrorIcon />
                    <Typography>{t('inpallet-save-the-pos-of-prd')}</Typography>
                  </Container>
                </Grid>
                <Grid item md={12} lg={5} className={PalletStyles['guided-image']}>
                  <img src={PRODUCT_POSITION} alt="product-position" />
                </Grid>
              </Grid>
              <Grid md={12} lg={7} item container className={FeederScreenStyles['position-action-container']}>
                <Grid item md={12} lg={12} className={FeederScreenStyles['button-position']}>
                  <PointsPosition
                    pointName={t('position-1')}
                    holdButton={this.props.holdButton}
                    buttonName="InPalletPos1"
                    data={position1.value}
                    errorMessage={position1.error}
                    handleChangeInput={(e) => this.checkInput(e, 'width', true, true)}
                    validationInput={this.validationPosition}
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, positionIndexOne)}
                    moveToPosition={(type: RobotSpace) => this.moveToPosition(type, positionIndexOne, 'InPalletPos1')}
                    stopMoveToPosition={this.props.stopMoveToPosition}
                    disableButton={!this.props.isRobotConnected || this.props.running}
                    disabled={this.props.running}
                  />
                </Grid>
                <Grid item md={12} lg={12} className={FeederScreenStyles['button-position']}>
                  <PointsPosition
                    pointName={t('position-2')}
                    holdButton={this.props.holdButton}
                    data={position2.value}
                    buttonName="InPalletPos2"
                    errorMessage={position2.error}
                    handleChangeInput={(e) => this.checkInput(e, 'width', true, true)}
                    validationInput={this.validationPosition}
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, positionIndexTwo)}
                    moveToPosition={(type: RobotSpace) => this.moveToPosition(type, positionIndexTwo, 'InPalletPos2')}
                    stopMoveToPosition={this.props.stopMoveToPosition}
                    disableButton={!this.props.isRobotConnected || this.props.running}
                    disabled={this.props.running}
                  />
                </Grid>
                <Grid
                  item
                  md={12}
                  lg={12}
                  className={`${FeederScreenStyles['button-position']} ${PalletStyles['pd-bottom-p3']}`}
                >
                  <PointsPosition
                    pointName={t('position-3')}
                    buttonName="InPalletPos3"
                    holdButton={this.props.holdButton}
                    data={position3.value}
                    errorMessage={position3.error}
                    handleChangeInput={(e) => this.checkInput(e, 'width', true, true)}
                    validationInput={this.validationPosition}
                    getCurrentPosition={(type: RobotSpace) => this.setValueToPosition(type, positionIndexThree)}
                    moveToPosition={(type: RobotSpace) => this.moveToPosition(type, positionIndexThree, 'InPalletPos3')}
                    stopMoveToPosition={this.props.stopMoveToPosition}
                    disableButton={!this.props.isRobotConnected || this.props.running}
                    disabled={this.props.running}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Grid>
        <DialogCommon
          openDialog={this.state.getPoseWarning}
          type={'getposition'}
          content={'getposition'}
          messageContent={t('WAR_007')}
          handleConfirm={() => {
            this.setState({ getPoseWarning: false });
          }}
          handleCloseDialog={() => this.setState({ getPoseWarning: false })}
        />
      </>
    );
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setInPalletValue: (action: { payload: { [key: string]: string } }) => dispatch(setInPalletValue(action.payload))
  };
}
function mapStateToProps(state: OnlyRunMapStateToProps) {
  return {
    running: state.run.running,
    inPalletInfor: state.inPallet,
    gripperType: state.deviceShortCut.gripperType
  };
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(
  withTranslation('com.dra.palletizing', { withRef: true })(InPalletScreen)
);
