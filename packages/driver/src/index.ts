import { EventEmitter } from 'events';
import q from 'q';
import _ from 'lodash';
import os from 'os';
import zlib from 'zlib';
import genericPool from 'generic-pool';
import common from '@screeps/common';

import bulk from './bulk';
import * as queue from './queue';
import * as runtimeUserVm from './runtime/user-vm';

const db = common.storage.db;
const env = common.storage.env;
const pubsub = common.storage.pubsub;
const _config = Object.assign(common.configManager.config, { engine: new EventEmitter() });
const roomStatsUpdates = {};
let worldSize: any;

_.extend(_config.engine, {
    driver: exports,
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

_config.engine.on('playerSandbox', (sandbox) => {
    sandbox.run(`Game.shard = Object.create(null, {
        name: {
            value: "${os.hostname()}",
            writable: true,
            enumerable: true
        },
        type: {
            value: 'normal',
            writable: true,
            enumerable: true
        },
        ptr: {
            value: false,
            enumerable: true
        }
    });`);
});

export var customObjectPrototypes = [];

Object.defineProperty(_config.engine, 'registerCustomObjectPrototype', {
    value: function (objectType, name, opts) {
        if (!objectType) {
            throw new Error('No object type provided!');
        }
        if (!name) {
            throw new Error('No prototype name provided!');
        }
        exports.customObjectPrototypes.push({ objectType, name, opts });
    }
});

export var config = _config.engine;

function checkNotificationOnline(userId) {
    return q.when(true); // TODO
}

function getAllTerrainData() {
    return env.get(env.keys.TERRAIN_DATA)
        .then(compressed => {
            const buf = Buffer.from(compressed, 'base64');
            return q.ninvoke(zlib, 'inflate', buf);
        })
        .then(data => JSON.parse(data));
}

export { getAllTerrainData };
import pathFinderFactory from './path-finder';
export var pathFinder = pathFinderFactory.create(require('../native/build/Release/native'));

export function connect(processType) {

    common.configManager.load();

    return common.storage._connect()
        .then(() => {

            if (processType == 'runner') {
                runtimeUserVm.init();
                pubsub.subscribe(pubsub.keys.RUNTIME_RESTART, () => {
                    console.log('runtime restart signal');
                    runtimeUserVm.clearAll();
                });
            }

            if (processType == 'runtime') {
            }

            if (processType == 'processor') {
                getAllTerrainData()
                    .then(rooms => pathFinderFactory.init(require('../native/build/Release/native'), rooms));
            }

            if (processType == 'main') {
            }
        })
        .then(() => db.rooms.find({}, { _id: true }))
        .then(common.calcWorldSize)
        .then(_worldSize => worldSize = _worldSize)
        .then(() => {
            _config.engine.emit('init', processType);
            return true;
        });
}

export function getAllUsers() {
    return db.users.find({ $and: [{ active: { $ne: 0 } }, { cpu: { $gt: 0 } }] })
        .then((data) => {
            data.sort((a, b) => (b.lastUsedDirtyTime || 0) - (a.lastUsedDirtyTime || 0));

            return data;
        })
}

export function saveUserMemory(userId, memory) {

    if (memory.data.length > 2 * 1024 * 1024) {
        return q.reject('Script execution has been terminated: memory allocation limit reached');
    }

    return env.set(env.keys.MEMORY + userId, memory.data);
}

export function saveUserMemorySegments(userId, segments) {

    if (Object.keys(segments).length > 0) {
        return env.hmset(env.keys.MEMORY_SEGMENTS + userId, segments);
    }
    return q.when();
}

export function saveUserIntents(userId, intents) {
    const updates = [];
    for (const room in intents) {

        if (room == 'notify') {
            updates.push(checkNotificationOnline(userId)
                .then(() => {

                    if (intents.notify.length > 20) {
                        intents.notify = _.take(intents.notify, 20);
                    }

                    const promises = [q.when()];

                    intents.notify.forEach((i) => {
                        if (i.groupInterval < 0) {
                            i.groupInterval = 0;
                        }
                        if (i.groupInterval > 1440) {
                            i.groupInterval = 1440;
                        }
                        i.groupInterval *= 60 * 1000;
                        i.groupInterval = Math.floor(i.groupInterval);
                        const date = i.groupInterval ?
                            new Date(Math.ceil(new Date().getTime() / i.groupInterval) * i.groupInterval) :
                            new Date();


                        const message = ("" + i.message).substring(0, 500);

                        promises.push(db['users.notifications'].update({
                            $and: [
                                { user: userId },
                                { message },
                                { date: date.getTime() },
                                { type: 'msg' }
                            ]
                        }, {
                            $inc: { count: 1 }
                        },
                            { upsert: true }));
                    });

                    return q.all(promises);
                }));
            continue;
        }

        if (room == 'global') {
            updates.push(db['users.intents'].insert({ user: userId, intents: intents[room] }));
            continue;
        }

        updates.push(
            db['rooms.intents'].update({ room }, { $merge: { users: { [userId]: { objects: intents[room] } } } }, { upsert: true }));
    }

    return q.all(updates);
}

export function getAllRooms() {
    return db.rooms.find({ active: true });
}

export function getRoomIntents(roomId) {
    return db['rooms.intents'].findOne({ room: roomId });
}

export function getRoomObjects(roomId) {
    const result = {};
    return db['rooms.objects'].find({ room: roomId })
        .then((objects) => {
            let users = {};
            result.objects = exports.mapById(objects, obj => {
                if (obj.user) {
                    users[obj.user] = true;
                }
            });
            users = Object.keys(users);
            if (users.length) {
                return db['users'].find({ _id: { $in: users } })
            }
            else {
                return [];
            }
        })
        .then(users => {
            result.users = exports.mapById(users);
            return result;
        });
}

export function getRoomFlags(roomId) {
    return db['rooms.flags'].find({ room: roomId });
}

export function getRoomTerrain(roomId) {
    return db['rooms.terrain'].find({ room: roomId })
        .then((result) => exports.mapById(result));
}

export function bulkObjectsWrite() {
    return bulk('rooms.objects');
}

export function bulkFlagsWrite() {
    return bulk('rooms.flags');
}

export function bulkUsersWrite() {
    return bulk('users');
}

export function bulkRoomsWrite() {
    return bulk('rooms');
}

export function bulkTransactionsWrite() {
    return bulk('transactions');
}

export function bulkMarketOrders() {
    return bulk('market.orders');
}

export function bulkMarketIntershardOrders() {
    return bulk('market.orders');
}

export function bulkUsersMoney() {
    return bulk('users.money');
}

export function bulkUsersResources() {
    return bulk('users.resources');
}

export function bulkUsersPowerCreeps() {
    return bulk('users.power_creeps');
}

export function clearRoomIntents(roomId) {
    return db['rooms.intents'].removeWhere({ room: roomId });
}

export function clearGlobalIntents() {
    return db['users.intents'].clear();
}

export function mapById(array, fn) {
    return _.reduce(array, (result, i) => {
        result[i._id.toString()] = i;
        fn && fn(i);
        return result;
    }, {});
}

export function notifyTickStarted() {
    return env.get(env.keys.MAIN_LOOP_PAUSED)
        .then(paused => {
            if (+paused) {
                return q.reject('Simulation paused');
            }
            return pubsub.publish(pubsub.keys.TICK_STARTED, "1");
        });
}

export function notifyRoomsDone(gameTime) {
    return pubsub.publish(pubsub.keys.ROOMS_DONE, gameTime);
}

export function sendConsoleMessages(userId, messages) {
    if (userId == '3') {
        if (messages.log.length) {
            console.log("Source Keeper console", messages.log);
        }
        return q.when();
    }
    if (userId == '2') {
        if (messages.log.length) {
            console.log("Invader console", messages.log);
        }
        return q.when();
    }
    return pubsub.publish(`user:${userId}/console`, JSON.stringify({ messages, userId }));
}

export function sendConsoleError(userId, error) {

    if (!error) {
        return q.when();
    }

    if (userId == '3') {
        console.log("Source Keeper error", _.isObject(error) && error.stack || error);
        return q.when();
    }

    if (userId == '2') {
        console.log("Invader error", _.isObject(error) && error.stack || error);
        return q.when();
    }

    error = error.toString();

    let user;

    db.users.findOne({ _id: userId })
        .then((_user) => {
            user = _user;
            return checkNotificationOnline(user);
        })
        .then(() => {
            let interval = 30 * 60 * 1000;
            if (user.notifyPrefs && user.notifyPrefs.errorsInterval) {
                interval = user.notifyPrefs.errorsInterval * 60 * 1000;
            }
            const date = new Date(Math.ceil(new Date().getTime() / interval) * interval);

            db['users.notifications'].update({ $and: [{ user: userId }, { message: error }, { type: 'error' }, { date: { $lte: date.getTime() } }] },
                { $set: { user: userId, message: error, type: 'error', date: date.getTime() }, $inc: { count: 1 } },
                { upsert: true });
        });


    return pubsub.publish(`user:${userId}/console`, JSON.stringify({ userId, error }));
}

export function getGameTime() {
    return common.getGametime();
}

export function incrementGameTime() {
    return common.getGametime()
        .then(gameTime => env.set(env.keys.GAMETIME, gameTime + 1));
}

export function getRoomInfo(roomId) {
    return db.rooms.findOne({ _id: roomId });
}

export function saveRoomInfo(roomId, roomInfo) {
    return db.rooms.update({ _id: roomId }, { $set: roomInfo });
}

export function getInterRoom() {
    return q.all([
        common.getGametime(),
        db['rooms.objects'].find({ $and: [{ type: { $in: ['creep', 'powerCreep'] } }, { interRoom: { $ne: null } }] }),
        db.rooms.find({ status: 'normal' })
            .then((rooms) => exports.mapById(_.filter(rooms, i => !i.openTime || i.openTime < Date.now()))),
        db['rooms.objects'].find({ type: { $in: ['terminal', 'powerSpawn', 'powerCreep'] } }),
        q.all([
            db['market.orders'].find(),
            db['users.power_creeps'].find(),
            db['users.intents'].find()
        ]).then(result => db.users.find({ _id: { $in: _.map(_.flatten(result), 'user') } })
            .then(users => ({
                users,
                orders: result[0],
                userPowerCreeps: result[1],
                userIntents: result[2],
                shardName: ''
            })))
    ]);
}

export function setRoomStatus(roomId, status) {
    return db.rooms.update({ _id: roomId }, { $set: { status } });
}

export function sendNotification(userId, message) {
    return checkNotificationOnline(userId)
        .then(() => db['users.notifications'].update({
            user: userId,
            message,
            date: { $lte: Date.now() },
            type: 'msg'
        }, {
            $set: {
                user: userId,
                message,
                date: Date.now(),
                type: 'msg'
            },
            $inc: { count: 1 }
        }, { upsert: true }));
}

export function getRoomStatsUpdater(room) {
    return {
        inc(name, userId, amount) {
            roomStatsUpdates[room] = roomStatsUpdates[room] || {};
            roomStatsUpdates[room][userId] = roomStatsUpdates[room][userId] || {};
            roomStatsUpdates[room][userId][name] = roomStatsUpdates[room][userId][name] || 0;
            roomStatsUpdates[room][userId][name] += amount;
        }
    }
}

export function roomsStatsSave() {
    // TODO
    return q.when();
}

export function updateAccessibleRoomsList() {
    return db.rooms.find({ status: 'normal' })
        .then((rooms) => {
            const list = _(rooms).filter(i => !i.openTime || i.openTime < Date.now()).map('_id').value();
            return env.set(env.keys.ACCESSIBLE_ROOMS, JSON.stringify(list));
        });
}

export function saveIdleTime(name, time) {
    return q.when();
}

export function mapViewSave(roomId, mapView) {
    return env.set(env.keys.MAP_VIEW + roomId, JSON.stringify(mapView));
}

export function commitDbBulk() {
    return q.when();
}

export function getWorldSize() {
    return worldSize;
}

export function addRoomToUser(roomId, user, bulk) {
    if (!user.rooms || user.rooms.indexOf(roomId) == -1) {
        bulk.addToSet(user, 'rooms', roomId);
    }
}

export function removeRoomFromUser(roomId, user, bulk) {
    if (user.rooms && user.rooms.indexOf(roomId) != -1) {
        bulk.pull(user, 'rooms', roomId);
    }
}

export function bufferFromBase64(base64) {
    return Buffer.from(base64, 'base64');
}

export function startLoop(name, fn) {

    let counter = 0;

    const pool = genericPool.createPool({
        create() { return { name: name + (counter++) } },
        destroy() { }
    }, {
        max: process.env.RUNNER_THREADS || 2,
        min: 0
    });


    function loop() {
        pool.acquire().then(poolItem => {
            setTimeout(loop, 0);
            return fn().finally(() => {
                pool.release(poolItem);
            });
        });
    }

    loop();
}

export function saveRoomEventLog(roomId, eventLog) {
    return env.hset(env.keys.ROOM_EVENT_LOG, roomId, JSON.stringify(eventLog));
}

export var makeRuntime = require('./runtime/make');
export var history = require('./history');
export { queue };
export var constants = _config.common.constants;
export var strongholds = common.configManager.config.common.strongholds;

process.on('disconnect', () => process.exit());