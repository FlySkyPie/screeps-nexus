import q from 'q';
import _ from 'lodash';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as  utils from './utils';
import * as strongholds from './strongholds';
import { logger } from './logger';

const config = common.configManager.config;
const db = StorageInstance.db;

config.cronjobs = {
    sendNotifications: [60, sendNotifications],
    roomsForceUpdate: [20, roomsForceUpdate],
    genPowerBanks: [5 * 60, genPowerBanks],
    genInvaders: [5 * 60, genInvaders],
    purgeTransactions: [60 * 60, purgeTransactions],
    recreateNpcOrders: [5 * 60, recreateNpcOrders],
    calcMarketStats: [60 * 60, calcMarketStats],
    deletePowerCreeps: [10 * 60, deletePowerCreeps],
    genDeposits: [5 * 60, genDeposits],
    genStrongholds: [5 * 60, strongholds.genStrongholds],
    expandStrongholds: [15 * 60, strongholds.expandStrongholds]
};

export function run() {
    _.forEach(config.cronjobs, (i, key) => {
        if (Date.now() - (i[2] || 0) > i[0] * 1000) {
            logger.info(`Running cronjob '${key}'`);
            i[2] = Date.now();
            i[1]();
        }
    });
}

function recreateNpcOrders() {
    let gameTime: any;

    const sellMinerals = ['X', 'Z', 'K', 'L', 'U', 'O', 'O', 'H', 'H', 'Z', 'K', 'L', 'U', 'O', 'O', 'H', 'H'];
    const buyMinerals = ['X', 'Z', 'K', 'L', 'U', 'O', 'O', 'H', 'H', 'Z', 'K', 'L', 'U', 'O', 'O', 'H', 'H'];
    const sellPrice: any = {
        H: 3000,
        O: 3000,
        Z: 6000,
        K: 6000,
        U: 6000,
        L: 6000,
        X: 18000
    };
    const buyPrice = 1000;

    const sellMineralAmount = 40, sellEnergyAmount = 40, buyMineralAmount = 20, period = 5000;

    let cnt = 0;

    return common.getGametime()
        .then((data: any) => gameTime = data)
        .then(() => db['rooms.objects'].find({ $and: [{ type: 'terminal' }, { user: { $eq: null } }] }))
        .then((terminals: any) => common.qSequence(terminals, (terminal: any) => {
            return db.rooms.findOne({ _id: terminal.room })
                .then((room: any) => {
                    if (room.status != 'normal') {
                        return;
                    }
                    if (room.nextNpcMarketOrder && room.nextNpcMarketOrder > gameTime) {
                        return;
                    }
                    const nowTimestamp = new Date().getTime();
                    const sellMineral = sellMinerals[Math.floor(Math.random() * sellMinerals.length)];
                    const buyMineral = buyMinerals[Math.floor(Math.random() * buyMinerals.length)];
                    const orders: any[] = [];

                    orders.push({
                        created: gameTime,
                        createdTimestamp: nowTimestamp,
                        active: true,
                        type: 'sell',
                        amount: period * sellMineralAmount,
                        remainingAmount: period * sellMineralAmount,
                        totalAmount: period * sellMineralAmount,
                        resourceType: sellMineral,
                        price: sellPrice[sellMineral],
                        roomName: terminal.room
                    });

                    if (Math.random() < 0.5) {
                        orders.push({
                            created: gameTime,
                            createdTimestamp: nowTimestamp,
                            active: true,
                            type: 'sell',
                            amount: period * sellEnergyAmount,
                            remainingAmount: period * sellEnergyAmount,
                            totalAmount: period * sellEnergyAmount,
                            resourceType: 'energy',
                            price: 1000,
                            roomName: terminal.room
                        });
                    }
                    if (Math.random() < 0.25) {
                        orders.push({
                            created: gameTime,
                            createdTimestamp: nowTimestamp,
                            active: true,
                            type: 'buy',
                            amount: period * buyMineralAmount,
                            remainingAmount: period * buyMineralAmount,
                            totalAmount: period * buyMineralAmount,
                            resourceType: buyMineral,
                            price: buyPrice,
                            roomName: terminal.room
                        });
                    }
                    cnt++;
                    return db['market.orders'].removeWhere({ roomName: room._id })
                        .then(() => db['market.orders'].insert(orders))
                        .then(() => db.rooms.update({ _id: room._id }, { $set: { nextNpcMarketOrder: gameTime + Math.round(period * (0.8 + 0.4 * Math.random())) } }));
                });
        }));
}

