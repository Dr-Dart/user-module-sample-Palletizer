/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Context, SixNumArray } from 'dart-api';
import { EulerType, IMathLibrary} from 'dart-api/dart-api-math';
import { Coordinate } from './consts';

interface Point {
  x: number;
  y: number;
  z: number;
}
interface Vector {
  x: number;
  y: number;
  z: number;
}
interface EulerAngle {
  a: number;
  b: number;
  c: number;
}
interface Coordiate {
  position: Point;
  rotation: EulerAngle;
}
/**
 * Plane equation: a * x + b * y + c * z + d = 0, with x, y, z is variable and a, b, c & d is constants
 */
interface PlaneEquation {
  a: number;
  b: number;
  c: number;
  d: number;
}
interface ProductDimmension {
  height: number;
  width: number;
  length: number;
}
interface PalletDimmension {
  height: number;
  width: number;
  length: number;
}

interface InFeederObject {
  productCoors: Coordiate[];
  palletCoor: Coordiate;
}

const vectorOz: Vector = {
  x: 0,
  y: 0,
  z: 1
};
const vectorOy: Vector = {
  x: 0,
  y: 1,
  z: 0
};

export const calculateCrossProduct = (vector1: Vector, vector2: Vector): Vector => {
  return {
    x: vector1.y * vector2.z - vector1.z * vector2.y,
    y: vector1.z * vector2.x - vector1.x * vector2.z,
    z: vector1.x * vector2.y - vector1.y * vector2.x
  };
};
export const getPlaneEquation = (point1: Point, point2: Point, point3: Point): PlaneEquation | null => {
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
    return null;
  }
  return {
    a: crossProduct.x,
    b: crossProduct.y,
    c: crossProduct.z,
    d: -(crossProduct.x * point1.x + crossProduct.y * point1.y + crossProduct.z * point1.z)
  };
};

const reverseCoor = (origin: Point, point1: Point, point2: Point) => {
  const SQUARE = 2;
  let point1Vector = {
    x: point1.x - origin.x,
    y: point1.y - origin.y,
    z: point1.z - origin.z
  };
  let point2Vector = {
    x: point2.x - origin.x,
    y: point2.y - origin.y,
    z: point2.z - origin.z
  };
  const palletPlaneCrossProduct = calculateCrossProduct(point1Vector, point2Vector);
  if (palletPlaneCrossProduct.z < 0) {
    palletPlaneCrossProduct.x *= -1;
    palletPlaneCrossProduct.y *= -1;
    palletPlaneCrossProduct.z *= -1;
    const temp = point1Vector;
    point1Vector = point2Vector;
    point2Vector = temp;
    const tempPoint = point2;
    point2 = point1;
    point1 = tempPoint;
  }
  // make point2Vector perpendicular with point1Vector
  point2Vector = calculateCrossProduct(palletPlaneCrossProduct, point1Vector);

  const point2VectorLength = Math.sqrt(
    Math.pow(point2.x - origin.x, SQUARE) +
      Math.pow(point2.y - origin.y, SQUARE) +
      Math.pow(point2.z - origin.z, SQUARE)
  );
  point2 = translatePoint(origin, point2Vector, point2VectorLength);

  return { point1Vector, point2Vector, palletPlaneCrossProduct, point1, point2 };
};

/**
 * Calculate signed angle between 2 vector using right hand rule
 * @param vector1 Vector 1 will be pointer direction in right hand rule
 * @param vector2 Vector 2 will be palm direction in right hand rule
 * @param directionVector thumb direction right hand rule
 * @returns Signed angle in degree. Always positive if directionVector is not specified
 */
