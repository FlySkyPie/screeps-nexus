#!/usr/bin/env node
import q from 'q';
import _ from 'lodash';

import { ConfigManager } from '@screeps/common/src/config-manager';
import {
    commitDbBulk, connect,
    getAllRooms, getAllUsers,
    incrementGameTime, notifyRoomsDone,
    notifyTickStarted, queue,
    updateAccessibleRoomsList
} from '@screeps/driver/src';

import global from './processor/global';
import { logger } from './logger';

let lastAccessibleRoomsUpdate = 0;
let roomsQueue: any, usersQueue: any;

function loop() {
    let resetInterval: any;
    const startLoopTime: any = process.hrtime ? process.hrtime() : Date.now();
    let stage = 'start';

    ConfigManager.config.engine!.emit('mainLoopStage', stage);

    if (typeof self == 'undefined') {
        resetInterval = setInterval(() => {
            console.error('Main loop reset! Stage:', stage);
            queue.resetAll();
        }, ConfigManager.config.engine!.mainLoopResetInterval);
    }

    notifyTickStarted()
        .then(() => {
            stage = 'getUsers';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return getAllUsers();
        })
        .then((users: any) => {
            stage = 'addUsersToQueue';
            ConfigManager.config.engine!.emit('mainLoopStage', stage, users);
            return usersQueue.addMulti(users.map((user: any) => user._id.toString()));
        })
        .then(() => {
            stage = 'waitForUsers';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return usersQueue.whenAllDone();
        })
        .then(() => {
            stage = 'getRooms';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return getAllRooms();
        })
        .then((rooms: any) => {
            stage = 'addRoomsToQueue';
            ConfigManager.config.engine!.emit('mainLoopStage', stage, rooms);
            return roomsQueue.addMulti(_.map(rooms, (room: any) => room._id.toString()))
        })
        .then(() => {
            stage = 'waitForRooms';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return roomsQueue.whenAllDone();
        })
        .then(() => {
            stage = 'commit1';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return commitDbBulk();
        })
        .then(() => {
            stage = 'global';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return global();
        })
        .then(() => {
            stage = 'commit2';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return commitDbBulk();
        })
        .then(() => {
            stage = 'incrementGameTime';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return incrementGameTime()
        })
        .then((gameTime: any) => {
            logger.debug(`Game time set to ${gameTime}`);
            if (+gameTime > lastAccessibleRoomsUpdate + 20) {
                updateAccessibleRoomsList();
                lastAccessibleRoomsUpdate = +gameTime;
            }

            stage = 'notifyRoomsDone';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return notifyRoomsDone(gameTime);
        })
        .then(() => {
            stage = 'custom';
            ConfigManager.config.engine!.emit('mainLoopStage', stage);
            return ConfigManager.config.engine!.mainLoopCustomStage();
        })
        .catch((error: any) => {
            if (error == 'Simulation paused') {
                return;
            }
            console.error(`Error while main loop (stage ${stage}):`, _.isObject(error) && error.stack ? error.stack : error);
        })
        .finally(() => {

            if (resetInterval) {
                clearInterval(resetInterval);
            }

            let usedTime;
            if (process.hrtime) {
                usedTime = process.hrtime(startLoopTime);
                usedTime = usedTime[0] * 1e3 + usedTime[1] / 1e6;
            }
            else {
                usedTime = Date.now() - startLoopTime;
            }

            ConfigManager.config.engine!.emit('mainLoopStage', 'finish');

            setTimeout(loop, Math.max(ConfigManager.config.engine!.mainLoopMinDuration - usedTime, 0));
        })
        .catch((error: any) => {
            console.error(`'Error while main loop (final):`, _.isObject(error) && error.stack ? error.stack : error);
        });
}

connect('main')
    .then(() => q.all([
        queue.create('rooms', 'write'),
        queue.create('users', 'write'),
    ]))
    .catch((error: any) => {
        console.error('Error connecting to driver:', error);
        process.exit(1);
    })
    .then((data: any) => {
        roomsQueue = data[0];
        usersQueue = data[1];
        loop();
    });

if (typeof self == 'undefined') {
    setInterval(() => {
        const rejections = (q as any).getUnhandledReasons();
        rejections.forEach((i: any) => console.error(`Unhandled rejection: ${i}`));
        (q as any).resetUnhandledRejections();
    }, 1000);
}