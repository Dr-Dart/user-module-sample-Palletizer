/* globals */
/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import NewDisplayViewer, { SDKProps } from '../../components/LayoutDisplay/NewDisplayViewer';
import ModelContextProvider from "../../context/DataHeaderContext";

import "./SDKViewer.css";
function SDKViewer(props: SDKProps) {
  return (
    <ModelContextProvider>
      <NewDisplayViewer {...props} ref={props.refObject} />
    </ModelContextProvider>
  );
}

export default SDKViewer;