export const calculateAngleBetweenTwoVector = (
  vector1: Vector,
  vector2: Vector,
  directionVector: Vector | undefined = undefined
): number => {
  const SQUARE = 2;
  const HAFT_CIRCLE = 180;
  const cos =
    (vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z) /
    (Math.sqrt(Math.pow(vector1.x, SQUARE) + Math.pow(vector1.y, SQUARE) + Math.pow(vector1.z, SQUARE)) *
      Math.sqrt(Math.pow(vector2.x, SQUARE) + Math.pow(vector2.y, SQUARE) + Math.pow(vector2.z, SQUARE)));
  const radAngle = Math.acos(cos);
  let degreeAngle = Math.round((radAngle * HAFT_CIRCLE) / Math.PI);
  const crossProduct = calculateCrossProduct(vector1, vector2);
  if (
    directionVector &&
    crossProduct.x * directionVector.x + crossProduct.y * directionVector.y + crossProduct.z * directionVector.z < 0
  ) {
    degreeAngle *= -1;
  }
  return degreeAngle;
};
export const isVectorZero = (vector: Vector): boolean => {
  return vector.x === 0 && vector.y === 0 && vector.z === 0;
};
const calculateEuler = (origin: Point, point1: Point, point2: Point): EulerAngle | null => {
  const palletPlane = getPlaneEquation(origin, point1, point2);
  if (palletPlane == null) {
    return null;
  }
  /*
    Knot vector is a vector which have root is origin point and
     lie on intersection line between pallet plane and horizontal plane
    Knot vector is perpendicular with cross product of pallet plane and horizontal plane
    There for knot vector is cross product of 2 cross products of pallet plane and horizontal plane
   */

  const { point2Vector, palletPlaneCrossProduct } = reverseCoor(origin, point1, point2);

  const knotVector = calculateCrossProduct(vectorOz, palletPlaneCrossProduct);

  if (isVectorZero(knotVector)) {
    return {
      a: calculateAngleBetweenTwoVector(vectorOy, point2Vector, vectorOz),
      b: 0,
      c: 0
    };
  }
  return {
    a: calculateAngleBetweenTwoVector(vectorOy, knotVector, vectorOz),
    b: calculateAngleBetweenTwoVector(vectorOz, palletPlaneCrossProduct, knotVector),
    c: calculateAngleBetweenTwoVector(knotVector, point2Vector, palletPlaneCrossProduct)
  };
};
const SQUARE = 2;
const translatePoint = (point: Point, direction: Vector, distance: number) => {
  const vectorLength = Math.sqrt(
    Math.pow(direction.x, SQUARE) + Math.pow(direction.y, SQUARE) + Math.pow(direction.z, SQUARE)
  );
  const ratio = distance / vectorLength;
  const vectorToTranslate = {
    x: direction.x * ratio,
    y: direction.y * ratio,
    z: direction.z * ratio
  };
  const FIXED_NUMBER = 3;
  return {
    x: Number((vectorToTranslate.x + point.x).toFixed(FIXED_NUMBER)),
    y: Number((vectorToTranslate.y + point.y).toFixed(FIXED_NUMBER)),
    z: Number((vectorToTranslate.z + point.z).toFixed(FIXED_NUMBER))
  };
};
/**
 * Generate product TCP coordinate.
 * @param origin Pallet origin point. Always pallet's edge
 * @param point1 Pallet point 1
 * @param point2 Pallet point 2
 * @param productDimmension Product dimmesion
 * @param row Number of product rows
 * @param column Number of product columns
 * @param layer Number of product layer
 * @param palletPadding Pallet overhang/underhang value. Negative when overhang, Positive when underhang
 */
const generateProductsCoor = (
  origin: Point,
  point1: Point,
  point2: Point,
  productDimmension: ProductDimmension,
  row: number,
  column: number,
  layer: number,
  widthPadding: number,
  lengthPadding: number,
  palletPadding?: number
): Coordiate[] => {
  const { point1Vector, point2Vector, palletPlaneCrossProduct } = reverseCoor(origin, point1, point2);
  const euler = calculateEuler(origin, point1, point2);
  const productTCPs: {
    position: Point;
    rotation: EulerAngle;
  }[] = [];
  if (euler === null) {
    return productTCPs;
  }

  // Case euler !== null
  for (let l = 0; l < layer; l++) {
    let c = 0;
    for (let r = 0; r < row; r++) {
      c = c === column ? column - 1 : 0;
      while ((c < column && r % 2 === 0) || (c >= 0 && r % 2)) {
        let productTCP = {
          x: origin.x,
          y: origin.y,
          z: origin.z
        };
        productTCP = translatePoint(productTCP, palletPlaneCrossProduct, (l + 1) * productDimmension.height);
        productTCP = translatePoint(
          productTCP,
          point1Vector,
          r * (productDimmension.width + widthPadding) + productDimmension.width / 2 + (palletPadding || 0)
        );
        productTCP = translatePoint(
          productTCP,
          point2Vector,
          c * (productDimmension.length + lengthPadding) + productDimmension.length / 2 + (palletPadding || 0)
        );
        productTCPs.push({
          position: productTCP,
          rotation: euler
        });
        if (r % 2) {
          c--;
        } else {
          c++;
        }
      }
    }
  }

  return productTCPs;
};
const generateInFeederProducts = (
  point1: Point,
  point2: Point,
  point3: Point,
  productDimmension: ProductDimmension,
  row: number,
  column: number,
  layer: number,
  palletDimmension: PalletDimmension
): InFeederObject | null => {
  let optPoint1: Point = point2;
  let optPoint2: Point = point3;
  const {
    point1Vector,
    point2Vector,
    palletPlaneCrossProduct,
    point1: pointOnX,
    point2: pointOnY
  } = reverseCoor(point1, optPoint1, optPoint2);
  const euler = calculateEuler(point1, optPoint1, optPoint2);
  if (euler === null) {
    return null;
  }
  const point1VectorLength = Math.sqrt(
    Math.pow(pointOnX.x - point1.x, 2) + Math.pow(pointOnX.y - point1.y, 2) + Math.pow(pointOnX.z - point1.z, 2)
  );
  const widthPadding = row > 1 ? point1VectorLength / (row - 1) - productDimmension.width : 0;

  const point2VectorLength = Math.sqrt(
    Math.pow(pointOnY.x - point1.x, 2) + Math.pow(pointOnY.y - point1.y, 2) + Math.pow(pointOnY.z - point1.z, 2)
  );
  const lengthPadding = column > 1 ? point2VectorLength / (column - 1) - productDimmension.length : 0;

  const productTopCenter = {
    x: (pointOnX.x + pointOnY.x) / 2,
    y: (pointOnX.y + pointOnY.y) / 2,
    z: (pointOnX.z + pointOnY.z) / 2
  };

  const productBotCenter = translatePoint(
    productTopCenter,
    palletPlaneCrossProduct,
    -(productDimmension.height * layer)
  );

  const centerLength = translatePoint(productBotCenter, point2Vector, -palletDimmension.length / 2);
  const palletOriginPoint = translatePoint(centerLength, point1Vector, -palletDimmension.width / 2);

  point1 = translatePoint(
    translatePoint(
      translatePoint(point1, palletPlaneCrossProduct, -(productDimmension.height * layer)),
      point1Vector,
      -productDimmension.width / 2
    ),
    point2Vector,
    -productDimmension.length / 2
  );

  optPoint1 = translatePoint(
    translatePoint(
      translatePoint(optPoint1, palletPlaneCrossProduct, -(productDimmension.height * layer)),
      point1Vector,
      -productDimmension.width / 2
    ),
    point2Vector,
    -productDimmension.length / 2
  );

  optPoint2 = translatePoint(
    translatePoint(
      translatePoint(optPoint2, palletPlaneCrossProduct, -(productDimmension.height * layer)),
      point1Vector,
      -productDimmension.width / 2
    ),
    point2Vector,
    -productDimmension.length / 2
  );

  const proCoors = generateProductsCoor(
    point1,
    optPoint1,
    optPoint2,
    productDimmension,
    row,
    column,
    layer,
    widthPadding,
    lengthPadding
  );

  return {
    productCoors: proCoors,
    palletCoor: {
      position: palletOriginPoint,
      rotation: euler
    }
  };
};

