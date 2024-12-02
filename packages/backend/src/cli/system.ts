import util from 'util';
import * as common from '@screeps/common/src';
const config = common.configManager.config;
const C = config.common.constants;
const db = common.storage.db;
const env = common.storage.env;
const pubsub = common.storage.pubsub;
import q from 'q';
import fs from 'fs';
import _ from 'lodash';
import zlib from 'zlib';
import utils from '../utils';
import path from 'path';

export var resetAllData = utils.withHelp([
    "resetAllData() - Wipe all world data and reset the database to the default state.",
    function resetAllData() {
        return common.storage.resetAllData();
    }
]);

export var sendServerMessage = utils.withHelp([
    'sendServerMessage(message) - Send a text server message to all currently connected players.',
    function sendServerMessage(message) {
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
    function runCronjob(jobName) {
        if(!config.cronjobs[jobName]) {
            return q.reject(`Cronjob "${jobName}" not found`);
        }

        return q.when(config.cronjobs[jobName][1]()).then(() => 'OK');
    }
]);

export var _help = utils.generateCliHelp('system.', exports);