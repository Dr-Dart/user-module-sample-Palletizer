/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

const BASE_URL = '';
const URDF_PREFIX_PATH = '';

const Constants = {
  METHOD: {
    GET: "GET" as const,
    POST: "POST" as const,
    PUT: "PUT" as const,
    DELETE: "DELETE" as const,
  },
  // Get robot position
  POSITION: {
    // Get current TCP position
    GET_CURRENT_POS_X: `${BASE_URL}/get_current_posx`,
    // Get current robot angle
    GET_CURRENT_POS_J: `${BASE_URL}/get_current_posj`,
    // Get current pose
    GET_CURRENT_POSE: `${BASE_URL}/robot/position`,
  },
  // Get Robot
  ROBOT: {
    // Get Robot Model when connected to actual Robot
    GET_SYSVERSION_EX: `${BASE_URL}/get_sysversion_ex`,
    // Get connected mode (true: Real or false: Simulator)
    GET_ROBOT_SYSTEM: `${BASE_URL}/get_robot_system`,
    // Check Robot running state
    GET_ROBOT_STATE: `${BASE_URL}/get_robot_state`,
  },
  STATUS: {
    SUCCESS: 200,
  },
  CONNECTED_MODE: {
    REAL: 0,
    VIRTUAL: 1,
  },
  INTERVAL_TIME: 50,
  SPACE_STRING_MOVEMENT: {
    JOINT: 'joint',
    TASK: 'task'
  },
  STEP_MODE: {
    SET_DEVICE: {
      type: 'SET_DEVICE',
      value: 1
    },
    SET_CALIBRATE_OUT_FEEDER: {
      type: 'SET_CALIBRATE_OUT_FEEDER',
      value: 5
    },
    SET_PICK_PLACE: {
      type: 'SET_PICK_PLACE',
      value: 6
    },
    SET_RUN: {
      type: 'SET_RUN',
      value: 7
    },
    SET_INDEX_IN: {
      type: 'SET_INDEX_IN',
      value: 8
    },
    SET_INDEX_OUT: {
      type: 'SET_INDEX_OUT',
      value: 9
    },
    SET_CLICK_GENERATE_SIMULATION: {
      type: 'SET_CLICK_GENERATE_SIMULATION',
      value: null
    },
    SET_INTERVAL_DATA: {
      type: 'SET_INTERVAL_DATA',
      value: 10
    }
  },
  RENDER_MODE: {
    SHOW_ROBOT: 'SHOW_ROBOT',
    HIDE_ROBOT: 'HIDE_ROBOT',

    RESET_ROBOT: 'RESET_ROBOT',

    RENDER_INIT_IN_PALLET: 'RENDER_INIT_IN_PALLET',

    RENDER_INIT_OUT_PALLET: 'RENDER_INIT_OUT_PALLET',
    RENDER_INIT_OUT_PALLET_WITH_COORS: 'RENDER_INIT_OUT_PALLET_WITH_COORS',
    RENDER_INIT_OUT_PALLET_WITH_COORS_CAM: 'RENDER_INIT_OUT_PALLET_WITH_COORS_CAM',
    RENDER_INIT_OUT_PALLET_WITH_CAM: 'RENDER_INIT_OUT_PALLET_WITH_CAM',

    RENDER_IN_PALLET: 'RENDER_IN_PALLET',
    RENDER_OUT_PALLET: 'RENDER_OUT_PALLET',
    RENDER_OUT_PALLET_WITH_CAM: 'RENDER_OUT_PALLET_WITH_CAM',

    RENDER_OUT_PALLET_HIGHLIGHT: 'RENDER_OUT_PALLET_HIGHLIGHT',
    RENDER_OUT_PALLET_HIDE_PRODUCT: 'RENDER_OUT_PALLET_HIDE_PRODUCT',

    REMOVE_INIT_IN_PALLET: 'REMOVE_INIT_IN_PALLET',
    REMOVE_INIT_OUT_PALLET: 'REMOVE_INIT_OUT_PALLET',

    REMOVE_IN_PALLET: 'REMOVE_IN_PALLET',
    REMOVE_OUT_PALLET: 'REMOVE_OUT_PALLET',

    SET_RUNNING: 'SET_RUNNING',
    SET_INDEX_RUN_SCREEN: 'SET_INDEX_RUN_SCREEN',

    SEND_DATA_TO_MODULE: 'SEND_DATA_TO_MODULE',

    GET_ALL_IN_PALLET_PRODUCT: 'GET_ALL_IN_PALLET_PRODUCT',
    GET_ALL_OUT_PALLET_PRODUCT: 'GET_ALL_OUT_PALLET_PRODUCT',
    GET_IN_PALLET_PRODUCT_INDEX: 'GET_IN_PALLET_PRODUCT_INDEX',
    GET_OUT_PALLET_PRODUCT_INDEX: 'GET_OUT_PALLET_PRODUCT_INDEX',

    HIDE_DIRECTION_BUTTON: 'HIDE_DIRECTION_BUTTON',
    SET_PRODUCT_INDEX_IN : 'SET_PRODUCT_INDEX_IN',
    SET_PRODUCT_INDEX_OUT : 'SET_PRODUCT_INDEX_OUT',
  },
  PALLET: {
    HEIGHT: 150
  },
  GROUP_NAME: {
    OUT_PALLET_GROUP: 'OUT-PALLET-GROUP',
    IN_PALLET_GROUP: 'IN-PALLET-GROUP',
  },
  URDF_PREFIX_PATH,
  ERROR_MESSAGES : {
    API: 'Something went wrong!'
  },
  URDF_PATH: '../../../../urdf',
  SHOW :{
    GRIDLINE: 'gridLine',
    TCPCOORDINATION: 'tCPCoordination',
    TOOLSHAPE: 'toolShape'
  },
  LIST_MODEL :{
    M0609 : 'M0609',
    M0617 : 'M0617',
    M1013 : 'M1013',
    M1509 : 'M1509',
    A0509 : 'A0509',
    A0509S : 'A0509s',
    A0912 : 'A0912',
    A0912S : 'A0912s',
    H2017 : 'H2017',
    H2515 : 'H2515'
  },

  ZOOM_MODE : {
    IN : 'IN' as const,
    OUT : 'OUT' as const
  },
  MARGIN_LINE: {
    DASH_LINE: 'dahsed-line',
    LINE: 'line'
  },

  OBJECT_ID: {
    OUT_PALLET: 'out-pallet'
  },
  MOVE_ROTATE_MODE : {
    MOVE: 'MOVE',
    ROTATE: 'ROTATE'
  },
  DIRECTION :{
    FRONT : 'Front',
    RIGHT : 'Right',
    LEFT  : 'Left',
    REAR  : 'Rear',
    TOP   : 'Top'
  },

};

export default Constants;