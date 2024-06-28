/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { MeshPhongMaterial } from 'three';
import URDFViewer from './urdf-viewer-element.js';
import { PointerURDFDragControls } from './URDFDragControls.js';
import { CONSTANTS } from '../legacy/const';

// urdf-manipulator element
// Displays a URDF model that can be manipulated with the mouse

// Events
// joint-mouseover: Fired when a joint is hovered over
// joint-mouseout: Fired when a joint is no longer hovered over
// manipulate-start: Fires when a joint is manipulated
// manipulate-end: Fires when a joint is done being manipulated
export default
class URDFManipulator extends URDFViewer {

  static get observedAttributes() {

    return [CONSTANTS.HIGHLIGHT_COLOR, ...super.observedAttributes];

  }

  get disableDragging() { return this.hasAttribute(CONSTANTS.DISABLE_DRAGGING); }
  set disableDragging(val) { val ? this.setAttribute(CONSTANTS.DISABLE_DRAGGING, !!val) : 
    this.removeAttribute(CONSTANTS.DISABLE_DRAGGING); }

  get highlightColor() { return this.getAttribute(CONSTANTS.HIGHLIGHT_COLOR) || '#FFFFFF'; }
  set highlightColor(val) { val ? this.setAttribute(CONSTANTS.HIGHLIGHT_COLOR, val) : 
    this.removeAttribute(CONSTANTS.HIGHLIGHT_COLOR); }

  constructor(...args) {

    super(...args);

    // The highlight material
    this.highlightMaterial =
            new MeshPhongMaterial({
              shininess: 10,
              color: this.highlightColor,
              emissive: this.highlightColor,
              emissiveIntensity: 0.25,
            });

    const isJoint = j => {

      return j.isURDFJoint && j.jointType !== 'fixed';

    };

    // Highlight the link geometry under a joint
    const highlightLinkGeometry = (m, revert) => {

      const traverse = c => {

        // Set or revert the highlight color
        if (c.type === 'Mesh') {

          if (revert) {

            c.material = c.__origMaterial;
            delete c.__origMaterial;

          } else {

            c.__origMaterial = c.material;
            c.material = this.highlightMaterial;

          }

        }

        // Look into the children and stop if the next child is
        // another joint
        if (c === m || !isJoint(c)) {

          for (const element of c.children) {
            traverse(element);
          }

        }

      };

      traverse(m);

    };

    const el = this.renderer.domElement;

    const dragControls = new PointerURDFDragControls(this.scene, this.camera, el);
    dragControls.onDragStart = joint => {

      this.dispatchEvent(new CustomEvent('manipulate-start', { bubbles: true, cancelable: true, detail: joint.name }));
      this.controls.enabled = false;
      this.redraw();

    };
    dragControls.onDragEnd = joint => {

      this.dispatchEvent(new CustomEvent('manipulate-end', { bubbles: true, cancelable: true, detail: joint.name }));
      this.controls.enabled = true;
      this.redraw();

    };
    dragControls.updateJoint = (joint, angle) => {

      this.setJointValue(joint.name, angle);

    };
    dragControls.onHover = joint => {

      highlightLinkGeometry(joint, false);
      this.dispatchEvent(new CustomEvent('joint-mouseover', { bubbles: true, cancelable: true, detail: joint.name }));
      this.redraw();

    };
    dragControls.onUnhover = joint => {

      highlightLinkGeometry(joint, true);
      this.dispatchEvent(new CustomEvent('joint-mouseout', { bubbles: true, cancelable: true, detail: joint.name }));
      this.redraw();

    };

    this.dragControls = dragControls;

  }

  disconnectedCallback() {

    super.disconnectedCallback();
    this.dragControls.dispose();

  }

  attributeChangedCallback(attr, oldval, newval) {

    super.attributeChangedCallback(attr, oldval, newval);
    
    switch (attr) {

      case CONSTANTS.HIGHLIGHT_COLOR:
        this.highlightMaterial.color.set(this.highlightColor);
        this.highlightMaterial.emissive.set(this.highlightColor);
        break;
      default:
        break;
    }

  }

}
