import Docker from 'dockerode';

type PlugSignature = 'volume' | 'port';

// type ResourceSocket<Signature extends ResourceSignature> = {
//   readonly signature: Signature;
// };

type Plug<Signature extends PlugSignature> = {
  readonly signature: Signature;
  readonly key: unique symbol;
  // plugInto: (socket: ResourceSocket<Signature>) => void;
};

// type PlugsFromSockets<
//   Sockets extends { [key: string]: ResourceSocket<ResourceSignature> }
// > = {
//   [Key in keyof Sockets]: Sockets[Key] extends ResourceSocket<infer Signature>
//     ? ResourcePlug<Signature>
//     : never;
// };

// type Module<
//   Sockets extends { [key: string]: ResourceSocket<ResourceSignature> }
// > = {
//   // sockets: Sockets;

//   init: (plugs: PlugsFromSockets<Sockets>) => void; // todo - return something
//   // todo - add something like get submodules and images
// };

type Module<
  Plugs extends { [key: string]: Plug<PlugSignature> },
  Options extends {}
> = {
  // sockets: Sockets;
  readonly name: string; // maybe remove because can't ensure unique
  init: (plugs: Plugs, options: Options) => StartupData; // todo - return something
  // todo - add something like get submodules and images
};

type ContainerStartupData = {
  image: string;
  plugs: Plug<PlugSignature>[];
};

type StartupData = {
  containers: ContainerStartupData[];
};

type Port = Docker.PortBinding;

type Volume = string;

type SigntureToInputData<Signature> = Signature extends 'volume'
  ? Volume
  : Signature extends 'port'
  ? Port
  : never;

type PlugToInputData<Plug_ extends Plug<PlugSignature>> = Plug_ extends Plug<
  infer Signature
>
  ? SigntureToInputData<Signature>
  : never;

class Dockerdude {
  mergeStartupData = (...startupData: StartupData[]) => {
    return { containers: startupData.flatMap((sd) => sd.containers) };
  };

  runModule = <
    Plugs extends { [key: string]: Plug<PlugSignature> },
    Options extends {}
  >(
    module: Module<Plugs, Options>,
    plugIn: { [Key in keyof Plugs]: PlugToInputData<Plugs[Key]> },
    options: Options
  ) => {
    const plugs: Plugs = Object.fromEntries(
      Object.entries(plugIn).map(([key, value]) => [key, Symbol(key)])
    ) as unknown as Plugs;

    this.runByStartupData(module.init(plugs, options));
  };

  private runByStartupData = <
    Plugs extends { [key: string]: Plug<PlugSignature> }
  >(
    startupData: StartupData,
    plugIn: { [Key in keyof Plugs]: PlugToInputData<Plugs[Key]> }
  ) => {};
}
