#!/usr/bin/env node
import q from 'q';
import _ from 'lodash';

import * as driver from '@screeps/driver/src/index';

import global from './processor/global';
import { logger } from './logger';

let lastAccessibleRoomsUpdate = 0;
let roomsQueue: any, usersQueue: any;

function loop() {
    let resetInterval: any;
    const startLoopTime: any = process.hrtime ? process.hrtime() : Date.now();
    let stage = 'start';

    driver.config.emit('mainLoopStage', stage);


    if (typeof self == 'undefined') {
        resetInterval = setInterval(() => {
            console.error('Main loop reset! Stage:', stage);
            driver.queue.resetAll();
        }, driver.config.mainLoopResetInterval);
    }

    driver.notifyTickStarted()
        .then(() => {
            stage = 'getUsers';
            driver.config.emit('mainLoopStage', stage);
            return driver.getAllUsers();
        })
        .then((users: any) => {
            stage = 'addUsersToQueue';
            driver.config.emit('mainLoopStage', stage, users);
            return usersQueue.addMulti(users.map((user: any) => user._id.toString()));
        })
        .then(() => {
            stage = 'waitForUsers';
            driver.config.emit('mainLoopStage', stage);
            return usersQueue.whenAllDone();
        })
        .then(() => {
            stage = 'getRooms';
            driver.config.emit('mainLoopStage', stage);
            return driver.getAllRooms();
        })
        .then((rooms: any) => {
            stage = 'addRoomsToQueue';
            driver.config.emit('mainLoopStage', stage, rooms);
            return roomsQueue.addMulti(_.map(rooms, (room: any) => room._id.toString()))
        })
        .then(() => {
            stage = 'waitForRooms';
            driver.config.emit('mainLoopStage', stage);
            return roomsQueue.whenAllDone();
        })
        .then(() => {
            stage = 'commit1';
            driver.config.emit('mainLoopStage', stage);
            return driver.commitDbBulk();
        })
        .then(() => {
            stage = 'global';
            driver.config.emit('mainLoopStage', stage);
            return global();
        })
        .then(() => {
            stage = 'commit2';
            driver.config.emit('mainLoopStage', stage);
            return driver.commitDbBulk();
        })
        .then(() => {
            stage = 'incrementGameTime';
            driver.config.emit('mainLoopStage', stage);
            return driver.incrementGameTime()
        })
        .then((gameTime: any) => {
            logger.debug(`Game time set to ${gameTime}`);
            if (+gameTime > lastAccessibleRoomsUpdate + 20) {
                driver.updateAccessibleRoomsList();
                lastAccessibleRoomsUpdate = +gameTime;
            }

            stage = 'notifyRoomsDone';
            driver.config.emit('mainLoopStage', stage);
            return driver.notifyRoomsDone(gameTime);
        })
        .then(() => {
            stage = 'custom';
            driver.config.emit('mainLoopStage', stage);
            return driver.config.mainLoopCustomStage();
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

            driver.config.emit('mainLoopStage', 'finish');

            setTimeout(loop, Math.max(driver.config.mainLoopMinDuration - usedTime, 0));
        })
        .catch((error: any) => {
            console.error(`'Error while main loop (final):`, _.isObject(error) && error.stack ? error.stack : error);
        });
}

driver.connect('main')
    .then(() => q.all([
        driver.queue.create('rooms', 'write'),
        driver.queue.create('users', 'write'),
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