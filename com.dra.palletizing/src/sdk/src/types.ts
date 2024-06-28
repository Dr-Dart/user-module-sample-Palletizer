/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

export type XHRBodyType = {
  [key in string | number | symbol] : unknown
}

export type EventType = {
  data: string
}

export type RobotModelType = {
  name: string,
  value: string,
  order: number
}