function sendNotifications() {

    let notifications: any, userIds: any;
    const filterDate = new Date();
    return db['users.notifications'].find({ date: { $lt: filterDate.getTime() } })
        .then((data: any) => {
            notifications = data;
            userIds = _(notifications).pluck('user').uniq(false, (i: any) => i.toString()).value();
        })
        .then(() => db.users.find({ _id: { $in: userIds } }))
        .then((users: any) => {
            let promise: any = q.when();
            users.forEach((user: any) => {

                const notificationIdsToRemove: any[] = [];

                promise = promise.then(() => {

                    const userNotifications = _.filter(notifications, (i: any) => i.user == user._id);

                    if (user.notifyPrefs && (user.notifyPrefs.disabled || !user.email)) {
                        userNotifications.forEach((notification: any) => {
                            notificationIdsToRemove.push(notification._id);
                        });
                        return;
                    }

                    let interval = 5;
                    if (user.notifyPrefs && user.notifyPrefs.interval > 5) {
                        interval = user.notifyPrefs.interval;
                    }
                    interval *= 60 * 1000;

                    if (user.lastNotifyDate && (user.lastNotifyDate + interval > Date.now())) {
                        return;
                    }

                    userNotifications.forEach((notification) => {
                        notificationIdsToRemove.push(notification._id);
                    });

                    config.backend.emit('sendUserNotifications', user,
                        userNotifications.map(i => _.pick(i, ['message', 'date', 'count', 'type'])));
                })
                    .catch((e: any) => logger.info(`Error sending a message to ${user.username}: ${e}`))
                    .then(() => notificationIdsToRemove.length > 0 && q.all([
                        db['users.notifications'].removeWhere({ _id: { $in: notificationIdsToRemove } }),
                        db.users.update({ _id: user._id }, { $set: { lastNotifyDate: Date.now() } })
                    ]))
            });
            return promise;
        });
}

function roomsForceUpdate() {
    return common.getGametime()
        .then((gameTime: any) => {
            return db.rooms.find({ $and: [{ status: { $ne: 'out of borders' } }, { active: false }] })
                .then((rooms: any) => common.qSequence(rooms, (room: any) => {
                    if (!room.nextForceUpdateTime || gameTime >= room.nextForceUpdateTime) {
                        return db.rooms.update({ _id: room._id }, {
                            $set: {
                                active: true,
                                nextForceUpdateTime: gameTime + 90 + Math.floor(Math.random() * 20)
                            }
                        });
                    }
                }))
        });
}

function genPowerBanks() {
    return common.getGametime()
        .then((gameTime: any) => {
            return db.rooms.find({ $and: [{ bus: true }, { status: 'normal' }] })
                .then((rooms: any) => q.all(rooms.map((room: any) => {

                    const respawnTime = Math.round(Math.random() * ScreepsConstants.POWER_BANK_RESPAWN_TIME / 2 + ScreepsConstants.POWER_BANK_RESPAWN_TIME * 0.75);

                    if (!room.powerBankTime) {
                        room.powerBankTime = gameTime + respawnTime;
                        return db.rooms.update({ _id: room._id }, { $set: room });
                    }
                    if (gameTime >= room.powerBankTime) {
                        room.powerBankTime = gameTime + respawnTime;
                        room.active = true;

                        return db['rooms.terrain'].findOne({ room: room._id })
                            .then((data: any) => {

                                let x, y, isWall, hasExit;
                                do {
                                    x = Math.floor(Math.random() * 40 + 5);
                                    y = Math.floor(Math.random() * 40 + 5);
                                    isWall = parseInt(data.terrain.charAt(y * 50 + x)) & 1;
                                    hasExit = false;
                                    for (let dx = -1; dx <= 1; dx++) {
                                        for (let dy = -1; dy <= 1; dy++) {
                                            if (!(parseInt(data.terrain.charAt((y + dy) * 50 + x + dx)) & 1)) {
                                                hasExit = true;
                                            }
                                        }
                                    }
                                }
                                while (!isWall || !hasExit);

                                let power = Math.floor(Math.random() * (ScreepsConstants.POWER_BANK_CAPACITY_MAX - ScreepsConstants.POWER_BANK_CAPACITY_MIN) + ScreepsConstants.POWER_BANK_CAPACITY_MIN);
                                if (Math.random() < ScreepsConstants.POWER_BANK_CAPACITY_CRIT) {
                                    power += ScreepsConstants.POWER_BANK_CAPACITY_MAX;
                                }

                                return db['rooms.objects'].insert({
                                    type: 'powerBank',
                                    x, y,
                                    room: room._id,
                                    store: { power },
                                    hits: ScreepsConstants.POWER_BANK_HITS,
                                    hitsMax: ScreepsConstants.POWER_BANK_HITS,
                                    decayTime: gameTime + ScreepsConstants.POWER_BANK_DECAY
                                });
                            })
                            .then(() => db.rooms.update({ _id: room._id }, { $set: room }));
                    }
                })));
        });
}

