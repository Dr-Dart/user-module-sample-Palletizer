/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from './URDFLoader.js';

const tempVec2 = new THREE.Vector2();

// urdf-viewer element
// Loads and displays a 3D view of a URDF-formatted robot

// Events
// urdf-change: Fires when the URDF has finished loading and getting processed
// urdf-processed: Fires when the URDF has finished loading and getting processed
// geometry-loaded: Fires when all the geometry has been fully loaded
// ignore-limits-change: Fires when the 'ignore-limits' attribute changes
// angle-change: Fires when an angle changes
export default
class URDFViewer extends HTMLElement {

  static get observedAttributes() {

    return ['package', 'urdf', 'up', 'display-shadow', 'ambient-color', 'ignore-limits'];

  }

  get package() { return this.getAttribute('package') || ''; }
  set package(val) { this.setAttribute('package', val); }

  get urdf() { return this.getAttribute('urdf') || ''; }
  set urdf(val) { this.setAttribute('urdf', val); }

  get ignoreLimits() { return this.hasAttribute('ignore-limits') || false; }
  set ignoreLimits(val) { val ? this.setAttribute('ignore-limits', val) : this.removeAttribute('ignore-limits'); }

  get up() { return this.getAttribute('up') || '+Z'; }
  set up(val) { this.setAttribute('up', val); }

  get displayShadow() { return this.hasAttribute('display-shadow') || false; }
  set displayShadow(val) { val ? this.setAttribute('display-shadow', '') : this.removeAttribute('display-shadow'); }

  get ambientColor() { return this.getAttribute('ambient-color') || '#455A64'; }
  set ambientColor(val) { val ? this.setAttribute('ambient-color', val) : this.removeAttribute('ambient-color'); }

  get autoRedraw() { return this.hasAttribute('auto-redraw') || false; }
  set autoRedraw(val) { val ? this.setAttribute('auto-redraw', true) : this.removeAttribute('auto-redraw'); }

  get noAutoRecenter() { return this.hasAttribute('no-auto-recenter') || false; }
  set noAutoRecenter(val) { val ? this.setAttribute('no-auto-recenter', true) : 
    this.removeAttribute('no-auto-recenter'); }

  get jointValues() {

    const values = {};
    if (this.robot) {

      for (const name in this.robot.joints) {

        const joint = this.robot.joints[name];
        values[name] = joint.jointValue.length === 1 ? joint.angle : [...joint.jointValue];

      }

    }

    return values;

  }
  set jointValues(val) { this.setJointValues(val); }

  get angles() {

    return this.jointValues;

  }
  set angles(v) {

    this.jointValues = v;

  }

