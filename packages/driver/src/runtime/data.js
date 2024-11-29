import bulk from '../bulk';
import queue from '../queue';
import {EventEmitter} from 'events';
import common from '@screeps/common';
const db = common.storage.db;
const env = common.storage.env;
const config = common.configManager.config;
import q from 'q';
import vm from 'vm';
import _ from 'lodash';
import child_process from 'child_process';
import os from 'os';
import util from 'util';
import driver from '../index';

const accessibleRoomsCache = {
    timestamp: 0
};

const cachedMarketOrders = {
    gameTime: 0,
    orders: {}
};

const cachedMarketHistory = {
    time: 0,
    history: {}
};

function getCachedMarketOrders(gameTime) {
    if(gameTime == cachedMarketOrders.gameTime) {
        return q.when(cachedMarketOrders.orders);
    }
    return db['market.orders'].find({active: true})
        .then(orders => {
            const result = {all: {}};
            orders.forEach(i => {
                i.id = ""+i._id;
                delete i._id;
                result[i.resourceType] = result[i.resourceType] || {};
                result[i.resourceType][i.id] = i;
                result.all[i.id] = i;
            });
            cachedMarketOrders.orders = result;
            cachedMarketOrders.gameTime = gameTime;
            return result;
        });
}

function getCachedMarketHistory() {
    // cache for 3 hours
    const now = Date.now();
    if((cachedMarketHistory.time + 3*60*60*1000) > now) {
        return q.when(cachedMarketHistory.history);
    }

    return db['market.stats'].find({})
        .then(history => {
            const result = {all: []};

            history.forEach(i => {
                delete i._id;
                if(i.meta) delete i.meta;
                if(i['$loki']) delete i['$loki'];
                result[i.resourceType] = result[i.resourceType] || [];
                result[i.resourceType].push(i);
                result.all.push(i);
            });

            cachedMarketHistory.history = result;
            cachedMarketHistory.time = now;
            return cachedMarketHistory.history;
        });
}

function getAccessibleRooms() {
    if(Date.now() > accessibleRoomsCache.timestamp + 60*1000) {
        accessibleRoomsCache.timestamp = Date.now();
        return env.get(env.keys.ACCESSIBLE_ROOMS).then(data => {
            accessibleRoomsCache.data = data;
            return accessibleRoomsCache.data;
        });
    }
    return q.when(accessibleRoomsCache.data);

}

