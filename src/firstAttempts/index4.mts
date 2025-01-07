type NetworkArgument = {};

type VolumeArgument = {};

type VolumeType = {
  readonly: boolean; // false > true
};

type VolumeTypeExtends<
  E1 extends VolumeType,
  E2 extends VolumeType
> = E1['readonly'] extends false
  ? true
  : E2['readonly'] extends true
  ? true
  : false;

type ResourceType = {};

// type

type PortType = {
  readonly protocol: 'tcp' | 'udp' | 'sctp'; // invariant
};

type ModuleInterface = {};

/* 

resources
  - port
  - volume


some resources can be created at the middle of the stack.



*/
