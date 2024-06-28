/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { CheckPickPlaceProps } from './CheckPickPlaceScreen';
import {
  IN_PALLET_PRODUCT_PREFIX,
  MAX_COORDINATE,
  MAX_DEGREE,
  MESSAGE,
  MIN_COORDINATE,
  MIN_DEGREE,
  NUMBER_OF_DECIMAL,
  NUMBER_OF_DECIMAL_DEGREE,
  OUT_PALLET_PRODUCT_PREFIX,
  PALLET_HEIGHT
} from './consts';
import { RunProps } from './RunScreen';
import {
  ErrorType,
  InPalletInformation,
  InPalletReducer,
  OutPalletInformation,
  Point,
  ProductInformation,
  Vector
} from './type';
import {
  calculateAngleBetweenTwoVector,
  getPlaneEquation,
  isVectorZero,
  calculateCrossProduct,
  calculateEuler,
  generateProductsCoor,
  generateInFeederProducts,
  calcPosCamToPalletOut
} from './CoorCalculation';
import { ChangeEvent } from 'react';
import { ObjectInfo } from './sdk';

export const isFloatNumber = (value: string, acceptNegative = false) => {
  if (acceptNegative) {
    return new RegExp('^-?([0-9]+)?(\\.)?([0-9]+)?$').test(value);
  }
  return new RegExp('^([0-9]+)?(\\.)?([0-9]+)?$').test(value);
};

export const isIntegerNumber = (value: string, acceptNegative = false) => {
  if (acceptNegative) {
    return new RegExp('^-?[0-9]+$').test(value);
  }

  return new RegExp('^[0-9]+$').test(value);
};
export const checkNumber = (value: string, isCheckFloat = true, acceptNegative = false): boolean => {
  const isNumber = isCheckFloat ? isFloatNumber(value, acceptNegative) : isIntegerNumber(value, acceptNegative);
  return value === '' || isNumber;
};
export const parseStringToFloat = (value: string, fixed = 0): number => {
  let floatValue = value;

  const valueSplit = value.split('.');
  const acceptLength = 2;
  if (valueSplit.length === acceptLength) {
    if (valueSplit[1].length > fixed) {
      valueSplit[1] = valueSplit[1].substring(0, fixed);
    }
    floatValue = valueSplit[0].concat('.', valueSplit[1]);
  }
  return parseFloat(floatValue);
};

export const scrollToElement = (element: HTMLElement) => {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });
};
export const validateNumberInput = (
  value: string,
  min: number,
  max: number,
  decimalLength: number,
  onSuccess: (formatedValue: string) => void,
  onError: (reason: ErrorType) => void
) => {
  if (value === '') {
    onError('EMPTY');
  } else {
    const numberValue = parseStringToFloat(value, decimalLength);
    if (isNaN(numberValue) || numberValue < min || numberValue > max) {
      onError('INVALID_RANGE');
    } else {
      onSuccess(numberValue.toFixed(decimalLength));
    }
  }
};

export const showGroupMessage = (inputMsgKey: string[]): string[] => {
  const msgPriority = Object.keys(MESSAGE);
  const outputMsgSet = new Set(inputMsgKey.sort((a, b) => msgPriority.indexOf(a) - msgPriority.indexOf(b)));
  return Array.from(outputMsgSet).map((msgKey) => msgKey);
};
export const getDiffKey = (
  a: Record<string, string | boolean | number>,
  b: Record<string, string | boolean | number>
): string[] => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  const outersectionKeys = aKeys
    .filter((key) => !bKeys.includes(key))
    .concat(bKeys.filter((key) => !aKeys.includes(key)));
  const intersectionKeys = aKeys.filter((key) => bKeys.includes(key));
  const diffKey = intersectionKeys.filter((key) => a[key] !== b[key]);
  return [...outersectionKeys, ...diffKey];
};

