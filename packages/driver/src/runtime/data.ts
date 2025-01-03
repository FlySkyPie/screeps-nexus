import q from 'q';
import _ from 'lodash';

import { getGametime } from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import { mapById } from '../index';

const accessibleRoomsCache: Record<string, any> = {
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

function getCachedMarketOrders(gameTime: any) {
    if (gameTime == cachedMarketOrders.gameTime) {
        return q.when(cachedMarketOrders.orders);
    }
    return StorageInstance.db['market.orders'].find({ active: true })
        .then((orders: any) => {
            const result: Record<string, any> = { all: {} };
            orders.forEach((i: any) => {
                i.id = "" + i._id;
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
    if ((cachedMarketHistory.time + 3 * 60 * 60 * 1000) > now) {
        return q.when(cachedMarketHistory.history);
    }

    return StorageInstance.db['market.stats'].find({})
        .then((history: any) => {
            const result: Record<string, any> = { all: [] };

            history.forEach((i: any) => {
                delete i._id;
                if (i.meta) delete i.meta;
                if (i['$loki']) delete i['$loki'];
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
    if (Date.now() > accessibleRoomsCache.timestamp + 60 * 1000) {
        accessibleRoomsCache.timestamp = Date.now();
        return StorageInstance.env.get(
            StorageEnvKey.ACCESSIBLE_ROOMS).then((data: any) => {
                accessibleRoomsCache.data = data;
                return accessibleRoomsCache.data;
            });
    }
    return q.when(accessibleRoomsCache.data);

}

export function get(userId: any) {
    let userObjects: any;
    let runtimeData: any;
    const userIdsHash = { [userId]: true };

    return StorageInstance.db['rooms.objects'].find({ user: userId })
        .then((_userObjects: any) => {

            if (!_userObjects.length) {
                StorageInstance.db.users.update({ _id: userId }, { $set: { active: 0 } });
                return q.reject(false);
            }

            userObjects = mapById(_userObjects);

            const roomIdsHash: Record<string, any> = {};
            _userObjects.forEach((i: any) => {

                if (i.type == 'flag' || i.type == 'constructionSite') {
                    return;
                }
                roomIdsHash[i.room] = true;
                if (i.type == 'observer') {
                    roomIdsHash[i.observeRoom] = true;
                }
                if (i.type == 'controller' && i.sign) {
                    userIdsHash[i.sign.user] = true;
                }
            });
            let roomIds = Object.keys(roomIdsHash);

            return q.all([
                StorageInstance.db.users.findOne({ _id: userId }),
                StorageInstance.db['users.code'].findOne({ $and: [{ user: userId }, { activeWorld: true }] }),
                StorageInstance.env.get(StorageEnvKey.MEMORY + userId),
                StorageInstance.db['users.console'].find({ user: userId }),
                getGametime(),
                StorageInstance.db.rooms.find({ _id: { $in: roomIds } }),
                StorageInstance.db['rooms.objects'].find({ $and: [{ room: { $in: roomIds } }, { user: { $ne: userId } }] }),
                getAccessibleRooms(),
                StorageInstance.db.transactions.findEx({ sender: userId }, { sort: { time: -1 }, limit: 100 }),
                StorageInstance.db.transactions.findEx({ recipient: userId }, { sort: { time: -1 }, limit: 100 }),
                StorageInstance.db['rooms.flags'].find({ user: userId }),
                StorageInstance.env.hmget(StorageEnvKey.ROOM_EVENT_LOG, roomIds).then((data: any) => _.zipObject(roomIds, data)),
                StorageInstance.db['users.power_creeps'].find({ user: userId }),
            ]);
        }).then((result: any) => {
            const gameTime = result[4];

            StorageInstance.db['users.console'].removeWhere({ _id: { $in: _.map(result[3], (i: any) => i._id) } });

            let cpu;
            let cpuBucket;
            if (result[0].cpu) {
                cpuBucket = result[0].cpuAvailable || 0;
                if (cpuBucket < 0) {
                    cpuBucket = 0;
                }
                cpu = cpuBucket + result[0].cpu;
                if (cpu > ConfigManager.config.engine!.cpuMaxPerTick) {
                    cpu = ConfigManager.config.engine!.cpuMaxPerTick;
                }
            }
            else {
                cpu = Infinity;
                cpuBucket = Infinity;
            }

            const modules = result[1] && result[1].modules || {};
            for (const key in modules) {
                let newKey = key.replace(/\$DOT\$/g, '.');
                newKey = newKey.replace(/\$SLASH\$/g, '/');
                newKey = newKey.replace(/\$BACKSLASH\$/g, '\\');
                if (newKey != key) {
                    modules[newKey] = modules[key];
                    delete modules[key];
                }
            }

            const userIds: any[] = [];
            const powerCreepsIds: any[] = [];
            result[6].forEach((i: any) => {
                if (i.user) {
                    userIdsHash[i.user] = true;
                }
                if (i.type == 'controller' && i.reservation) {
                    userIdsHash[i.reservation.user] = true;
                }
                if (i.type == 'controller' && i.sign) {
                    userIdsHash[i.sign.user] = true;
                }
                if (i.type == 'powerCreep') {
                    powerCreepsIds.push(i._id);
                }
            });
            result[8].forEach((i: any) => i.recipient && (userIdsHash[i.recipient] = true));
            result[9].forEach((i: any) => i.sender && (userIdsHash[i.sender] = true));
            Object.getOwnPropertyNames(userIdsHash).forEach(i => {
                userIds.push(i);
            });

            runtimeData = {
                userObjects,
                user: result[0],
                userCode: modules,
                userCodeTimestamp: result[1] && result[1].timestamp || 0,
                userMemory: { data: result[2] || "", userId },
                consoleCommands: result[3],
                time: gameTime,
                rooms: mapById(result[5]),
                roomObjects: _.extend(mapById(result[6]), userObjects),
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
                StorageInstance.db.users.find({ _id: { $in: userIds } }),
                getCachedMarketOrders(gameTime),
                getCachedMarketHistory(),
                StorageInstance.db['market.orders'].find({ user: userId }),
                result[0].activeSegments && result[0].activeSegments.length > 0 ?
                    StorageInstance.env.hmget(StorageEnvKey.MEMORY_SEGMENTS + userId, result[0].activeSegments) :
                    q.when(),
                result[0].activeForeignSegment && result[0].activeForeignSegment.user_id && result[0].activeForeignSegment.id ?
                    q.all([
                        StorageInstance.env.hget(
                            StorageEnvKey.MEMORY_SEGMENTS + result[0].activeForeignSegment.user_id,
                            result[0].activeForeignSegment.id),
                        StorageInstance.env.get(StorageEnvKey.PUBLIC_MEMORY_SEGMENTS + result[0].activeForeignSegment.user_id)
                    ]) :
                    q.when(),
            ]);
        }).then((result: any) => {
            runtimeData.users = mapById(result[0]);
            runtimeData.market = {
                orders: result[1],
                history: result[2],
                myOrders: result[3]
            };
            if (result[4]) {
                runtimeData.memorySegments = {};
                for (let i = 0; i < runtimeData.user.activeSegments.length; i++) {
                    runtimeData.memorySegments[runtimeData.user.activeSegments[i]] = result[4][i] || "";
                }
            }
            if (result[5] && result[5][1] && result[5][1].split(',').indexOf("" + runtimeData.user.activeForeignSegment.id) != -1) {
                runtimeData.foreignMemorySegment = {
                    username: runtimeData.user.activeForeignSegment.username,
                    id: runtimeData.user.activeForeignSegment.id,
                    data: result[5][0]
                };
            }
            return runtimeData;
        });
};
