/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Object3D, Vector3 } from 'three';

export interface URDFCollider extends Object3D {

  isURDFCollider: true;
  urdfNode: Element | null;

}

export interface URDFVisual extends Object3D {

  isURDFVisual: true;
  urdfNode: Element | null;

}

export interface URDFLink extends Object3D {

  isURDFLink: true;
  urdfNode: Element | null;

}

export interface URDFJoint extends Object3D {

  isURDFJoint: true;

  urdfNode: Element | null;
  axis: Vector3;
  jointType: 'fixed' | 'continuous' | 'revolute' | 'planar' | 'prismatic' | 'floating';
  angle: number;
  jointValue: number[];
  limit: { lower: number, upper: number }; // TODO: add more
  ignoreLimits: boolean;
  mimicJoints: URDFMimicJoint[];

  setJointValue(value0: number, value1?: number, value2?: number): void;

}

export interface URDFMimicJoint extends URDFJoint {

  mimicJoint : string;
  offset: number;
  multiplier: number;

}

export interface URDFRobot extends URDFLink {

  isURDFRobot: true;

  urdfRobotNode: Element | null;
  robotName: string;

  links: { [ key: string ]: URDFLink };
  joints: { [ key: string ]: URDFJoint };
  colliders: { [ key: string ]: URDFCollider };
  visual: { [ key: string ]: URDFVisual };
  frames: { [ key: string ]: Object3D };

  setJointValue(jointName: string, value0: number, value1?: number, value2?: number): void;
  setJointValues(values: { [ key: string ]: number | number[] }): void;
  getFrame(name: string): Object3D;

}