export const isArrayIntersect = (a: string[], b: string[]): boolean => {
  return a.filter((item) => b.includes(item)).length > 0;
};
export const getCurrentTime = (): string => {
  const targetLength = 2;
  const currentTime = new Date();
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(targetLength, '0');
  const date = String(currentTime.getDate()).padStart(targetLength, '0');
  const hour = String(currentTime.getHours()).padStart(targetLength, '0');
  const minute = String(currentTime.getMinutes()).padStart(targetLength, '0');
  const second = String(currentTime.getSeconds()).padStart(targetLength, '0');
  return `${year}.${month}.${date} ${hour}.${minute}.${second}`;
};
export const getCurrentTimeClone = (): string => {
  const targetLength = 2;
  const currentTime = new Date();
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(targetLength, '0');
  const date = String(currentTime.getDate()).padStart(targetLength, '0');
  const hour = String(currentTime.getHours()).padStart(targetLength, '0');
  const minute = String(currentTime.getMinutes()).padStart(targetLength, '0');
  const second = String(currentTime.getSeconds()).padStart(targetLength, '0');
  return `${year}.${month}.${date}_${hour}.${minute}.${second}`;
};

export const calculatorSimulation = (
  productInformation: ProductInformation,
  outPalletInformation: OutPalletInformation,
  inPalletInformation: InPalletReducer
) => {
  let loadedProduct: number | null = 0;
  let totalWeight: number | null = 0;
  let totalHeight: number | null = 0;
  let volumeEfficiency: number | null = 0;
  let row = 0;
  let col = 0;
  let maxVolume: number | null = 0;
  const {
    lengthError: productLengthError,
    widthError: productWidthError,
    heightError: productHeightError,
    weightError: productWeightError,
    length: productLength,
    height: productHeight,
    width: productWidth,
    weight: productWeight
  } = productInformation;
  const {
    length: outPalletLength,
    width: outPalletWidth,
    lengthError: outPalletLengthError,
    widthError: outPalletWidthError,
    overhang,
    underhang,
    overhangError,
    underhangError,
    boxPadding,
    boxPaddingError,
    maxLayer,
    maxLayerError,
    isOverhang,
    useOverhangUnderhang
  } = outPalletInformation;

  if (productHeightError?.length || maxLayerError?.length) {
    totalHeight = null;
  } else {
    totalHeight = parseFloat(productHeight) * parseFloat(maxLayer);
  }

  if (
    outPalletLengthError?.length ||
    outPalletWidthError?.length ||
    productLengthError?.length ||
    productWidthError?.length ||
    boxPaddingError?.length ||
    maxLayerError?.length ||
    productHeightError?.length ||
    (useOverhangUnderhang && ((overhangError?.length && isOverhang) || (underhangError?.length && !isOverhang)))
  ) {
    loadedProduct = null;
  } else {
    if (!useOverhangUnderhang) {
      col = Math.floor(
        (parseFloat(outPalletLength) + parseFloat(boxPadding)) / (parseFloat(productLength) + parseFloat(boxPadding))
      );
      row = Math.floor(
        (parseFloat(outPalletWidth) + parseFloat(boxPadding)) / (parseFloat(productWidth) + parseFloat(boxPadding))
      );
      loadedProduct = row * col * parseFloat(maxLayer);
    } else {
      const double = 2;
      if (isOverhang) {
        col = Math.floor(
          (parseFloat(outPalletLength) + parseFloat(boxPadding) + Number(overhang) * double) /
            (parseFloat(productLength) + parseFloat(boxPadding))
        );
        row = Math.floor(
          (parseFloat(outPalletWidth) + parseFloat(boxPadding) + Number(overhang) * double) /
            (parseFloat(productWidth) + parseFloat(boxPadding))
        );
        loadedProduct = row * col * parseFloat(maxLayer);
      } else {
        col = Math.floor(
          (parseFloat(outPalletLength) + parseFloat(boxPadding) - Number(underhang) * double) /
            (parseFloat(productLength) + parseFloat(boxPadding))
        );
        row = Math.floor(
          (parseFloat(outPalletWidth) + parseFloat(boxPadding) - Number(underhang) * double) /
            (parseFloat(productWidth) + parseFloat(boxPadding))
        );
        if (row <= 0 || col <= 0) {
          loadedProduct = null;
        } else {
          loadedProduct = row * col * parseFloat(maxLayer);
        }
      }
    }
    // Convert product follow by max product in pallet
    if (inPalletInformation.rowError || inPalletInformation.columnError || inPalletInformation.layerError) {
      loadedProduct = null;
    } else {
      const inPalletLoadProduct =
        Number(inPalletInformation.inPalletRow) *
        Number(inPalletInformation.inPalletColumn) *
        Number(inPalletInformation.inPalletLayer);
      if (loadedProduct !== null && loadedProduct > inPalletLoadProduct) {
        loadedProduct = inPalletLoadProduct;
      }
    }
  }

  if (totalHeight === null) {
    maxVolume = null;
  } else {
    if (!useOverhangUnderhang) {
      maxVolume = parseFloat(outPalletWidth) * parseFloat(outPalletLength) * totalHeight;
    } else {
      const double = 2;
      if (isOverhang) {
        maxVolume =
          (parseFloat(outPalletWidth) + Number(overhang) * double) *
          (parseFloat(outPalletLength) + Number(overhang) * double) *
          totalHeight;
      } else {
        maxVolume =
          (parseFloat(outPalletWidth) - Number(underhang) * double) *
          (parseFloat(outPalletLength) - Number(underhang) * double) *
          totalHeight;
      }
    }
  }

  if (productWeightError?.length || loadedProduct === null) {
    totalWeight = null;
  } else {
    totalWeight = loadedProduct * parseFloat(productWeight);
  }

  if (loadedProduct !== null && loadedProduct > 0 && maxVolume !== null) {
    const ONE_HUNDRED_PERCENT = 100;
    const filledVolume =
      parseFloat(productWidth) * parseFloat(productHeight) * parseFloat(productLength) * loadedProduct;
    volumeEfficiency = (filledVolume / maxVolume) * ONE_HUNDRED_PERCENT;
  } else {
    volumeEfficiency = null;
  }
  const fixedNumber = 3;
  const fixedPercent = 2;
  return {
    loadedProduct: loadedProduct === null || isNaN(loadedProduct) ? 'N/A' : loadedProduct.toString(),
    totalWeight:
      totalWeight === null || isNaN(totalWeight)
        ? 'N/A'
        : parseStringToFloat(totalWeight.toString(), fixedNumber).toFixed(fixedNumber),
    maxLayer: isNaN(parseFloat(maxLayer || '')) || !!maxLayerError.length ? 'N/A' : maxLayer,
    totalHeight:
      totalHeight === null || isNaN(totalHeight)
        ? 'N/A'
        : parseStringToFloat(totalHeight.toString(), fixedNumber).toFixed(fixedNumber),
    volumeEfficiency:
      volumeEfficiency === null || isNaN(volumeEfficiency)
        ? 'N/A'
        : parseStringToFloat(volumeEfficiency.toString(), fixedPercent).toFixed(fixedPercent),
    row: typeof row === 'number' ? Math.floor(row) : row,
    col: typeof col === 'number' ? Math.floor(col) : col
  };
};

