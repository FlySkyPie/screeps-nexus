import type { EventEmitter } from 'node:events';

import type { Resource } from '../constants/resource';

export interface IStrongholds {
    templates: any;
    coreRewards: Record<string, Resource[]>;
    coreAmounts: number[];
    coreDensities: number[];
    containerRewards: Record<string, number>;
    containerAmounts: number[];
}

export interface ISystem {
    sanitizeUserIntents(input: any, customIntentTypes?: any): any;
    sanitizeUserRoomIntents(input: any, result: any, customIntentTypes?: {}, groupingField?: string): void;
}

export interface ICommon {
    strongholds: IStrongholds;
    system: ISystem;
    bots: Record<string, any>;

    [key: string]: any;
}

export interface IConfig {
    common: ICommon;
    storage: EventEmitter & Record<string, any>;
    backend: EventEmitter & Record<string, any>;
    cli: EventEmitter & Record<string, any>;

    engine?: EventEmitter & Record<string, any>;

    [key: string]: any;
}