function genInvaders() {

    function checkExit(roomName: any, exit: any) {
        let [x, y] = utils.roomNameToXY(roomName);
        if (exit == 'top') y--;
        if (exit == 'right') x++;
        if (exit == 'bottom') y++;
        if (exit == 'left') x--;
        const newRoomName = utils.roomNameFromXY(x, y);
        return db['rooms.objects'].findOne({ $and: [{ room: newRoomName }, { type: 'controller' }] })
            .then((controller: any) => {
                if (controller && (controller.user || controller.reservation)) {
                    return q.reject();
                }
            })
    }

    function createCreep(type: any, room: any, square: any, boosted: any) {

        const [x, y] = utils.roomNameToXY(room);

        const body: any = {
            bigHealer: ['move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'heal', 'move'],
            bigRanged: ['tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'work', 'move'],
            bigMelee: ['tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'tough', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'work', 'work', 'work', 'work', 'attack', 'attack', 'move'],
            smallHealer: ['move', 'move', 'move', 'move', 'heal', 'heal', 'heal', 'heal', 'heal', 'move'],
            smallRanged: ['tough', 'tough', 'move', 'move', 'move', 'move', 'ranged_attack', 'ranged_attack', 'ranged_attack', 'move'],
            smallMelee: ['tough', 'tough', 'move', 'move', 'move', 'move', 'ranged_attack', 'work', 'attack', 'move']
        };

        const creep = {
            type: 'creep',
            user: '2',
            body: _.map(body[type], type => ({ type, hits: 100 })),
            hits: body[type].length * 100,
            hitsMax: body[type].length * 100,
            ticksToLive: 1500,
            x: square[0],
            y: square[1],
            room,
            fatigue: 0,
            store: {},
            storeCapacity: 0,
            name: `invader_${room}_${Math.floor(Math.random() * 1000)}`
        };

        if (boosted) {
            creep.body.forEach((i: any) => {
                if (i.type == 'heal') {
                    i.boost = utils.isCenter(x, y) ? 'XLHO2' : 'LO';
                }
                if (i.type == 'ranged_attack') {
                    i.boost = utils.isCenter(x, y) ? 'XKHO2' : 'KO';
                }
                if (i.type == 'work') {
                    i.boost = utils.isCenter(x, y) ? 'XZH2O' : 'ZH';
                }
                if (i.type == 'attack') {
                    i.boost = utils.isCenter(x, y) ? 'XUH2O' : 'UH';
                }
                if (i.type == 'tough') {
                    i.boost = utils.isCenter(x, y) ? 'XGHO2' : 'GO';
                }
            })
        }

        return db['rooms.objects'].insert(creep);
    }

    function findClosestExit(square: any, exits: any) {
        const sortedExits = _.sortBy(exits, (i: any) => Math.max(Math.abs(i[0] - square[0]), Math.abs(i[1] - square[1])));
        return sortedExits[0];
    }


    function createRaid(controllerLevel: any, room: any, exits: any) {
        const type = controllerLevel && controllerLevel >= 4 ? 'big' : 'small';

        let max = 1, count = 1, boostChance = 0.5;

        const [x, y] = utils.roomNameToXY(room);

        if (Math.random() > 0.9 || utils.isCenter(x, y)) {
            max = 2;
            boostChance = type == 'big' ? 0 : 0.5;
            if (Math.random() > 0.8 || utils.isCenter(x, y)) {
                max = 5;
                if (type == 'big') {
                    if (controllerLevel < 5) {
                        max = 2;
                    }
                    else if (controllerLevel < 6) {
                        max = 2;
                    }
                    else if (controllerLevel < 7) {
                        max = 3;
                    }
                    else if (controllerLevel < 8) {
                        boostChance = 0.4;
                        max = 3;
                    }
                    else {
                        boostChance = 0.4;
                        max = 5;
                    }
                }
            }

            count = Math.floor(Math.random() * (max - 1)) + 2;
            count = Math.min(count, exits.length);
        }

        const promises = [];
        let lastSquare;

        for (let i = 0; i < count; i++) {
            const subtype = i == 0 && !utils.isCenter(x, y) ? 'Melee' :
                i == 0 || (i == 1 || i == 2 && count == 5) && Math.random() > 0.5 ? 'Ranged' :
                    'Healer';

            const square: any = lastSquare ?
                findClosestExit(lastSquare, exits) :
                exits[Math.floor(Math.random() * exits.length)];
            if (!square) {
                break;
            }
            promises.push(createCreep(type + subtype, room, square, Math.random() < boostChance));
            _.pull(exits, square);
            lastSquare = square;
        }

        return q.all(promises);
    }

    return db.rooms.find({ $and: [{ status: 'normal' }, { active: true }] })
        .then((rooms: any) => q.all(rooms.map((room: any) => {

            return db['rooms.objects'].find({ $and: [{ room: room._id }, { type: { $in: ['source', 'controller', 'creep'] } }] })
                .then((objects: any) => {
                    const sources: any = _.filter(objects, { type: 'source' });
                    const creeps = _.filter(objects, { type: 'creep', user: '2' });
                    if (creeps.length) {
                        return;
                    }
                    const invaderHarvested = _.sum(sources, 'invaderHarvested');
                    const goal = room.invaderGoal || ScreepsConstants.INVADERS_ENERGY_GOAL;
                    if (goal != 1 && invaderHarvested < goal) {
                        return;
                    }
                    const sectorRegex = room._id.replace(
                        /^([WE]\d*)\d([NS]\d*)\d$/,
                        (_str: any, p1: any, p2: any) => `^${p1}\\d${p2}\\d$`);
                    return q.all([
                        db['rooms.terrain'].findOne({ room: room._id }),
                        db['rooms.objects'].count({ $and: [{ type: 'invaderCore' }, { level: { $gt: 0 } }, { room: { $regex: sectorRegex } }] })
                    ])
                        .then(([terrain, invaderCore]) => {
                            if (!invaderCore) {
                                logger.info(`Skip room ${room._id} since there is no invaderCore in sector regex ${sectorRegex}`);
                                return;
                            }
                            let exits: any = {};
                            const exitSquares: any = { top: [], left: [], right: [], bottom: [] };
                            for (let i = 0; i < 49; i++) {
                                if (!common.checkTerrain(terrain.terrain, i, 0, ScreepsConstants.TERRAIN_MASK_WALL)) {
                                    exits.top = true;
                                    exitSquares.top.push([i, 0]);
                                }
                                if (!common.checkTerrain(terrain.terrain, i, 49, ScreepsConstants.TERRAIN_MASK_WALL)) {
                                    exits.bottom = true;
                                    exitSquares.bottom.push([i, 49]);
                                }
                                if (!common.checkTerrain(terrain.terrain, 0, i, ScreepsConstants.TERRAIN_MASK_WALL)) {
                                    exits.left = true;
                                    exitSquares.left.push([0, i]);
                                }
                                if (!common.checkTerrain(terrain.terrain, 49, i, ScreepsConstants.TERRAIN_MASK_WALL)) {
                                    exits.right = true;
                                    exitSquares.right.push([49, i]);
                                }
                            }
                            exits = _.keys(exits);
                            return q.all(_.map(exits, exit => {
                                return checkExit(room._id, exit).catch(() => _.pull(exits, exit));
                            }))
                                .then(() => {
                                    if (!exits.length) {
                                        return;
                                    }
                                    const exit = exits[Math.floor(Math.random() * exits.length)];
                                    const controller: any = _.find(objects, { type: 'controller' });
                                    return createRaid(controller && controller.user && controller.level, room._id, exitSquares[exit]);
                                });
                        })
                        .then(() => {
                            let invaderGoal = Math.floor(ScreepsConstants.INVADERS_ENERGY_GOAL * (Math.random() * 0.6 + 0.7));
                            if (Math.random() < 0.1) {
                                invaderGoal *= Math.floor(Math.random() > 0.5 ? 2 : 0.5);
                            }
                            return db.rooms.update({ _id: room._id }, { $set: { invaderGoal } })
                        })
                        .then(() => db['rooms.objects'].update({ $and: [{ room: room._id }, { type: 'source' }] }, { $set: { invaderHarvested: 0 } }));
                });
        })));
}

function purgeTransactions() {
    return db.transactions.find()
        .then((data: any) => {
            data = _.sortBy(data, (i: any) => -parseInt(i.time));

            const senders: any = {},
                recipients: any = {},
                forDelete: any[] = [];
            data.forEach((i: any) => {
                let flag1 = true, flag2 = true;
                senders[i.sender] = senders[i.sender] || [];
                if (senders[i.sender].length < 100) {
                    senders[i.sender].push(i);
                    flag1 = false;
                }
                recipients[i.recipient] = recipients[i.recipient] || [];
                if (recipients[i.recipient].length < 100) {
                    recipients[i.recipient].push(i);
                    flag2 = false;
                }
                if (flag1 && flag2) {
                    forDelete.push(i._id);
                }
            });

            if (forDelete.length > 0) {
                return db.transactions.removeWhere({ _id: { $in: forDelete } });
            }
        });
}

function calcMarketStats() {
    return db['market.stats'].removeWhere({})
        .then(() => db['users.money'].find({ $and: [{ date: { $gt: new Date(Date.now() - 14 * 24 * 3600 * 1000) } }, { type: 'market.sell' }] }))
        .then((data: any) => {
            const result: any = {};

            data.forEach((i: any) => {
                const date = new Date(i.date);
                i.dateStr = `${date.getFullYear()}-${date.getMonth() < 9 ? '0' : ''}${date.getMonth() + 1}-${date.getDate() < 10 ? '0' : ''}${date.getDate()}`;
                const r = i.market.resourceType;
                if (!result[r]) {
                    result[r] = {};
                }
                if (!result[r][i.dateStr]) {
                    result[r][i.dateStr] = { sumPrice: 0, sumAmount: 0, stddev: 0, cnt: 0 };
                }
                result[r][i.dateStr].sumPrice += i.change;
                result[r][i.dateStr].sumAmount += i.market.amount;
                result[r][i.dateStr].cnt++;
            });

            for (let resourceType in result) {
                for (let date in result[resourceType]) {
                    result[resourceType][date].avg = result[resourceType][date].sumPrice / result[resourceType][date].sumAmount;
                }
            }

            data.forEach((i: any) => {
                result[i.market.resourceType][i.dateStr].stddev += i.market.amount *
                    Math.pow(i.market.price - result[i.market.resourceType][i.dateStr].avg, 2) /
                    result[i.market.resourceType][i.dateStr].sumAmount;
            });

            const promises = [];

            for (let resourceType in result) {
                for (let date in result[resourceType]) {
                    const i = result[resourceType][date];
                    promises.push(db['market.stats'].insert({
                        resourceType,
                        date,
                        transactions: i.cnt,
                        volume: i.sumAmount,
                        avgPrice: +i.avg.toFixed(3),
                        stddevPrice: +Math.sqrt(i.stddev).toFixed(3)
                    }));
                }
            }

            return q.all(promises)
        }).catch(logger.info);
}

function calcPowerLevelBase(level: any) {
    return Math.pow(level, ScreepsConstants.POWER_LEVEL_POW) * ScreepsConstants.POWER_LEVEL_MULTIPLY;
}

function calcPowerLevel(power: any) {
    return Math.floor(Math.pow((power || 0) / ScreepsConstants.POWER_LEVEL_MULTIPLY, 1 / ScreepsConstants.POWER_LEVEL_POW));
}

function deletePowerCreeps() {
    return db['users.power_creeps'].find({ deleteTime: { $lt: Date.now() } })
        .then((data: any) => _.reduce(data, (promise: any, creep: any) => {
            if (!creep.deleteTime) {
                return promise;
            }
            return promise
                .then(() => db['users'].findOne({ _id: creep.user }))
                .then((user: any) => {
                    const level = calcPowerLevel(user.power);
                    const basePrev = calcPowerLevelBase(level - 1);
                    const baseCurrent = calcPowerLevelBase(level);
                    const baseNext = calcPowerLevelBase(level + 1);
                    const change = Math.round(user.power - basePrev -
                        (user.power - baseCurrent) * (baseCurrent - basePrev) / (baseNext - baseCurrent));
                    return q.all([
                        db['users'].update({ _id: user._id }, { $inc: { power: -change } }),
                        db['users.power_creeps'].removeWhere({ _id: creep._id })
                    ]);
                });
        }, q.when()));
}

function genDeposits() {
    return common.getGametime()
        .then((gameTime: any) => q.all([
            db.rooms.find({ $and: [{ _id: { $regex: '^[WE]\d*5[NS]\d*5$' } }, { 'status': { $ne: 'out of borders' } }] }),
            db['rooms.objects'].find({ type: 'deposit' })
        ])
            .then(result => {
                const promises: any[] = [];

                _.forEach(result[0], center => {
                    const sectorRegex = center._id.replace(
                        /^([WE]\d*)5([NS]\d*)5$/,
                        (_str: any, p1: any, p2: any) => `^${p1}\\d${p2}\\d$`);
                    const sectorDeposits = _.filter(result[1], (d: any) => d.room.match(sectorRegex));

                    const throughput = _.sum(sectorDeposits, deposit => 20 / Math.max(1, (ScreepsConstants.DEPOSIT_EXHAUST_MULTIPLY * Math.pow(deposit.harvested || 0, ScreepsConstants.DEPOSIT_EXHAUST_POW))));

                    if (throughput < 2.5) {
                        promises.push(
                            db.rooms.find({ $and: [{ _id: { $regex: sectorRegex } }, { bus: true }, { status: 'normal' }] })
                                .then((rooms: any) => {
                                    if (!_.some(rooms)) {
                                        return q.reject(`No normal bus rooms found for the sector of ${center._id}} (${sectorRegex})`);
                                    }

                                    const busyRooms = result[1].map((i: any) => i.room);
                                    const freeRooms = _.reject(rooms, (r: any) => _.includes(busyRooms, r._id));

                                    if (!_.some(freeRooms)) {
                                        return;
                                    }

                                    const room: any = _.sample(freeRooms);
                                    return q.all([db['rooms.objects'].find({ room: room._id }), db['rooms.terrain'].findOne({ room: room._id })])
                                        .then((data) => {
                                            const [objects, terrain] = data;
                                            if (!terrain) {
                                                logger.info(`${room._id}: no terrain`);
                                                return;
                                            }

                                            let x: any,
                                                y: any,
                                                isWall,
                                                hasExit,
                                                nearObjects,
                                                cnt = 0;
                                            do {
                                                cnt++;
                                                x = Math.floor(Math.random() * 40 + 5);
                                                y = Math.floor(Math.random() * 40 + 5);
                                                isWall = parseInt(terrain.terrain.charAt(y * 50 + x)) & 1;
                                                hasExit = false;
                                                for (let dx = -1; dx <= 1; dx++) {
                                                    for (let dy = -1; dy <= 1; dy++) {
                                                        if (!(parseInt(terrain.terrain.charAt((y + dy) * 50 + x + dx)) & 1)) {
                                                            hasExit = true;
                                                        }
                                                    }
                                                }
                                                nearObjects = _.any(objects, (obj: any) => Math.abs(obj.x - x) <= 2 && Math.abs(obj.y - y) <= 2);
                                            }
                                            while ((!isWall || !hasExit || nearObjects) && cnt < 1000);
                                            if (cnt >= 1000) {
                                                logger.info(`cannot find location in ${room._id}`);
                                                return;
                                            }

                                            if (room.depositType) {
                                                const obj = { type: 'deposit', depositType: room.depositType, x, y, room: room._id, harvested: 0, decayTime: ScreepsConstants.DEPOSIT_DECAY_TIME + gameTime };
                                                logger.info(`Spawning deposit of ${obj.depositType} in ${room._id}`);
                                                return db['rooms.objects'].insert(obj)
                                                    .then(db.rooms.update({ _id: room._id }, { $set: { active: true } }));
                                            }
                                        })
                                })
                        );
                    }
                });

                return q.all(promises);
            }));
}