export const shouldReload3D = (
  prevProps: CheckPickPlaceProps | RunProps,
  currentProps: CheckPickPlaceProps | RunProps
) => {
  type InPalletKeyType =
    | 'inPalletWidth'
    | 'inPalletRow'
    | 'inPalletLength'
    | 'inPalletColumn'
    | 'inPalletLayer'
    | 'posX1'
    | 'posY1'
    | 'posZ1'
    | 'posA1'
    | 'posB1'
    | 'posC1'
    | 'posX2'
    | 'posY2'
    | 'posZ2'
    | 'posA2'
    | 'posB2'
    | 'posC2'
    | 'posX3'
    | 'posY3'
    | 'posZ3'
    | 'posA3'
    | 'posB3'
    | 'posC3'
    | 'posX4'
    | 'posY4'
    | 'posZ4'
    | 'posA4'
    | 'posB4'
    | 'posC4';
  type OutPalletType =
    | 'length'
    | 'width'
    | 'overhang'
    | 'underhang'
    | 'boxPadding'
    | 'maxLayer'
    | 'useOverhangUnderhang'
    | 'isOverhang';
  type CalibrateType =
    | 'calibPosX'
    | 'calibPosY'
    | 'calibPosZ'
    | 'calibOptX1'
    | 'calibOptY1'
    | 'calibOptZ1'
    | 'calibOptX2'
    | 'calibOptY2'
    | 'calibOptZ2'
    | 'isDisplayOpt1'
    | 'isDisplayOpt2';
  type ProductType = 'length' | 'width' | 'height';
  let shouldReload3DVariable = false;
  const inPalletInformationAttribute: InPalletKeyType[] = [
    'inPalletWidth',
    'inPalletRow',
    'inPalletLength',
    'inPalletColumn',
    'inPalletLayer',
    'posX1',
    'posY1',
    'posZ1',
    'posA1',
    'posB1',
    'posC1',
    'posX2',
    'posY2',
    'posZ2',
    'posA2',
    'posB2',
    'posC2',
    'posX3',
    'posY3',
    'posZ3',
    'posA3',
    'posB3',
    'posC3',
    'posX4',
    'posY4',
    'posZ4',
    'posA4',
    'posB4',
    'posC4'
  ];
  const outPalletAttribute: OutPalletType[] = [
    'length',
    'width',
    'overhang',
    'underhang',
    'boxPadding',
    'maxLayer',
    'useOverhangUnderhang',
    'isOverhang'
  ];
  const calibrateAttribute: CalibrateType[] = [
    'calibPosX',
    'calibPosY',
    'calibPosZ',
    'calibOptX1',
    'calibOptY1',
    'calibOptZ1',
    'calibOptX2',
    'calibOptY2',
    'calibOptZ2',
    'isDisplayOpt1',
    'isDisplayOpt2'
  ];
  const productAttribute: ProductType[] = ['length', 'width', 'height'];
  shouldReload3DVariable = inPalletInformationAttribute.some((item: InPalletKeyType) => {
    return prevProps.inPalletInformation[item] !== currentProps.inPalletInformation[item];
  });
  shouldReload3DVariable =
    shouldReload3DVariable ||
    outPalletAttribute.some((item: OutPalletType) => {
      return prevProps.outPalletInformation[item] !== currentProps.outPalletInformation[item];
    });
  shouldReload3DVariable =
    shouldReload3DVariable ||
    calibrateAttribute.some((item: CalibrateType) => {
      return prevProps.calibrationInformation[item] !== currentProps.calibrationInformation[item];
    });
  shouldReload3DVariable =
    shouldReload3DVariable ||
    productAttribute.some((item: ProductType) => {
      return prevProps.productInformation[item] !== currentProps.productInformation[item];
    });
  return shouldReload3DVariable;
};

