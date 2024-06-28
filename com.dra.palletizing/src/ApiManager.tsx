/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { Context, IAuthorityManager, ICommunicationManager, IDartFileSystem, IMotionManager, IPositionManager, IProgramManager, IRobotManager, IRobotParameterManager, IUserManager, ModuleContext } from "dart-api";
import { IMathLibrary } from "dart-api/dart-api-math";

export default class ApiManager_IUH3459EDG {
  private programManager: IProgramManager | null = null;
  private fileSystem: IDartFileSystem | null = null;
  private communicationManager: ICommunicationManager | null = null;
  private mathLib: IMathLibrary | null = null
  private robotManager: IRobotManager | null = null;
  private motionManager: IMotionManager | null = null;
  private positionManager: IPositionManager | null = null;
  private authorityManager: IAuthorityManager| null = null;
  private robotParameterManager: IRobotParameterManager| null = null;
  private context: ModuleContext | null = null;
  private userManager: IUserManager|null = null;

  get ProgramManager(): IProgramManager { return this.programManager as IProgramManager}
  get FileSystem(): IDartFileSystem | null { return this.fileSystem as IDartFileSystem}
  get CommunicationManager(): ICommunicationManager { return this.communicationManager as ICommunicationManager}
  get MathLib(): IMathLibrary { return this.mathLib as IMathLibrary}
  get RobotManager(): IRobotManager { return this.robotManager as IRobotManager}
  get MotionManager(): IMotionManager { return this.motionManager as IMotionManager;}
  get PositionManager(): IPositionManager { return this.positionManager as IPositionManager}
  get AuthorityManager(): IAuthorityManager { return this.authorityManager as IAuthorityManager}
  get RobotParameterManager(): IRobotParameterManager { return this.robotParameterManager as IRobotParameterManager}
  get UserManager(): IUserManager { return this.userManager as IUserManager}

  private static instance: ApiManager_IUH3459EDG|null = null;

  private constructor() {
  }

  public static dispose(){
    ApiManager_IUH3459EDG.instance = null;
  }

  public isInitialized() : boolean { return this.context == null? false:true}

  public initialize(context: ModuleContext) : boolean
  {
    if(context == null)
      return false;

    this.context = context;
    this.programManager = context.getSystemManager(Context.PROGRAM_MANAGER,) as IProgramManager;
    this.fileSystem = context.getSystemLibrary(Context.DART_FILE_SYSTEM,) as IDartFileSystem;
    this.robotManager = context.getSystemManager(Context.ROBOT_MANAGER,) as IRobotManager;
    this.communicationManager = context.getSystemManager(Context.COMMUNICATION_MANAGER,) as ICommunicationManager;
    this.mathLib = context.getSystemLibrary(Context.MATH_LIBRARY,) as IMathLibrary;
    this.motionManager = context.getSystemManager(Context.MOTION_MANAGER) as IMotionManager;
    this.positionManager = context.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
    this.authorityManager = context.getSystemManager(Context.AUTHORITY_MANGER) as IAuthorityManager;
    this.robotParameterManager = context.getSystemManager(Context.ROBOT_PARAMETER_MANAGER) as IRobotParameterManager;
    this.userManager = context.getSystemManager(Context.USER_MANAGER) as IUserManager;

    return true;
  }

  public static inst () {
      return this.instance || (this.instance = new this())
  }
}
