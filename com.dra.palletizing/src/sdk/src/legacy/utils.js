/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import * as THREE from 'three';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineDashedMaterial, LineSegments } from 'three';
export default class Utils {
  static buildAxis(dir, origin, length, colorHex) {
    return new THREE.ArrowHelper(dir.normalize(), origin, length, colorHex, 0.5, 0.4);
  }

  static buildAxes(origin, lengthX, lengthY, lengthZ) {
    const axes = new THREE.Object3D();

    axes.add(this.buildAxis(new THREE.Vector3(1, 0, 0), origin, lengthX, 'red'));
    axes.add(this.buildAxis(new THREE.Vector3(0, 1, 0), origin, lengthY, 'green'));
    axes.add(this.buildAxis(new THREE.Vector3(0, 0, 1), origin, lengthZ, 'blue'));

    return axes;
  }

  static buildDot(color = '#005fb8') {
    const geometry = new THREE.SphereGeometry(0.07, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    return new THREE.Mesh(geometry, material);
  }

  // Draw a line through 2 point
  static createOutLine(point1, point2, lineColor, isDashed = false) {
    const positions = [...point1, ...point2];
    let line;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    if (isDashed) {
      const material = new LineDashedMaterial({
        color: lineColor,
        dashSize: 3,
        gapSize: 1,
        scale: 10,
        fog: true,
        alphaToCoverage: true,
        linewidth: 1,
      });
      material.depthTest = false;
      material.depthWrite = false;

      line = new LineSegments(geometry, material);
      line.computeLineDistances();
    } else {
      const material = new LineBasicMaterial({
        color: lineColor,
        linewidth: 1,
        fog: true,
        alphaToCoverage: true,
      });
      // material.depthTest = false;

      line = new THREE.Line(geometry, material);
    }
    return line;
  }

  static drawTopBorder(width, length, height, lineColor = '#F02663', isDashed) {
    /*
                    P5 *- - - - - - - - -* P8
                      /|                /|                   y
                     / |               / |                  |
                    /  |              /  |                  |
                   /   |             /   |                  |
               P6 *- - - - - - - - -* P7 |                  |
                  |    |            |    |                  |
                  | P1 *- - - - - - | - -* P4               |_ _ _ _ _ _ _ x
                  |   /             |   /                  /
                  |  /              |  /                  /
                  | /               | /                  /z
                  |/                |/
               P2 *- - - - - - - - -* P3

    */
    const point5 = [-width / 2, length / 2, height / 2];
    const point6 = [-width / 2, -length / 2, height / 2];
    const point7 = [width / 2, -length / 2, height / 2];
    const point8 = [width / 2, length / 2, height / 2];
    const side56 = this.createOutLine(point5, point6, lineColor, isDashed);
    const side67 = this.createOutLine(point6, point7, lineColor, isDashed);
    const side78 = this.createOutLine(point7, point8, lineColor, isDashed);
    const side85 = this.createOutLine(point8, point5, lineColor, isDashed);
    return [side56, side67, side78, side85];
  }
}