export const formatDataDisplay = (data: number, isTcpPosition = false, isCommaFormat = true) => {
  const minData = -9999.999;
  const maxData = 9999.999;
  const paramTrunc = 1000;
  const fixedThree = 3;
  const fixedTwo = 2;
  let validateData = data;
  if (isTcpPosition && (validateData > maxData || validateData < minData)) {
    validateData = Math.trunc(data * paramTrunc) / paramTrunc;
  }
  let posValue = isTcpPosition ? validateData.toFixed(fixedThree) : validateData.toFixed(fixedTwo);
  if (isCommaFormat) {
    posValue = posValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }
  if (posValue === '-0.00') {
    return '0.00';
  }
  if (posValue === '-0.000') {
    return '0.000';
  }
  return posValue;
};

/**
 * This function for check error when error is not empty
 * @param params is Object has key params, properties are keys need check
 * @returns {boolean}
 */
export const checkError = (params: Record<string, string>): boolean => {
  let isError = false;
  Object.values(params).forEach((el: string) => {
    if (el.length) {
      isError = true;
    }
  });
  return isError;
};

/**
 * This function for check error when value wrong on change event
 * @param params is Object has key params, properties are keys need check
 * @returns {boolean}
 */
export const checkErrorOnChange = (params: { [key: string]: string | number | null }): boolean => {
  let isError = false;
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null) {
      if (
        (key.includes('X') || key.includes('Y') || key.includes('Z')) &&
        !(!isNaN(Number(value)) && Number(value) >= MIN_COORDINATE && Number(value) <= MAX_COORDINATE)
      ) {
        isError = true;
      }
      if (
        (key.includes('A') || key.includes('B') || key.includes('C')) &&
        !(!isNaN(Number(value)) && Number(value) >= MIN_DEGREE && Number(value) <= MAX_DEGREE)
      ) {
        isError = true;
      }
    }
  });
  return isError;
};

