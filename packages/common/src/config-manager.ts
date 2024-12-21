import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'node:events';

import type { Resource } from './constants/resource';
import * as strongholds from './strongholds';
import * as system from './system';
import { ProjectConfig } from './constants/project-config';

interface IStrongholds {
    templates: any;
    coreRewards: Record<string, Resource[]>;
    coreAmounts: number[];
    coreDensities: number[];
    containerRewards: Record<string, number>;
    containerAmounts: number[];
}

interface ISystem {
    sanitizeUserIntents(input: any, customIntentTypes?: any): any;
    sanitizeUserRoomIntents(input: any, result: any, customIntentTypes?: {}, groupingField?: string): void;
}

interface IConfig {
    common: {
        strongholds: IStrongholds;
        system: ISystem;
        bots: Record<string, any>;
        [key: string]: any;
    };
    storage: EventEmitter & Record<string, any>;
    backend: EventEmitter & Record<string, any>;
    cli: EventEmitter & Record<string, any>;

    engine?: EventEmitter & Record<string, any>;

    [key: string]: any;
}

export const config: IConfig = {
    common: {
        strongholds: strongholds,
        system: system,
        bots: {}
    },
    storage: new EventEmitter(),
    backend: new EventEmitter(),
    cli: new EventEmitter(),
};

export function load() {
    if (!ProjectConfig.MODFILE) {
        // throw new Error('MODFILE environment variable is not set!');
        console.warn('MODFILE environment variable is not set!');
        return;
    }
    const modsJsonFilename = path.resolve(process.cwd(), ProjectConfig.MODFILE);
    try {
        fs.statSync(modsJsonFilename);
    }
    catch (e) {
        console.log(`File "${modsJsonFilename}" not found`);
        return;
    }

    try {
        const modStr = fs.readFileSync(modsJsonFilename, { encoding: 'utf8' });
        const modsJson = JSON.parse(modStr);
        console.log(`Loading mods from "${modsJsonFilename}"`);
        if (!modsJson.mods) {
            return;
        }

        modsJson.mods.forEach((file: any) => {
            file = path.resolve(path.dirname(modsJsonFilename), file);
            try {
                const mod = require(file);
                if (!_.isFunction(mod)) {
                    console.error(`Cannot load "${file}": module.exports is not a function!`);
                }
                else {
                    mod(config);
                    console.log(' - ' + file);
                }
            }
            catch (e: any) {
                console.error(`Error loading "${file}": ${e.stack || e}`);
            }
        });

        if (modsJson.bots) {
            config.common.bots = _.mapValues(modsJson.bots, i => path.resolve(path.dirname(modsJsonFilename), i));
        }
    }
    catch (e) {
        console.error(`Cannot open "${modsJsonFilename}": ${e}`);
    }
}

export abstract class ConfigManager {
    public static config = config;

    public static load = load;
};
