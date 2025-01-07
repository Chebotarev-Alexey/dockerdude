import Docker from 'dockerode';

type SignatureGenericBase = {
  ports: {
    [key: string]: true;
  };
  volumes: {
    [key: string]: true;
  };
};

type DockerDudeModuleSignature<SignatureGeneric extends SignatureGenericBase> =
  {
    ports: {
      [key in keyof SignatureGeneric['ports']]: {
        doc?: string;
      };
    };
    volumes: {
      [key in keyof SignatureGeneric['volumes']]: {
        doc?: string;
        readonly: boolean;
      };
    };
  };

type SubModuleDeclaration<
  SignatureGeneric extends SignatureGenericBase,
  SubSignatureGeneric extends SignatureGenericBase
> = {
  module: DockerdudeModule<SubSignatureGeneric>;
  mappings: {
    ports: {
      out: keyof SignatureGeneric['ports'];
      into: keyof SubSignatureGeneric['ports'];
    }[];
    volumes: {
      out: keyof SignatureGeneric['volumes'];
      into: keyof SubSignatureGeneric['volumes'];
    }[];
  };
};

type SubModules<SignatureGeneric extends SignatureGenericBase> = SubModuleDeclaration<
        SignatureGeneric,
        SignatureGenericBase
      >[]

type DockerdudeModule<SignatureGeneric extends SignatureGenericBase> = {
  signature: DockerDudeModuleSignature<SignatureGeneric>;
  name: string;
} & (
  | {
      subModules: SubModules<SignatureGeneric>;
    }
  | {
      image: string;
    }
);

type ActionType = 'start' | 'stop' | 'restart';

type Controllers<
  SignatureGeneric extends SignatureGenericBase,
  Module extends DockerdudeModule<SignatureGeneric>
> = Module extends { subModules: SubModules<SignatureGenericBase> } ? {
  [key in keyof Module['subModules']]: Controllers<
    SignatureGeneric,
    Module['subModules'][key]['module']
}

class Dockerdude<
  SignatureGeneric extends SignatureGenericBase,
  Module extends DockerdudeModule<SignatureGeneric>
> {
  private controllers: {
    [key in keyof Module['']]: (actionType: ActionType) => void;
  };

  constructor(
    public module: DockerdudeModule<SignatureGeneric>,
    public generateContainerName: (moduleNames: string[]) => string
  ) {}

  async run() {
    const docker = new Docker();
    const container = await docker.createContainer({
      Image: this.module.image,
      name: this.generateContainerName([this.module.name]),
      HostConfig: {
        PortBindings: Object.fromEntries(
          Object.entries(this.options.ports).map(([key, value]) => [
            `${value}/tcp`,
            [{ HostPort: `${value}` }]
          ])
        ),
        Binds: Object.entries(this.options.volumes).map(
          ([key, value]) => `${value}:${key}`
        )
      }
    });
    await container.start();
  }
}

const runModule = async <SignatureGeneric extends SignatureGenericBase>(
  module: DockerdudeModule<SignatureGeneric>,
  options: {
    ports: {
      [key in keyof SignatureGeneric['ports']]: number;
    };
    volumes: {
      [key in keyof SignatureGeneric['volumes']]: string;
    };
  },
  generateContainerName: (moduleNames: string[]) => string
) => {};