/**
 * This function for check value when value is empty
 * @param params is Object has key is params, properties are keys need check
 * @returns {boolean}
 */
export const checkEmpty = (params: Record<string, string | number | null>): boolean => {
  let isEmpty = false;
  Object.values(params).forEach((el: string | number | null) => {
    if (el === '' || !el?.toString()) {
      isEmpty = true;
    }
  });
  return isEmpty;
};

/**
 * This function handle check value before moving position
 * @param params is Object need check
 * @returns {boolean}
 */
export const checkDataBeforeMoving = (params: Record<string, string | number | null>): boolean => {
  let canMove = true;
  for (const [key, value] of Object.entries(params)) {
    if (key.toUpperCase() === 'X' || key.toUpperCase() === 'Y' || key.toUpperCase() === 'Z') {
      if (!(Number(value) >= MIN_COORDINATE && Number(value) <= MAX_COORDINATE)) {
        canMove = false;
        break;
      }
    } else if (!(Number(value) >= MIN_DEGREE && Number(value) <= MAX_DEGREE)) {
      canMove = false;
      break;
    }
  }
  return canMove;
};

export const checkErrorOnInPallet = (params: { [key: string]: string | number | null }): boolean => {
  let isError = false;
  Object.entries(params).forEach(([key, value]) => {
    if (key.includes('Error')) {
      if (value !== '') {
        isError = true;
      }
    }
  });
  return isError;
};

export const checkErrorOnCalib = (params: { [key: string]: string | number | null }): boolean => {
  let isError = false;
  Object.entries(params).forEach(([key, value]) => {
    if (key.includes('Msg')) {
      if (value !== '') {
        isError = true;
      }
    }
  });
  return isError;
};

export const checkErrorOnProductInfo = (params: { [key: string]: string | number | null }): boolean => {
  let isError = false;
  Object.entries(params).forEach(([key, value]) => {
    if (!key.includes('weightError') && key.includes('Error') && value !== '') {
      isError = true;
    }
  });
  return isError;
};

// HaoLA3 - DCIDOOSANDRP-6456 - 10/6/2022 - start
/**
 * This function will validate the InPalletInformation
 */
export const isValidInPalletInfo = (info: InPalletInformation) => {
  // if any *Error key is not empty -> return false
  for (const key in info) {
    if (/Error/.test(key) && info[key as keyof InPalletInformation] !== '') {
      return false;
    }
  }
  return true;
};

// HaoLA3 - DCIDOOSANDRP-6456 - 10/6/2022 - end

