/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Button } from '@mui/material';
import classes from './DirectionSetBtn.module.css';
import { TFunction, withTranslation } from 'react-i18next';

/**
 * Create function for get current pose
 */
interface DirectionSetButtonProps {
  selectedStatus: { name: string; isSelect: boolean }[];
  handleClickDirection: (dir: string) => void;
  t: TFunction;
}
const DirectionSetButton = (props: DirectionSetButtonProps) => {
  const handleClick = (name: string) => {
    props.handleClickDirection(name);
  };
  return (
    <div className={classes.directionBtn}>
      {props.selectedStatus.map((item) => (
        <Button
          key={props.t(item.name)}
          className={`${item.isSelect ? classes.btnClick : ''} 
          ${classes.buttonCustom}`}
          onClick={() => handleClick(item.name)}
        >
          {props.t(item.name)}
        </Button>
      ))}
    </div>
  );
};
export default withTranslation('com.dra.palletizing')(DirectionSetButton);
