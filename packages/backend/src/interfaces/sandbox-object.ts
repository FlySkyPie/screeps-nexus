import StorageInstance from "@screeps/common/src/storage";

export interface ISandboxObject {
    print(): void;
    storage: typeof StorageInstance;
    map: any;
    bots: any;
    strongholds: any;
    system: any;

    help?: any;
};
