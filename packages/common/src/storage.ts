import { ConfigManager } from './config-manager';

class StorageInstance {
    public static resetAllData: any;

    public static _connected = false;

    public static db: Record<string, any> = {};

    public static queue: Record<string, any> = {};

    public static env: Record<string, any> = {
    };

    public static pubsub: any = {
        keys: {
            QUEUE_DONE: 'queueDone:',
            RUNTIME_RESTART: 'runtimeRestart',
            TICK_STARTED: "tickStarted",
            ROOMS_DONE: "roomsDone"
        }
    };
};

export default StorageInstance;

ConfigManager.config.common.storage = StorageInstance;
