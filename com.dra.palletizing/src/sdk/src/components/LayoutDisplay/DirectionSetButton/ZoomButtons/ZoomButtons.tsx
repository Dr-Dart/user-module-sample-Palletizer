/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { useState } from "react";
import { Button, ButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import classes from './ZoomButtons.module.css';
import Constant from "../../../../shared/constants/index"

const { IN, OUT } = Constant.ZOOM_MODE

type ZoomButtonsProps = {
  onZoom : (mode : typeof IN | typeof OUT) => void
}

export default function ZoomButtons({ onZoom } : ZoomButtonsProps) {
  //For touch screen device
  const [zoomInHover, setZoomInHover] = useState(false);
  const [zoomOutHover, setZoomOutHover] = useState(false);
  return (
    <ButtonGroup
      orientation="vertical"
      className={classes.rotateBtn}
      aria-label="vertical outlined button group"
    >
      <Button className={`${classes.btn} ${zoomInHover?classes.touchHover:classes.hover}`}
        onClick={(event) => {event.currentTarget.blur(); onZoom(IN)}}
        onTouchStart={()=> setZoomInHover(true)}
        onTouchEnd={()=> setZoomInHover(false)}
      >
        <AddIcon />
      </Button>
      <Button className={`${classes.btn} ${zoomOutHover?classes.touchHover:classes.hover}`} 
        onClick={(event) => {event.currentTarget.blur();onZoom(OUT)}}
        onTouchStart={()=> setZoomOutHover(true)}
        onTouchEnd={()=> setZoomOutHover(false)}
      >
        <RemoveIcon />
      </Button>
    </ButtonGroup>
  );
}
