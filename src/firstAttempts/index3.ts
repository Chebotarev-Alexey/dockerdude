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

type PortType = {
  readonly protocol: 'tcp' | 'udp' | 'sctp'; // invariant
};

type SubModulePortDef<
  PortType_ extends PortType,
  NonImageModuleGeneric_ extends NonImageModuleGeneric,
  SubModuleName extends keyof NonImageModuleGeneric_['submodules'],
  PortKey extends keyof NonImageModuleGeneric_['submodules'][SubModuleName]['ports']
> = NonImageModuleGeneric_['submodules'][SubModuleName]['ports'][PortKey] extends PortType_
  ? { readonly from: SubModuleName; readonly key: PortKey }
  : never;

type MyPortDef<
  PortType_ extends PortType,
  ModuleGeneric_ extends ModuleGeneric,
  PortKey extends keyof ModuleGeneric_['ports']
> = ModuleGeneric_['ports'][PortKey] extends PortType_ ? PortKey : never;

type PortsMapping<
  PortType_ extends PortType,
  ModuleGeneric_ extends ModuleGeneric,
  NonImageModuleGeneric_ extends NonImageModuleGeneric
> = (
  | SubModulePortDef<
      PortType_,
      NonImageModuleGeneric_,
      keyof NonImageModuleGeneric_['submodules'],
      keyof NonImageModuleGeneric_['submodules'][keyof NonImageModuleGeneric_['submodules']]['ports']
    >
  | MyPortDef<PortType_, ModuleGeneric_, keyof ModuleGeneric_['ports']>
)[];

type SubModuleVolumeDef<
  NonImageModuleGeneric_ extends NonImageModuleGeneric,
  VolumeType_ extends VolumeType,
  SubModuleKey extends keyof NonImageModuleGeneric_['submodules'],
  SubModuleVolumeKey extends keyof NonImageModuleGeneric_['submodules'][SubModuleKey]['volumes']
> = VolumeTypeExtends<
  VolumeType_,
  NonImageModuleGeneric_['submodules'][SubModuleKey]['volumes'][SubModuleVolumeKey]
> extends true
  ? { readonly from: SubModuleKey; readonly key: SubModuleVolumeKey }
  : never;

type MyVolumeDef<
  ModuleGeneric_ extends ModuleGeneric,
  VolumeType_ extends VolumeType,
  VolumeKey extends keyof ModuleGeneric_['volumes']
> = VolumeTypeExtends<
  VolumeType_,
  ModuleGeneric_['volumes'][VolumeKey]
> extends true
  ? VolumeKey | { readonly allocateIn: VolumeKey; readonly name: string }
  : never;

type VolumesMapping<
  VolumeType_ extends VolumeType,
  ModuleGeneric_ extends ModuleGeneric,
  NonImageModuleGeneric_ extends NonImageModuleGeneric
> = {
  readonly from: MyVolumeDef<
    ModuleGeneric_,
    VolumeType_,
    keyof ModuleGeneric_['volumes']
  >;
  readonly to: SubModuleVolumeDef<
    NonImageModuleGeneric_,
    VolumeType_,
    keyof NonImageModuleGeneric_['submodules'],
    keyof NonImageModuleGeneric_['submodules'][keyof NonImageModuleGeneric_['submodules']]['volumes']
  >;
};

type NonImageModule<
  ModuleGeneric_ extends ModuleGeneric,
  NonImageModuleGeneric_ extends NonImageModuleGeneric
> = {
  readonly submodules: {
    readonly [Key in keyof NonImageModuleGeneric_['submodules']]: _Module<
      NonImageModuleGeneric_['submodules'][Key]
    >;
  };
  readonly volumes: {
    readonly [Key in keyof ModuleGeneric_['volumes']]: ModuleGeneric_['volumes'][Key];
  };
  readonly ports: {
    readonly [Key in keyof ModuleGeneric_['ports']]: ModuleGeneric_['ports'][Key];
  };
  readonly mappings: {
    readonly volumes: VolumesMapping<
      VolumeType,
      ModuleGeneric_,
      NonImageModuleGeneric_
    >[];
    readonly ports: PortsMapping<
      PortType,
      ModuleGeneric_,
      NonImageModuleGeneric_
    >[];
  };
};

type ModuleGeneric = {
  readonly volumes: {
    readonly [Key in string]: VolumeType;
  };
  readonly ports: {
    readonly [Key in string]: PortType;
  };
};

type NonImageModuleGeneric = {
  // module: ModuleGenericBase;
  readonly submodules: {
    readonly [Key in string]: ModuleGeneric;
  };
};

type HostVolume<VolumeType_ extends VolumeType> = VolumeType_ &
  ({ readonly path: string } | { readonly name: string });

type ContainerVolume<VolumeType_ extends VolumeType> = VolumeType_ &
  ({ readonly path: string } | { readonly name: string });

type PortDef = {
  readonly number: number;
  readonly host?: string;
};

type HostPort<PortType_ extends PortType> = PortType_ &
  (
    | {
        readonly port: PortDef | 'random';
      }
    | { readonly ports: PortDef[] }
  );

type ContainerPort<PortType_ extends PortType> = PortType_ & {
  readonly number: number;
};

type ImageModule<ModuleGeneric_ extends ModuleGeneric> = {
  readonly image: string;
  readonly volumes: {
    readonly [Key in keyof ModuleGeneric_['volumes']]: ModuleGeneric_['volumes'][Key];
  };
  readonly ports: {
    readonly [Key in keyof ModuleGeneric_['ports']]: ModuleGeneric_['ports'][Key];
  };
};

type _Module<ModuleGeneric_ extends ModuleGeneric> =
  | ImageModule<ModuleGeneric_>
  | NonImageModule<ModuleGeneric_, NonImageModuleGeneric>;

type Module = _Module<ModuleGeneric>;

let imageA = {
  image: 'asd',
  volumes: { v1: { readonly: true } },
  ports: { p1: { protocol: 'tcp' } }
} as const;

let B: Module = {
  submodules: { myA: imageA },
  ports: { p1: { protocol: 'udp' } },
  volumes: { v1: { readonly: true } },
  // mappings: {
  //   volumes: [],
  //   ports: []
  // }
  mappings: {
    volumes: [],
    ports: [['p2', { from: 'myA', key: 'p1' }]]
  }
} as const;

type D = typeof B;

type C = D extends NonImageModule<infer V, NonImageModuleGeneric> ? V : 123;
