import { EventEmitter } from 'events';

import { ConfigManager } from "@screeps/common/src/config-manager";
import StorageInstance from "@screeps/common/src/storage";

export abstract class TopLevel {
    public static db = StorageInstance.db;
    public static env = StorageInstance.env;
    public static pubsub = StorageInstance.pubsub;
    public static _config = Object.assign(ConfigManager.config, { engine: new EventEmitter() });
    public static roomStatsUpdates: Record<string, any> = {};
};