export function get(userId) {
    let userObjects;
    let runtimeData;
    const userIdsHash = {[userId]: true};

    return db['rooms.objects'].find({user: userId})
        .then((_userObjects) => {

            if(!_userObjects.length) {
                db.users.update({_id: userId}, {$set: {active: 0}});
                return q.reject(false);
            }

            userObjects = driver.mapById(_userObjects);

            const roomIdsHash = {};
            _userObjects.forEach((i) => {

                if(i.type == 'flag' || i.type == 'constructionSite') {
                    return;
                }
                roomIdsHash[i.room] = true;
                if(i.type == 'observer') {
                    roomIdsHash[i.observeRoom] = true;
                }
                if(i.type == 'controller' && i.sign) {
                    userIdsHash[i.sign.user] = true;
                }
            });
            let roomIds = Object.keys(roomIdsHash);

            return q.all([
                db.users.findOne({_id: userId}),
                db['users.code'].findOne({$and: [{user: userId}, {activeWorld: true}]}),
                env.get(env.keys.MEMORY+userId),
                db['users.console'].find({user: userId}),
                common.getGametime(),
                db.rooms.find({_id: {$in: roomIds}}),
                db['rooms.objects'].find({$and: [{room: {$in: roomIds}}, {user: {$ne: userId}}]}),
                getAccessibleRooms(),
                db.transactions.findEx({sender: userId}, {sort: {time:-1}, limit: 100}),
                db.transactions.findEx({recipient: userId}, {sort: {time:-1}, limit: 100}),
                db['rooms.flags'].find({user: userId}),
                env.hmget(env.keys.ROOM_EVENT_LOG, roomIds).then(data => _.zipObject(roomIds, data)),
                db['users.power_creeps'].find({user: userId}),
            ]);
        }).then((result) => {
        const gameTime = result[4];

        db['users.console'].removeWhere({_id: {$in: _.map(result[3], (i) => i._id)}});

        let cpu;
        let cpuBucket;
        if(result[0].cpu) {
            cpuBucket = result[0].cpuAvailable || 0;
            if(cpuBucket < 0) {
                cpuBucket = 0;
            }
            cpu = cpuBucket + result[0].cpu;
            if(cpu > config.engine.cpuMaxPerTick) {
                cpu = config.engine.cpuMaxPerTick;
            }
        }
        else {
            cpu = Infinity;
            cpuBucket = Infinity;
        }

        const modules = result[1] && result[1].modules || {};
        for(const key in modules) {
            let newKey = key.replace(/\$DOT\$/g, '.');
            newKey = newKey.replace(/\$SLASH\$/g, '/');
            newKey = newKey.replace(/\$BACKSLASH\$/g, '\\');
            if(newKey != key) {
                modules[newKey] = modules[key];
                delete modules[key];
            }
        }

        const userIds = [];
        const powerCreepsIds = [];
        result[6].forEach((i) => {
            if(i.user) {
                userIdsHash[i.user] = true;
            }
            if(i.type == 'controller' && i.reservation) {
                userIdsHash[i.reservation.user] = true;
            }
            if(i.type == 'controller' && i.sign) {
                userIdsHash[i.sign.user] = true;
            }
            if(i.type == 'powerCreep') {
                powerCreepsIds.push(i._id);
            }
        });
        result[8].forEach(i => i.recipient && (userIdsHash[i.recipient] = true));
        result[9].forEach(i => i.sender && (userIdsHash[i.sender] = true));
        Object.getOwnPropertyNames(userIdsHash).forEach(i => {
            userIds.push(i);
        });

        runtimeData = {
            userObjects,
            user: result[0],
            userCode: modules,
            userCodeTimestamp: result[1] && result[1].timestamp || 0,
            userMemory: {data: result[2] || "", userId},
            consoleCommands: result[3],
            time: gameTime,
            rooms: driver.mapById(result[5]),
            roomObjects: _.extend(driver.mapById(result[6]), userObjects),
            flags: result[10],
            accessibleRooms: result[7],
            transactions: {
                outgoing: result[8],
                incoming: result[9]
            },
            cpu,
            cpuBucket,
            roomEventLog: result[11],
            userPowerCreeps: _.indexBy(result[12], '_id')
        };

        return q.all([
            db.users.find({_id: {$in: userIds}}),
            getCachedMarketOrders(gameTime),
            getCachedMarketHistory(),
            db['market.orders'].find({user: userId}),
            result[0].activeSegments && result[0].activeSegments.length > 0 ?
                env.hmget(env.keys.MEMORY_SEGMENTS+userId, result[0].activeSegments) :
                q.when(),
            result[0].activeForeignSegment && result[0].activeForeignSegment.user_id && result[0].activeForeignSegment.id ?
                q.all([
                    env.hget(
                        env.keys.MEMORY_SEGMENTS+result[0].activeForeignSegment.user_id,
                        result[0].activeForeignSegment.id),
                    env.get(env.keys.PUBLIC_MEMORY_SEGMENTS+result[0].activeForeignSegment.user_id)
                ]) :
                q.when(),
        ]);
    }).then((result) => {
            runtimeData.users = driver.mapById(result[0]);
            runtimeData.market = {
                orders: result[1],
                history: result[2],
                myOrders: result[3]
            };
            if(result[4]) {
                runtimeData.memorySegments = {};
                for(let i=0; i<runtimeData.user.activeSegments.length; i++) {
                    runtimeData.memorySegments[runtimeData.user.activeSegments[i]] = result[4][i] || "";
                }
            }
            if(result[5] && result[5][1] && result[5][1].split(',').indexOf(""+runtimeData.user.activeForeignSegment.id) != -1) {
                runtimeData.foreignMemorySegment = {
                    username: runtimeData.user.activeForeignSegment.username,
                    id: runtimeData.user.activeForeignSegment.id,
                    data: result[5][0]
                };
            }
            return runtimeData;
        });
}
