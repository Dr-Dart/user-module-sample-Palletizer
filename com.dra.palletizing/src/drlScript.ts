/* istanbul ignore file */
/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/

export const DRL_TEMPLATE = `
import math as pymath
drl_report_line(OFF)

palletizingData

##### global variables
g_jointVel = 100.0
g_jointAcc = 60.0
g_appVel = 500.0
g_appAcc = 1000.0
g_retVel = 500.0
g_retAcc = 1000.0
g_retAcc = 1000.0

##### define template functions
#define gripper grasp signal
def grasp_gripper():
    STAT_ON = 1
    STAT_OFF = 0
    wait_time = 0.5
    wait(wait_time)
    set_tool_digital_output(1, STAT_OFF)
    wait(0.3)
    set_tool_digital_output(2, STAT_ON)
    wait(wait_time)

#define gripper release signal
def release_gripper():
    STAT_ON = 1
    STAT_OFF = 0
    wait_time = 0.5
    wait(wait_time)
    set_tool_digital_output(2, STAT_OFF)
    wait(0.3)
    set_tool_digital_output(1, STAT_ON)
    wait(wait_time)

#define device initialization
def begin_device():
    # set tcp
    tp_log("begin_device")
    set_tcp('pallet-Gripper1')
    release_gripper()

#define device cleanup
def end_device():
    initial_configuration()

#define Robot Initial Configuration
def initial_configuration():
    P0 = posj(
        data["initial_pose"][0],
        data["initial_pose"][1],
        data["initial_pose"][2],
        data["initial_pose"][3],
        data["initial_pose"][4],
        data["initial_pose"][5]
    )
    movej(P0, vel=g_jointVel, acc=g_jointAcc)

#define minimum joint IK solution function
def min_jvector_sol(targetpose, coordinate):
    jcur = get_current_posj()
    sumjsol = [0, 0, 0, 0, 0, 0, 0, 0]
    for i in range(0, 8):
        jsol = ikin(targetpose, i, coordinate)
        sumjsol[i] = abs(jcur[1] - jsol[1]) + abs(jcur[2] - jsol[2]) + abs(jcur[4] - jsol[4])
    minsol_idx = sumjsol.index(min(sumjsol))
    return minsol_idx



def job_motion(appPose, jobPose, retPose, action):
    
    #go to approach position
    appPoseSol = min_jvector_sol(appPose, DR_BASE)
    movejx(appPose, vel=g_jointVel, acc=g_jointAcc, sol=appPoseSol, ref=DR_BASE)
    
    #go to source working pose
    movel(jobPose, vel=g_appVel, acc=g_appAcc, ref=DR_BASE)
    #movejx(jobPose, vel=g_jointVel, acc=g_jointAcc, sol=appPoseSol, ref=DR_BASE)
    
    #do gripper action
    tp_log(action.__name__)
    action()
    
    #go to retraction pose
    movel(retPose, vel=g_retVel, acc=g_retAcc, ref=DR_BASE)
    #movejx(retPose, vel=g_jointVel, acc=g_jointAcc, sol=appPoseSol, ref=DR_BASE)


drl_report_line(ON)
##### robot motion
begin_device()
pickFeeder_loopCount = 0
placeFeeder_loopCount = 0
initial_configuration()

while True:
    if pickFeeder_loopCount < len(data["pick_product_position"]):
        if (data["pick_custom_approach_position"] and data["pick_custom_approach_position"][pickFeeder_loopCount]):
            app_pose_x = data["pick_custom_approach_position"][pickFeeder_loopCount]["x"]
            app_pose_y = data["pick_custom_approach_position"][pickFeeder_loopCount]["y"]
            app_pose_z = data["pick_custom_approach_position"][pickFeeder_loopCount]["z"]
        else:
            app_pose_x = data["pick_product_position"][pickFeeder_loopCount]["x"]
            app_pose_y = data["pick_product_position"][pickFeeder_loopCount]["y"]
            app_pose_z = data["pick_product_position"][pickFeeder_loopCount]["z"] + 150
        app_pose = posx(
            app_pose_x,
            app_pose_y,
            app_pose_z,
            data["pick_product_position"][pickFeeder_loopCount]["a"],
            data["pick_product_position"][pickFeeder_loopCount]["b"],
            data["pick_product_position"][pickFeeder_loopCount]["c"],
        )
        job_pose = posx(
            data["pick_product_position"][pickFeeder_loopCount]["x"],
            data["pick_product_position"][pickFeeder_loopCount]["y"],
            data["pick_product_position"][pickFeeder_loopCount]["z"],
            data["pick_product_position"][pickFeeder_loopCount]["a"],
            data["pick_product_position"][pickFeeder_loopCount]["b"],
            data["pick_product_position"][pickFeeder_loopCount]["c"],
        )
        if (data["pick_custom_retract_position"] and data["pick_custom_retract_position"][pickFeeder_loopCount]):
            ret_pose_x = data["pick_custom_retract_position"][pickFeeder_loopCount]["x"]
            ret_pose_y = data["pick_custom_retract_position"][pickFeeder_loopCount]["y"]
            ret_pose_z = data["pick_custom_retract_position"][pickFeeder_loopCount]["z"]
        else:
            ret_pose_x = data["pick_product_position"][pickFeeder_loopCount]["x"]
            ret_pose_y = data["pick_product_position"][pickFeeder_loopCount]["y"]
            ret_pose_z = data["pick_product_position"][pickFeeder_loopCount]["z"] + 150
        retract_pose = posx(
            ret_pose_x,
            ret_pose_y,
            ret_pose_z,
            data["pick_product_position"][pickFeeder_loopCount]["a"],
            data["pick_product_position"][pickFeeder_loopCount]["b"],
            data["pick_product_position"][pickFeeder_loopCount]["c"],
        )
        job_motion(
            app_pose,
            job_pose,
            retract_pose,
            grasp_gripper
        )
        pickFeeder_loopCount += 1
    
    if placeFeeder_loopCount < len(data["place_product_position"]):
        if (data["place_custom_approach_position"] and data["place_custom_approach_position"][placeFeeder_loopCount]):
            app_pose_x = data["place_custom_approach_position"][placeFeeder_loopCount]["x"]
            app_pose_y = data["place_custom_approach_position"][placeFeeder_loopCount]["y"]
            app_pose_z = data["place_custom_approach_position"][placeFeeder_loopCount]["z"]
        else:
            app_pose_x = data["place_product_position"][placeFeeder_loopCount]["x"]
            app_pose_y = data["place_product_position"][placeFeeder_loopCount]["y"]
            app_pose_z = data["place_product_position"][placeFeeder_loopCount]["z"] + 150

        app_pose = posx(
            app_pose_x,
            app_pose_y,
            app_pose_z,
            data["place_product_position"][placeFeeder_loopCount]["a"],
            data["place_product_position"][placeFeeder_loopCount]["b"],
            data["place_product_position"][placeFeeder_loopCount]["c"],
        )
        job_pose = posx(
            data["place_product_position"][placeFeeder_loopCount]["x"],
            data["place_product_position"][placeFeeder_loopCount]["y"],
            data["place_product_position"][placeFeeder_loopCount]["z"],
            data["place_product_position"][placeFeeder_loopCount]["a"],
            data["place_product_position"][placeFeeder_loopCount]["b"],
            data["place_product_position"][placeFeeder_loopCount]["c"],
        )
        if (data["place_custom_retract_position"] and data["place_custom_retract_position"][placeFeeder_loopCount]):
            ret_pose_x = data["place_custom_retract_position"][placeFeeder_loopCount]["x"]
            ret_pose_y = data["place_custom_retract_position"][placeFeeder_loopCount]["y"]
            ret_pose_z = data["place_custom_retract_position"][placeFeeder_loopCount]["z"]
        else:
            ret_pose_x = data["place_product_position"][placeFeeder_loopCount]["x"]
            ret_pose_y = data["place_product_position"][placeFeeder_loopCount]["y"]
            ret_pose_z = data["place_product_position"][placeFeeder_loopCount]["z"] + 150
        retract_pose = posx(
            ret_pose_x,
            ret_pose_y,
            ret_pose_z,
            data["place_product_position"][placeFeeder_loopCount]["a"],
            data["place_product_position"][placeFeeder_loopCount]["b"],
            data["place_product_position"][placeFeeder_loopCount]["c"],
        )
        job_motion(
            app_pose,
            job_pose,
            retract_pose,
            release_gripper
        )
        placeFeeder_loopCount += 1
    #check escape condition
    if pickFeeder_loopCount == len(data["pick_product_position"]) \
        and placeFeeder_loopCount == len(data["place_product_position"]):
        break
#clean up device
end_device()
`;
