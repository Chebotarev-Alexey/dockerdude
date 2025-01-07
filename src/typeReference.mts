import Docker from 'dockerode';

type TopLevelBridgeOptions =
  | {
      kind: 'network';
      bindPort: Docker.PortBinding;
    }
  | {
      kind: 'files';
      volumePath: string;
    };

type ModuleLevelBridgeOptions =
  | {
      kind: 'network';
    }
  | {
      kind: 'files';
    };

type ConnectorType =
  | {
      kind: 'network'; // invariant
      protocols: { tcp: boolean; udp: boolean; sctp: boolean }; // for each: false extends true
      direction: { outgoing: boolean; ingoing: boolean }; // for each: false extends true
    }
  | {
      kind: 'files'; // invariant
      readonly: boolean; // true extends false
      persistent: boolean; // invariant
    };

// "false extends true" - Extends<A, B> = Implies<A, B>
// "true extends false" - Extends<A, B> = Implies<B, A>
// "invariant" - Extends<A, B> = Equivalent<A, B>

//todo: creating bridges but passing connectors.
//todo: readonly is a connector of a files bridge, or not, but for sure bridge not created with readonly.
//todo: maybe protocol is also quality of connector rather than bridge?

//todo: no bridges, only connectors, that can be narrowed throughout stack.
//todo: or rather, 'createBridge' is only a name of a method, returning a connector.

type TopLevelBridgeOptionsToConnectorType<
  Options extends TopLevelBridgeOptions
> = ConnectorType & Options extends { kind: 'network' }
  ? { protocols: { tcp: true; udp: true; sctp: true } }
  : Options extends { kind: 'files' }
  ? { readonly: false; persistent: true }
  : never;

type ModuleLevelBridgeOptionsToConnectorType<
  Options extends ModuleLevelBridgeOptions
> = ConnectorType & Options extends { kind: 'network' }
  ? { protocols: { tcp: true; udp: true; sctp: true } }
  : Options extends { kind: 'files' }
  ? { readonly: false; persistent: false }
  : never;

// type Not<A extends boolean> = A extends true ? false : true;

type And<A extends boolean, B extends boolean> = A | B extends true
  ? true
  : false;

// type Or<A extends boolean, B extends boolean> = A extends true
//   ? true
//   : B extends true
//   ? true
//   : false;

type Implies<A extends boolean, B extends boolean> = A extends true
  ? B extends false
    ? false
    : true
  : true;

type Equivalent<A extends boolean, B extends boolean> = And<
  Implies<A, B>,
  Implies<B, A>
>;

type All<A extends { [K in string]: boolean }> = boolean extends A[keyof A]
  ? false
  : A[keyof A];

type ImpliesAll<
  A extends { [K in string]: boolean },
  B extends { [K in string]: boolean }
> = keyof A extends keyof B
  ? keyof B extends keyof A
    ? All<{
        [K in keyof A]: Implies<A[K], B[K]>;
      }>
    : never
  : never;

type EquivalentAll<
  A extends { [K in string]: boolean },
  B extends { [K in string]: boolean }
> = keyof A extends keyof B
  ? keyof B extends keyof A
    ? All<{
        [K in keyof A]: Equivalent<A[K], B[K]>;
      }>
    : never
  : never;

// for true A must be a more or equally narrow type than B
type ConnectorTypeExtends<
  A extends ConnectorType,
  B extends ConnectorType
> = A extends { kind: 'network' }
  ? B extends { kind: 'network' }
    ? And<
        ImpliesAll<A['protocols'], B['protocols']>,
        ImpliesAll<A['direction'], B['direction']>
      >
    : false
  : A extends { kind: 'files' }
  ? B extends { kind: 'files' }
    ? And<
        Equivalent<A['persistent'], B['persistent']>,
        Implies<B['readonly'], A['readonly']>
      >
    : false
  : never;

type ConnectorID<ConnectorType_ extends ConnectorType> = {
  readonly id: symbol;
  readonly type: ConnectorType_;
};

type ConnectorArgs = {
  [K in string]: ConnectorType;
};

type ModuleOptions = any;

type DDModuleAPI = {
  createBridge: <BridgeOptions extends ModuleLevelBridgeOptions>(
    options: BridgeOptions
  ) => ModuleLevelBridgeOptionsToConnectorType<BridgeOptions>;

  createSubmodule: <
    ConnectorArgs_ extends ConnectorArgs,
    ModuleOptions_ extends ModuleOptions
  >(
    module: Module<ConnectorArgs_, ModuleOptions_>,
    connectors: { [K in keyof ConnectorArgs_]: ConnectorID<ConnectorArgs_[K]> },
    options: ModuleOptions_
  ) => void; //todo: maybe return DDSubmoduleAPI

  downcastConnector: <
    CastFrom extends ConnectorType,
    CastTo extends ConnectorType
  >(
    connector: ConnectorID<CastFrom>,
    type: CastTo
  ) => ConnectorTypeExtends<CastTo, CastFrom> extends true
    ? ConnectorID<CastTo>
    : never;
};

type Module<
  ConnectorArgs_ extends ConnectorArgs,
  ModuleOptions_ extends ModuleOptions
> = {
  configure: (api: DDModuleAPI) => void;
};

type DDLaunchAPI = {
  createBridge: <BridgeOptions extends TopLevelBridgeOptions>(
    options: BridgeOptions
  ) => TopLevelBridgeOptionsToConnectorType<BridgeOptions>;

  createEntryPoint: <
    ConnectorArgs_ extends ConnectorArgs,
    ModuleOptions_ extends ModuleOptions
  >(
    module: Module<ConnectorArgs_, ModuleOptions_>,
    connectors: { [K in keyof ConnectorArgs_]: ConnectorID<ConnectorArgs_[K]> },
    options: ModuleOptions_
  ) => EntryPointID;
};

type EntryPointID = {
  id: symbol;
};

type InstanceID = {
  id: symbol;
};

type DockerDude = {
  launch: (
    configureFunction: (api: DDLaunchAPI) => EntryPointID
  ) => Promise<InstanceID>;

  stop: (id: InstanceID) => Promise<InstanceID>;
};