const calcPosCamToPalletOut = (
  origin: Point,
  point1: Point,
  point2: Point,
  palletDimmension: PalletDimmension
): Point => {
  const { point1Vector, point2Vector } = reverseCoor(origin, point1, point2);

  const palletCenter = translatePoint(
    translatePoint(origin, point1Vector, palletDimmension.width / 2),
    point2Vector,
    palletDimmension.length / 2
  );

  const vectorToTranslateCam = {
    x: origin.x - palletCenter.x,
    y: origin.y - palletCenter.y,
    z: origin.z - palletCenter.z
  };

  const camPosition = translatePoint(origin, vectorToTranslateCam, 1100);
  return camPosition;
};

const calcAppRetPos = (context: Context, productPos: Coordinate, distance: Vector) => {
  const baseToPickPlace = {
    pose: [
      Number(productPos.x),
      Number(productPos.y),
      Number(productPos.z),
      Number(productPos.a),
      Number(productPos.b),
      Number(productPos.c)
    ] as SixNumArray,
    type: EulerType.ZYZ
  };

  const mathLib = context.getSystemLibrary(Context.MATH_LIBRARY) as IMathLibrary;
  const baseToPickPlaceMat = mathLib.eulerZYZToMatrix(baseToPickPlace);

  const appRetOffset = {
    pose: [
      distance.x,
      distance.y,
      -distance.z,
      0, 0, 0
    ] as SixNumArray,
    type: EulerType.ZYZ
  };
  const appRetOffsetMat = mathLib.eulerZYZToMatrix(appRetOffset);

  if (baseToPickPlaceMat && appRetOffsetMat) {
    const baseToAppRetPosMat = mathLib.matMul(baseToPickPlaceMat, appRetOffsetMat);
    const baseToAppRet = mathLib.matrixToEulerZYZ(baseToAppRetPosMat, true);
    if (baseToAppRet) {
      return {
        x: baseToAppRet.pose[0],
        y: baseToAppRet.pose[1],
        z: baseToAppRet.pose[2],
        a: baseToAppRet.pose[3],
        b: baseToAppRet.pose[4],
        c: baseToAppRet.pose[5]
      };
    }
  }
  return {};
};

const calcAppRetPosArr = (context: Context, productPosArr: Coordinate[], distance: Vector) => {
  const result = productPosArr.map((productPos) => {
    return calcAppRetPos(context, productPos, distance);
  });
  return result;
};

export {
  calculateEuler,
  generateProductsCoor,
  generateInFeederProducts,
  calcPosCamToPalletOut,
  calcAppRetPosArr,
  calcAppRetPos
};
