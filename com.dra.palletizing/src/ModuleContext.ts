/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import React from 'react';
import { Context as DartModuleContext } from 'dart-api';
export const ModuleContext = React.createContext<DartModuleContext>({
  packageName: '',
  getSystemLibrary: () => {
    return null;
  },
  getSystemManager: () => {
    return null;
  }
});