export const isKeyForError = (key: string) => {
  if (/error/.test(key) || /Error/.test(key)) {
    return true;
  }
  return false;
};
export const generateOutFeederPallet = (
  productInformation: any,
  inPalletInformation: any,
  outPalletInformation: OutPalletInformation,
  calibrationInformation: any
) => {
  const originPoint = {
    x: Number(calibrationInformation.calibPosX),
    y: Number(calibrationInformation.calibPosY),
    z: Number(calibrationInformation.calibPosZ)
  };
  const point1 = {
    x: Number(calibrationInformation.calibOptX1),
    y: Number(calibrationInformation.calibOptY1),
    z: Number(calibrationInformation.calibOptZ1)
  };
  const point2 = {
    x: Number(calibrationInformation.calibOptX2),
    y: Number(calibrationInformation.calibOptY2),
    z: Number(calibrationInformation.calibOptZ2)
  };
  const productDimmension = {
    height: Number(productInformation.height),
    width: Number(productInformation.width),
    length: Number(productInformation.length)
  };
  const { loadedProduct, row, col } = calculatorSimulation(
    productInformation,
    outPalletInformation,
    inPalletInformation
  );
  const euler = calculateEuler(originPoint, point1, point2);
  if (euler !== null) {
    const productCoor = generateProductsCoor(
      originPoint,
      point1,
      point2,
      productDimmension,
      row,
      col,
      Number(outPalletInformation.maxLayer),
      Number(outPalletInformation.boxPadding),
      Number(outPalletInformation.boxPadding),
      outPalletInformation.useOverhangUnderhang
        ? outPalletInformation.isOverhang
          ? -Number(outPalletInformation.overhang)
          : Number(outPalletInformation.underhang)
        : 0
    );
    const productCoorData: { [key: string]: ObjectInfo } = {
      'out-pallet': {
        type: 'pallet',
        dimmension: {
          height: PALLET_HEIGHT,
          length: Number(outPalletInformation.length),
          width: Number(outPalletInformation.width)
        },
        position: originPoint,
        rotation: euler,
        margin: outPalletInformation.useOverhangUnderhang
          ? outPalletInformation.isOverhang
            ? Number(outPalletInformation.overhang)
            : -Number(outPalletInformation.underhang)
          : 0
      }
    };
    const loadedProductNumber = Number(loadedProduct);
    if (!Number.isNaN(loadedProductNumber)) {
      productCoor.forEach((point, index) => {
        if (index < loadedProductNumber) {
          productCoorData[`${OUT_PALLET_PRODUCT_PREFIX}${index + 1}`] = {
            type: 'product',
            dimmension: productDimmension,
            ...point
          };
        }
      });
    }
    return productCoorData;
  }
  return {};
};

export const generateInFeederPallet = (productInformation: any, inPalletInformation: any) => {
  const point1 = {
    x: Number(inPalletInformation.posX1),
    y: Number(inPalletInformation.posY1),
    z: Number(inPalletInformation.posZ1)
  };
  const point2 = {
    x: Number(inPalletInformation.posX2),
    y: Number(inPalletInformation.posY2),
    z: Number(inPalletInformation.posZ2)
  };
  const point3 = {
    x: Number(inPalletInformation.posX3),
    y: Number(inPalletInformation.posY3),
    z: Number(inPalletInformation.posZ3)
  };
  const productDimmension = {
    height: Number(productInformation.height),
    width: Number(productInformation.width),
    length: Number(productInformation.length)
  };
  const palletDimmension = {
    height: PALLET_HEIGHT,
    length: Number(inPalletInformation.inPalletLength),
    width: Number(inPalletInformation.inPalletWidth)
  };
  const inFeederData = generateInFeederProducts(
    point1,
    point2,
    point3,
    productDimmension,
    Number(inPalletInformation.inPalletRow),
    Number(inPalletInformation.inPalletColumn),
    Number(inPalletInformation.inPalletLayer),
    palletDimmension
  );
  if (inFeederData === null) {
    return {};
  }
  const productCoorData: { [key: string]: ObjectInfo } = {
    'in-pallet': {
      type: 'pallet',
      dimmension: palletDimmension,
      ...inFeederData.palletCoor
    }
  };
  inFeederData.productCoors.forEach((point, index) => {
    productCoorData[`${IN_PALLET_PRODUCT_PREFIX}${index + 1}`] = {
      type: 'product',
      dimmension: productDimmension,
      ...point
    };
  });
  return productCoorData;
};

