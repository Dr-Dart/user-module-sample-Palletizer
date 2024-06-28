/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import React, { useEffect } from "react";

export function useOutsideAlerter(ref: React.MutableRefObject<null | HTMLDivElement>, callBack: () => void) {
  useEffect(() => {
    /**
       * Alert if clicked on outside of element
       */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callBack();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}