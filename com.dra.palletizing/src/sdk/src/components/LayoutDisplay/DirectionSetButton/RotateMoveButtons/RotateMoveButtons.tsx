/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button, ButtonGroup, SvgIcon } from '@mui/material';
import MoveIcon from '../../../../assets/Icon/Move.svg';
import RotateIcon from '../../../../assets/Icon/Rotate.svg';
import classes from './RotateMoveButtons.module.css';
type RotateMoveProps = {
  handleClick: (type: 'MOVE' | 'ROTATE') => void;
  selectedRotateMove: {
    isRotate: boolean;
    isMove: boolean;
  };
};
export default function RotateMoveButtons({ handleClick, selectedRotateMove }: RotateMoveProps) {
  const handleRotate = (event: any) => {
    event.currentTarget.blur();
    handleClick('ROTATE');
  };
  const handleMove = () => {
    handleClick('MOVE');
  };
  return (
    <ButtonGroup orientation="vertical" className={classes.rotateBtn} aria-label="vertical outlined button group">
      <Button
        className={`${classes.btn} ${classes.firstBtn} ${selectedRotateMove.isRotate ? classes.clicker : ''}`}
        onClick={handleRotate}
      >
        <SvgIcon component={RotateIcon} viewBox="0 0 32 32"></SvgIcon>
      </Button>
      <Button className={`${classes.btn} ${selectedRotateMove.isMove ? classes.clicker : ''}`} onClick={handleMove}>
        <SvgIcon component={MoveIcon} viewBox="0 0 32 32"></SvgIcon>
      </Button>
    </ButtonGroup>
  );
}
