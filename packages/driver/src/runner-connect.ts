import { EventEmitter } from 'events';
import q from 'q';
import _ from 'lodash';

import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';
import { calcWorldSize } from '@screeps/common/src';

import './native';
import * as runtimeUserVm from './runtime/user-vm';
import { WorldSizeContainer } from './variables/world-size';

const _config = Object.assign(ConfigManager.config, { engine: new EventEmitter() });

_.extend(_config.engine, {
    // driver: exports,
    // driver: {
    //     config: _config.engine,
    //     customObjectPrototypes,
    //     getAllTerrainData,
    //     pathFinder,
    // },
    mainLoopMinDuration: 200,
    mainLoopResetInterval: 5000,
    mainLoopCustomStage() {
        return q.when();
    },
    cpuMaxPerTick: 500,
    cpuBucketSize: 10000,
    customIntentTypes: {},
    historyChunkSize: 20,
    useSigintTimeout: false,
    reportMemoryUsageInterval: 0,
    enableInspector: false,
});

export async function connect() {

    ConfigManager.load();

    return StorageInstance._connect()
        .then(() => {
            runtimeUserVm.init();
            StorageInstance.pubsub.subscribe(
                StorageInstance.pubsub.keys.RUNTIME_RESTART,
                () => {
                    console.log('runtime restart signal');
                    runtimeUserVm.clearAll();
                });
        })
        .then(() => StorageInstance.db.rooms.find({}, { _id: true }))
        .then(calcWorldSize)
        .then((_worldSize: any) => WorldSizeContainer.worldSize = _worldSize)
        .then(() => {
            _config.engine.emit('init', 'runner');
            return true;
        });
}