export const generateCamPos = (outPalletInformation: any, calibrationInformation: any) => {
  const originPoint = {
    x: Number(calibrationInformation.calibPosX),
    y: Number(calibrationInformation.calibPosY),
    z: Number(calibrationInformation.calibPosZ)
  };
  const point1 = {
    x: Number(calibrationInformation.calibOptX1),
    y: Number(calibrationInformation.calibOptY1),
    z: Number(calibrationInformation.calibOptZ1)
  };
  const point2 = {
    x: Number(calibrationInformation.calibOptX2),
    y: Number(calibrationInformation.calibOptY2),
    z: Number(calibrationInformation.calibOptZ2)
  };

  const palletDimmension = {
    height: PALLET_HEIGHT,
    length: Number(outPalletInformation.length),
    width: Number(outPalletInformation.width)
  };

  return calcPosCamToPalletOut(originPoint, point1, point2, palletDimmension);
};
/**
 * Check two point is duplicate
 */
export const isDuplicateTwoPoint = (point1: Point, point2: Point): boolean => {
  return !(point1.x !== point2.x || point1.y !== point2.y || point1.z !== point2.z);
};

/**
 * Check three point is duplicate
 */
export const isDuplicateThreePoint = (point1: Point, point2: Point, point3: Point): boolean => {
  return isDuplicateTwoPoint(point1, point2) && isDuplicateTwoPoint(point2, point3);
};

/**
 * Check three point has one plane
 */
export const isPlane = (point1: Point, point2: Point, point3: Point): boolean => {
  return getPlaneEquation(point1, point2, point3) !== null;
};
export const calcAngle = (originPoint: Point, point1: Point, point2: Point): number => {
  const vector1: Vector = {
    x: point1.x - originPoint.x,
    y: point1.y - originPoint.y,
    z: point1.z - originPoint.z
  };
  const vector2: Vector = {
    x: point2.x - originPoint.x,
    y: point2.y - originPoint.y,
    z: point2.z - originPoint.z
  };
  return calculateAngleBetweenTwoVector(vector1, vector2);
};
/**
 * check anngle between 85 degree to 95 degree
 */
export const acceptRightAngle = (point1: Point, point2: Point, point3: Point): boolean => {
  const MIN_ANGLE = 85;
  const MAX_ANGLE = 95;
  const angle1 = calcAngle(point1, point2, point3);
  const angle2 = calcAngle(point2, point1, point3);
  const angle3 = calcAngle(point3, point1, point2);

  if (angle1 >= MIN_ANGLE && angle1 <= MAX_ANGLE) {
    return true;
  } else if (angle2 >= MIN_ANGLE && angle2 <= MAX_ANGLE) {
    return true;
  } else if (angle3 >= MIN_ANGLE && angle3 <= MAX_ANGLE) {
    return true;
  } else {
    return false;
  }
};

/**
 * This function handle validation position
 * @param event is React Event
 * @returns {string} has error
 * @return {object} has passed
 */
export const validationPosition = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
): string | { [key: string]: string } => {
  const { value, name } = event.target;

  let decimalNumber, formatValue;

  /** check value empty */
  if (value === '') {
    return 'ERR_014';
  }
  switch (true) {
    case name.toUpperCase().includes('X'):
    case name.toUpperCase().includes('Y'):
    case name.toUpperCase().includes('Z'): {
      decimalNumber = NUMBER_OF_DECIMAL;
      formatValue = parseStringToFloat(`${value}`, NUMBER_OF_DECIMAL);
      if (!(!isNaN(formatValue) && formatValue >= MIN_COORDINATE && formatValue <= MAX_COORDINATE)) {
        return 'ERR_013';
      }
      break;
    }
    case name.toUpperCase().includes('A'):
    case name.toUpperCase().includes('B'):
    case name.toUpperCase().includes('C'): {
      decimalNumber = NUMBER_OF_DECIMAL_DEGREE;
      formatValue = parseStringToFloat(`${value}`, NUMBER_OF_DECIMAL_DEGREE);
      if (!(!isNaN(formatValue) && formatValue >= MIN_DEGREE && formatValue <= MAX_DEGREE)) {
        return 'ERR_005';
      }
      break;
    }
    case name.toUpperCase().includes('J'): {
      decimalNumber = NUMBER_OF_DECIMAL_DEGREE;
      formatValue = parseStringToFloat(`${value}`, NUMBER_OF_DECIMAL_DEGREE);
      if (!(!isNaN(formatValue) && formatValue >= MIN_DEGREE && formatValue <= MAX_DEGREE)) {
        return 'ERR_015';
      }
      break;
    }
    default:
      break;
  }
  return { value: parseStringToFloat(`${value}`, decimalNumber).toFixed(decimalNumber) };
};

