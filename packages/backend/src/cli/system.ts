import q from 'q';
import _ from 'lodash';

import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';

import * as utils from '../utils';

const config = ConfigManager.config;
const env = StorageInstance.env;
const pubsub = StorageInstance.pubsub;

export var resetAllData = utils.withHelp([
    "resetAllData() - Wipe all world data and reset the database to the default state.",
    function resetAllData() {
        return StorageInstance.resetAllData();
    }
]);

export var sendServerMessage = utils.withHelp([
    'sendServerMessage(message) - Send a text server message to all currently connected players.',
    function sendServerMessage(message: any) {
        return pubsub.publish('serverMessage', message);
    }
]);

export var pauseSimulation = utils.withHelp([
    'pauseSimulation() - Stop main simulation loop execution.',
    function pauseSimulation() {
        return env.set(env.keys.MAIN_LOOP_PAUSED, '1').then(() => 'OK');
    }
]);

export var resumeSimulation = utils.withHelp([
    'resumeSimulation() - Resume main simulation loop execution.',
    function resumeSimulation() {
        return env.set(env.keys.MAIN_LOOP_PAUSED, '0').then(() => 'OK');
    }
]);

export var runCronjob = utils.withHelp([
    'runCronjob(jobName) - Run a cron job immediately.',
    function runCronjob(jobName: any) {
        if (!config.cronjobs[jobName]) {
            return q.reject(`Cronjob "${jobName}" not found`);
        }

        return q.when(config.cronjobs[jobName][1]()).then(() => 'OK');
    }
]);

export var _help = utils.generateCliHelp('system.', exports);
