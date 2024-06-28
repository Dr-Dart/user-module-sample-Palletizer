/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import React, { ReactNode, useState } from 'react';

interface ModelContextInterface {
  modelName: string;
  displayName: string;
  changeModel: (modelName: string) => void;
  changeDisplay: (displayName: string) => void;
}
interface ModelContextProps {
  children: ReactNode;
}
const dataModelContextDefault: ModelContextInterface = {
  modelName: 'M1013',
  displayName: 'Base',
  changeModel: () => undefined,
  changeDisplay: () => undefined
};
/**
 * Create context using createContext from data model Context
 */
export const ModelContext = React.createContext<ModelContextInterface>(dataModelContextDefault);

/**
 * Create provider for context
 * @param {ModelContextProps} children params children for model provider
 */
const ModelContextProvider = ({ children }: ModelContextProps) => {
  //#region  2022/06/01 - VuLN1 - Implement context for header - Start
  const [data, setData] = useState({
    modelName: dataModelContextDefault.modelName,
    displayName: dataModelContextDefault.displayName,
  });
  const changeModel = (name: string) =>
    setData((prev) => ({ ...prev, modelName: name }));
  const changeDisplay = (name: string) =>
    setData((prev) => ({ ...prev, displayName: name }));
  const dataModelCtx = {
    modelName: data.modelName,
    displayName: data.displayName,
    changeModel,
    changeDisplay
  };

  return (
    <ModelContext.Provider value={dataModelCtx}>
      {children}
    </ModelContext.Provider>
  );
  //#region  2022/06/01 - VuLN1 - Implement context for header
};
export default ModelContextProvider;