export const isDuplicatePoint = (point1: Point | null, point2: Point | null): boolean => {
  if (point1 !== null && point2 !== null && point1.x === point2.x && point1.y === point2.y && point1.z === point2.z) {
    return true;
  }
  return false;
};

export const generateVector = (point1: Point | null, point2: Point | null): Vector | null => {
  if (point1 !== null && point2 !== null) {
    return {
      x: point2.x - point1.x,
      y: point2.y - point1.y,
      z: point2.z - point1.z
    };
  }
  return null;
};

export const checkSameLine = (point1: Point | null, point2: Point | null, point3: Point | null): boolean | null => {
  if (point1 !== null && point2 !== null && point3 !== null) {
    const firstVector: Vector = {
      x: point2.x - point1.x,
      y: point2.y - point1.y,
      z: point2.z - point1.z
    };
    const secondVector: Vector = {
      x: point3.x - point1.x,
      y: point3.y - point1.y,
      z: point3.z - point1.z
    };
    const crossProduct: Vector = calculateCrossProduct(firstVector, secondVector);
    if (isVectorZero(crossProduct)) {
      return true;
    }
  }
  return false;
};
export const deepCompareArrayEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  } else {
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
};
export const deepCompareDictEqual = (dict1: object, dict2: object): boolean => {
  const dictKeys1 = Object.keys(dict1);
  const dictKeys2 = Object.keys(dict2);
  if (!deepCompareArrayEqual(dictKeys1, dictKeys2)) {
    return false;
  } else {
    for (const element of dictKeys1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignored
      if (!deepCompareEqual(dict1[element], dict2[element])) {
        return false;
      }
    }
    return true;
  }
};
export const deepCompareEqual = (obj1: any, obj2: any): boolean => {
  const objType1 = typeof obj1;
  const objType2 = typeof obj2;
  if (objType1 !== objType2) {
    return false;
  }
  if (['string', 'boolean', 'number', 'undefined'].includes(objType1)) {
    return obj1 === obj2;
  }
  if (objType1 === 'object') {
    if (obj1 === null && obj2 === null) {
      return true;
    }
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return deepCompareArrayEqual(obj1, obj2);
    }
    if (obj1.constructor === Object && obj2.constructor === Object) {
      return deepCompareDictEqual(obj1, obj2);
    }
  }
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const handleOpenMenu = (event: any, id: string | undefined) => {
  if (!id || !document) {
    return;
  }
  const html = document.documentElement;
  const clientY = event.clientY;
  const footerHeight = 48;
  const bonusPoint = 20;
  const offsetsOfSelectId: any = document.getElementById(`${id}`);
  if (offsetsOfSelectId) {
    const positionOfSelectId = offsetsOfSelectId.getBoundingClientRect();
    setTimeout(() => {
      const paperDoc = document.getElementsByClassName('MuiMenu-paper') as HTMLCollectionOf<HTMLElement>;
      if (paperDoc && paperDoc[0]) {
        let cusTop = 0;
        const offsetHeight = paperDoc[0].offsetHeight;
        const overHeight = clientY + offsetHeight + footerHeight + bonusPoint - html.clientHeight;
        if (overHeight > 0) {
          cusTop = positionOfSelectId.top - offsetHeight - 2;
          paperDoc[0].style.top = `${cusTop}px`;
        }
      }
    }, 20);
  }
};