  /* Lifecycle Functions */
  constructor() {

    super();

    this._requestId = 0;
    this._dirty = false;
    this._loadScheduled = false;
    this.robot = null;
    this.loadMeshFunc = null;
    this.urlModifierFunc = null;

    // Scene setup
    const scene = new THREE.Scene();

    const ambientLight = new THREE.HemisphereLight(this.ambientColor, '#000');
    ambientLight.groundColor.lerp(ambientLight.color, 0.5);
    ambientLight.intensity = 0.5;
    ambientLight.position.set(0, 1, 0);
    scene.add(ambientLight);

    // Light setup for four directions
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(4, 10, 1);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.normalBias = 0.001;
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight1.position.set(-4, 10, 1);
    scene.add(dirLight1);
    scene.add(dirLight1.target);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-4, 10, -1);
    scene.add(dirLight2);
    scene.add(dirLight2.target);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight3.position.set(4, 10, -1);
    scene.add(dirLight3);
    scene.add(dirLight3.target);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xffffff);
    renderer.setClearAlpha(0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = -10;

    //  Light source on camera
    const pointLight = new THREE.PointLight( 0xffffff , 0.1);
    camera.add(pointLight);
    scene.add(camera);
        
    // World setup
    const world = new THREE.Object3D();
    scene.add(world);

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(40, 40),
      new THREE.ShadowMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.5 }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    plane.scale.set(10, 10, 10);
    scene.add(plane);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 5;
    controls.panSpeed = 2;
    controls.enableZoom = true;
    controls.enableDamping = false;
    controls.maxDistance = 50;
    controls.minDistance = 0.25;
    controls.addEventListener('change', () => this.recenter());

    this.scene = scene;
    this.world = world;
    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.plane = plane;
    this.directionalLight = dirLight;
    this.ambientLight = ambientLight;

    this._setUp(this.up);

  }

  dispose(){
    this._renderLoopId && cancelAnimationFrame(this._renderLoopId);
    this._renderLoopId = 0;

    this.cleanUpMesh(this.scene);
    this.ambientLight?.dispose();

    if(this.renderer){
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.context = null;
      this.renderer.domElement = null;
      this.renderer = null;
    }

    this.disconnectTimer = null;
  }

  triggerRequestFrame() {
    this.maxFPS = 30; // 최대 프레임 수 (30프레임)
    this.frameDuration = 1000 / this.maxFPS; // 프레임 간격 (밀리초)
    this.lastFrameTime = 0;

    const _renderLoop = (currentTime) => {
      if ((currentTime - this.lastFrameTime) >= this.frameDuration){
        this.forceRender();
        this.lastFrameTime = currentTime;
      }

      this._renderLoopId = requestAnimationFrame(_renderLoop);
    }

    if (this._renderLoopId)
      cancelAnimationFrame(this._renderLoopId);

    _renderLoop();
  }

  forceRender(force = false){
    
    if ((this.parentNode && force) || (this.parentNode && this.parentNode.clientHeight)) {
      this.updateSize();

      if (this._dirty || this.autoRedraw) {

        if (!this.noAutoRecenter) {

          this._updateEnvironment();
        }
        this.renderer.render(this.scene, this.camera);
        this._dirty = false;

      }

      // update controls after the environment in
      // case the controls are retargeted
      this.controls.update();

    }
  }
  connectedCallback() {
    if(this.disconnectTimer){
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
      this.triggerRequestFrame();
      this.updateSize();
      return;
    }
    // Add our initialize styles for the element if they haven't
    // been added yet
    if (!this.constructor._styletag) {

      const styletag = document.createElement('style');
      styletag.innerHTML =
            `
                ${ this.tagName } { display: block; }
                ${ this.tagName } canvas {
                    width: 100%;
                    height: 100%;
                }
            `;
      document.head.appendChild(styletag);
      this.constructor._styletag = styletag;

    }

    // add the renderer
    if (this.childElementCount === 0) {

      this.appendChild(this.renderer.domElement);

    }
    this.triggerRequestFrame();
    this.updateSize();

  }

  cleanUpMesh = (obj) => {
    if (!obj) {
      return;
    }
    if (obj.children.length > 0) {
      for (let x = obj.children.length - 1; x >= 0; x--) {
        this.cleanUpMesh(obj.children[x]);
      }
    }
    obj.geometry && obj.geometry.dispose();
    obj.material && obj.material.dispose();
    obj.dispose && obj.dispose();
    obj.parent?.remove(obj);
  };

  disconnectedCallback() {
    this._renderLoopId && cancelAnimationFrame(this._renderLoopId);
    this._renderLoopId = 0;

    // 시뮬레이터를 PIP로 띄울 때 Focus가 옮겨 갔다가 다시 가져오게 되면
    // disconnectedCallback 호출되고 다시 connectedCallback 호출 된다.
    // 실제 닫힌 것은 아니지만 해당 메소드가 호출되면서 instance 들이 삭제되며 버그를 발생시킨다.
    // 빠른 시간내에 다시 연결됨으로 5초의 시간을 두어 5초 동안 다시 연결되지 않는다면 삭제하도록 한다.
    // 본 처리는 정공법은 아니지만 적절히 동작한다.

    if(!this.disconnectTimer)
      this.disconnectTimer = setTimeout(this.dispose.bind(this), 5000);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  attributeChangedCallback(attr, oldval, newval) {

    this.recenter();

    switch (attr) {

      case 'package':
      case 'urdf': {

        this._scheduleLoad();
        break;

      }

      case 'up': {

        this._setUp(this.up);
        break;

      }

      case 'ambient-color': {

        this.ambientLight.color.set(this.ambientColor);
        this.ambientLight.groundColor.set('#000').lerp(this.ambientLight.color, 0.5);
        break;

      }

      case 'ignore-limits': {

        this._setIgnoreLimits(this.ignoreLimits, true);
        break;

      }

    }

  }

  /* Public API */
  updateSize() {

    const r = this.renderer;
    const w = this.clientWidth;
    const h = this.clientHeight;
    const currsize = r.getSize(tempVec2);

    if (currsize.width !== w || currsize.height !== h) {

      this.recenter();

    }

    r.setPixelRatio(window.devicePixelRatio);
    r.setSize(w, h, false);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

  }

  redraw() {

    this._dirty = true;
  }

  getRobotBoundingBox() {
    const bbox = new THREE.Box3();
    if (this.robot) {
      Object
        .values(this.robot.joints)
        .forEach(item => {
          bbox.expandByObject(item);
        });
    }

    return bbox;
  };

  recenter() {

    this._updateEnvironment();
    this.redraw();

  }

  // Set the joint with jointName to
  // angle in degrees
  setJointValue(jointName, ...values) {

    if (!this.robot) return;
    if (!this.robot.joints[jointName]) return;

    if (this.robot.joints[jointName].setJointValue(...values)) {

      this.redraw();
      this.dispatchEvent(new CustomEvent('angle-change', { bubbles: true, cancelable: true, detail: jointName }));

    }

  }

  setJointValues(values) {

    for (const name in values) this.setJointValue(name, values[name]);

  }

  /* Private Functions */
  // Updates the position of the plane to be at the
  // lowest point below the robot and focuses the
  // camera on the center of the scene
  _updateEnvironment() {

    if (!this.robot) return;
    this.world.updateMatrixWorld();

    const bbox = this.getRobotBoundingBox();
    const center = bbox.getCenter(new THREE.Vector3());
    this.controls.target.y = center.y;
    this.plane.position.y = bbox.min.y - 1e-3;

    const dirLight = this.directionalLight;
    dirLight.castShadow = this.displayShadow;

    if (this.displayShadow) {

      // Update the shadow camera rendering bounds to encapsulate the
      // model. We use the bounding sphere of the bounding box for
      // simplicity -- this could be a tighter fit.
      const sphere = bbox.getBoundingSphere(new THREE.Sphere());
      const minmax = sphere.radius;
      const cam = dirLight.shadow.camera;
      cam.left = cam.bottom = -minmax;
      cam.right = cam.top = minmax;

      // Update the camera to focus on the center of the model so the
      // shadow can encapsulate it
      const offset = dirLight.position.clone().sub(dirLight.target.position);
      dirLight.target.position.copy(center);
      dirLight.position.copy(center).add(offset);

      cam.updateProjectionMatrix();

    }

  }

  _scheduleLoad() {

    // if our current model is already what's being requested
    // or has been loaded then early out
    if (this._prevload === `${ this.package }|${ this.urdf }`) return;
    this._prevload = `${ this.package }|${ this.urdf }`;

    // if we're already waiting on a load then early out
    if (this._loadScheduled) return;
    this._loadScheduled = true;

    if (this.robot) {

      this.robot.traverse(c => c.dispose && c.dispose());
      this.robot.parent.remove(this.robot);
      this.robot = null;

    }

    requestAnimationFrame(() => {

      this._loadUrdf(this.package, this.urdf);
      this._loadScheduled = false;

    });

  }

  // Watch the package and urdf field and load the robot model.
  // This should _only_ be called from _scheduleLoad because that
  // ensures the that current robot has been removed
  _loadUrdf(pkg, urdf) {

    this.dispatchEvent(new CustomEvent('urdf-change', { bubbles: true, cancelable: true, composed: true }));

    if (urdf) {

      // Keep track of this request and make
      // sure it doesn't get overwritten by
      // a subsequent one
      this._requestId++;
      const requestId = this._requestId;

      const updateMaterials = mesh => {

        mesh.traverse(c => {

          if (c.isMesh) {

            c.castShadow = true;
            c.receiveShadow = true;

            if (c.material) {

              const mats =
                                (Array.isArray(c.material) ? c.material : [c.material])
                                  .map(m => {

                                    if (m instanceof THREE.MeshBasicMaterial) {

                                      // eslint-disable-next-line no-param-reassign
                                      m = new THREE.MeshPhongMaterial();

                                    }

                                    if (m.map) {

                                      // Fix eslint

                                    }

                                    return m;

                                  });
              c.material = mats.length === 1 ? mats[0] : mats;

            }

          }

        });

      };

      if (pkg.includes(':') && (pkg.split(':')[1].substring(0, 2)) !== '//') {        
        // eslint-disable-next-line no-param-reassign
        pkg = pkg.split(',').reduce((map, value) => {

          const split = value.split(/:/).filter(x => !!x);
          const pkgName = split.shift().trim();
          const pkgPath = split.join(':').trim();
          map[pkgName] = pkgPath;

          return map;

        }, {});
      }

      let robot = null;
      const manager = new THREE.LoadingManager();
      manager.onLoad = () => {

        // If another request has come in to load a new
        // robot, then ignore this one
        if (this._requestId !== requestId) {

          robot.traverse(c => c.dispose && c.dispose());
          return;

        }

        this.robot = robot;
        this.world.add(robot);
        updateMaterials(robot);

        this._setIgnoreLimits(this.ignoreLimits);
        this.recenter();
        this.dispatchEvent(new CustomEvent('urdf-processed', { bubbles: true, cancelable: true, composed: true }));
        this.dispatchEvent(new CustomEvent('geometry-loaded', { bubbles: true, cancelable: true, composed: true }));


      };

      if (this.urlModifierFunc) {

        manager.setURLModifier(this.urlModifierFunc);

      }

      const loader = new URDFLoader(manager);
      loader.packages = pkg;
      loader.loadMeshCb = this.loadMeshFunc;
      loader.fetchOptions = { mode: 'cors', credentials: 'same-origin' };
      loader.load(urdf, model => robot = model);

    }

  }

  // Watch the coordinate frame and update the
  // rotation of the scene to match
  _setUp(up) {

    // eslint-disable-next-line no-param-reassign
    if (!up) up = '+Z';
    // eslint-disable-next-line no-param-reassign
    up = up.toUpperCase();
    const sign = up.replace(/[^-+]/g, '')[0] || '+';
    const axis = up.replace(/[^XYZ]/gi, '')[0] || 'Z';

    const PI = Math.PI;
    const HALFPI = PI / 2;
    if (axis === 'X') this.world.rotation.set(0, 0, sign === '+' ? HALFPI : -HALFPI);
    if (axis === 'Z') this.world.rotation.set(sign === '+' ? -HALFPI : HALFPI, 0, 0);
    if (axis === 'Y') this.world.rotation.set(sign === '+' ? 0 : PI, 0, 0);

  }

  // Updates the current robot's angles to ignore
  // joint limits or not
  _setIgnoreLimits(ignore, dispatch = false) {

    if (this.robot) {

      Object
        .values(this.robot.joints)
        .forEach(joint => {

          joint.ignoreLimits = ignore;
          joint.setJointValue(...joint.jointValue);

        });

    }

    if (dispatch) {

      this.dispatchEvent(new CustomEvent('ignore-limits-change', { bubbles: true, cancelable: true, composed: true }));

    }

  }

}
