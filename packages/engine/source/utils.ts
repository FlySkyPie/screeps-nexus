import _ from 'lodash';

import * as _driver from '@screeps/vm-runtime/src/runtime-driver';
import { Direction } from '@screeps/common/src/constants/direction';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { Boosts } from '@screeps/common/src/constants/boosts';
import { Reactions } from '@screeps/common/src/constants/reactions';
import { ReactionTime } from '@screeps/common/src/constants/reaction-time';

let driver: any;
let offsetsByDirection: any;

function loadDriver() {
    offsetsByDirection = {
        [Direction.TOP]: [0, -1],
        [Direction.TOP_RIGHT]: [1, -1],
        [Direction.RIGHT]: [1, 0],
        [Direction.BOTTOM_RIGHT]: [1, 1],
        [Direction.BOTTOM]: [0, 1],
        [Direction.BOTTOM_LEFT]: [-1, 1],
        [Direction.LEFT]: [-1, 0],
        [Direction.TOP_LEFT]: [-1, -1]
    };
}

try {
    driver = _driver;
    loadDriver();
}
catch (e) { }

export function getDriver() {
    driver = typeof process != 'undefined' && process.env.DRIVER_MODULE ?
        require(process.env.DRIVER_MODULE) :
        require('./core/index');
    loadDriver();
    return driver;
}

export function getRuntimeDriver() {
    try {
        return _driver;
    }
    catch (e) {
        return getDriver();
    }
}

export function fetchXYArguments(firstArg: any, secondArg: any, globals: any) {
    let x, y, roomName;
    if (_.isUndefined(secondArg) || !_.isNumber(secondArg)) {
        if (!_.isObject(firstArg)) {
            return [undefined, undefined, undefined];
        }

        if (firstArg instanceof globals.RoomPosition) {
            x = firstArg.x;
            y = firstArg.y;
            roomName = firstArg.roomName;
        }
        if (firstArg.pos && (firstArg.pos instanceof globals.RoomPosition)) {
            x = firstArg.pos.x;
            y = firstArg.pos.y;
            roomName = firstArg.pos.roomName;
        }
    }
    else {
        x = firstArg;
        y = secondArg;
    }
    if (_.isNaN(x)) {
        x = undefined;
    }
    if (_.isNaN(y)) {
        y = undefined;
    }
    return [x, y, roomName];
}

export function getDirection(dx: any, dy: any) {

    const adx = Math.abs(dx), ady = Math.abs(dy);

    if (adx > ady * 2) {
        if (dx > 0) {
            return Direction.RIGHT;
        }
        else {
            return Direction.LEFT;
        }
    }
    else if (ady > adx * 2) {
        if (dy > 0) {
            return Direction.BOTTOM;
        }
        else {
            return Direction.TOP;
        }
    }
    else {
        if (dx > 0 && dy > 0) {
            return Direction.BOTTOM_RIGHT;
        }
        if (dx > 0 && dy < 0) {
            return Direction.TOP_RIGHT;
        }
        if (dx < 0 && dy > 0) {
            return Direction.BOTTOM_LEFT;
        }
        if (dx < 0 && dy < 0) {
            return Direction.TOP_LEFT;
        }
    }
}

export function getOffsetsByDirection(direction: any) {
    if (!offsetsByDirection[direction]) {
        try {
            throw new Error();
        }
        catch (e: any) {
            console.error(
                'Wrong move direction',
                JSON.stringify(direction),
                JSON.stringify(offsetsByDirection),
                e.stack);
        }

    }
    return offsetsByDirection[direction];
}

export function calcCreepCost(body: any) {
    let result = 0;

    body.forEach((i: any) => {
        if (_.isObject(i)) {
            result += ScreepsConstants.BODYPART_COST[i.type];
        }
        else {
            result += ScreepsConstants.BODYPART_COST[i];
        }
    });

    return result;
}

export function checkConstructionSite(objects: any, structureType: any, x: any, y: any) {

    let borderTiles;
    if (structureType != 'road' &&
        structureType != 'container' &&
        (x == 1 || x == 48 || y == 1 || y == 48)) {
        if (x == 1) borderTiles = [[0, y - 1], [0, y], [0, y + 1]];
        if (x == 48) borderTiles = [[49, y - 1], [49, y], [49, y + 1]];
        if (y == 1) borderTiles = [[x - 1, 0], [x, 0], [x + 1, 0]];
        if (y == 48) borderTiles = [[x - 1, 49], [x, 49], [x + 1, 49]];
    }

    if (_.isString(objects) || objects instanceof Uint8Array) {
        if (borderTiles) {
            for (var i in borderTiles) {
                if (!exports.checkTerrain(objects, borderTiles[i][0], borderTiles[i][1], ScreepsConstants.TERRAIN_MASK_WALL)) {
                    return false;
                }
            }
        }
        if (structureType == 'extractor') {
            return true;
        }
        if (structureType != 'road' && exports.checkTerrain(objects, x, y, ScreepsConstants.TERRAIN_MASK_WALL)) {
            return false;
        }
        return true;
    }

    if (objects && _.isArray(objects[0]) && _.isString(objects[0][0])) {
        if (borderTiles) {
            for (var i in borderTiles) {
                if (!(objects[borderTiles[i][1]][borderTiles[i][0]] & ScreepsConstants.TERRAIN_MASK_WALL)) {
                    return false;
                }
            }
        }
        if (structureType == 'extractor') {
            return true;
        }
        if (structureType != 'road' && objects[y][x] & ScreepsConstants.TERRAIN_MASK_WALL) {
            return false;
        }
        return true;
    }

    if (_.any(objects, { x, y, type: structureType })) {
        return false;
    }
    if (_.any(objects, { x, y, type: 'constructionSite' })) {
        return false;
    }
    if (structureType == 'extractor') {
        return _.any(objects, { x, y, type: 'mineral' }) && !_.any(objects, { x, y, type: 'extractor' });
    }
    if (structureType != 'rampart' && structureType != 'road' &&
        _.any(objects, (i: any) =>
            i.x == x &&
            i.y == y &&
            i.type != 'rampart' &&
            i.type != 'road' &&
            ScreepsConstants.CONSTRUCTION_COST[i.type])) {
        return false;
    }
    if (x <= 0 || y <= 0 || x >= 49 || y >= 49) {
        return false;
    }
    return true;
}

export function getDiff(oldData: any, newData: any) {

    function getIndex(data: any) {
        const index: Record<string, any> = {};
        _.forEach(data, (obj) => index[obj._id] = obj);
        return index;
    }


    const result: Record<string, any> = {},
        oldIndex = getIndex(oldData),
        newIndex = getIndex(newData);

    _.forEach(oldData, (obj: any) => {
        if (newIndex[obj._id]) {
            const newObj = newIndex[obj._id];
            const objDiff: Record<string, any> = result[obj._id] = {};
            for (var key in obj) {
                if (key == '_id') {
                    continue;
                }
                if (_.isUndefined(newObj[key])) {
                    objDiff[key] = null;
                }
                else if ((typeof obj[key]) != (typeof newObj[key]) || obj[key] && !newObj[key]) {
                    objDiff[key] = newObj[key];
                }
                else if (_.isObject(obj[key])) {
                    objDiff[key] = {};

                    for (var subkey in obj[key]) {
                        if (!_.isEqual(obj[key][subkey], newObj[key][subkey])) {
                            objDiff[key][subkey] = newObj[key][subkey];
                        }
                    }
                    for (var subkey in newObj[key]) {
                        if (_.isUndefined(obj[key][subkey])) {
                            objDiff[key][subkey] = newObj[key][subkey];
                        }
                    }
                    if (!_.size(objDiff[key])) {
                        delete result[obj._id][key];
                    }
                }
                else if (!_.isEqual(obj[key], newObj[key])) {
                    objDiff[key] = newObj[key];
                }
            }
            for (var key in newObj) {
                if (_.isUndefined(obj[key])) {
                    objDiff[key] = newObj[key];
                }
            }
            if (!_.size(objDiff)) {
                delete result[obj._id];
            }
        }
        else {
            result[obj._id] = null;
        }
    });

    _.forEach(newData, (obj) => {
        if (!oldIndex[obj._id]) {
            result[obj._id] = obj;
        }
    });

    return result;
}

export function encodeTerrain(terrain: any) {
    let result = '';
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const objects = _.filter(terrain, { x, y });
            let code = 0;
            if (_.any(objects, { type: 'wall' })) {
                code = code | ScreepsConstants.TERRAIN_MASK_WALL;
            }
            if (_.any(objects, { type: 'swamp' })) {
                code = code | ScreepsConstants.TERRAIN_MASK_SWAMP;
            }
            result = result + code;
        }
    }
    return result;
}

export function decodeTerrain(items: any) {
    const result = [];

    for (const i in items) {
        if (items[i].type != 'terrain') {
            continue;
        }

        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                const code = items[i].terrain.charAt(y * 50 + x);
                if (code & ScreepsConstants.TERRAIN_MASK_WALL) {
                    result.push({ room: items[i].room, x, y, type: 'wall' });
                }
                if (code & ScreepsConstants.TERRAIN_MASK_SWAMP) {
                    result.push({ room: items[i].room, x, y, type: 'swamp' });
                }
            }
        }
    }

    return result;
}

export function decodeTerrainByRoom(items: any) {
    const result: Record<string, any> = {
        spatial: {}
    };

    for (const i in items) {
        if (items[i].type != 'terrain') {
            continue;
        }
        result[items[i].room] = result[items[i].room] || [];
        result.spatial[items[i].room] = new Array(50);
        for (let y = 0; y < 50; y++) {
            result.spatial[items[i].room][y] = new Array(50);
            for (let x = 0; x < 50; x++) {
                const code = items[i].terrain.charAt(y * 50 + x);
                /*if (code & ScreepsConstants.TERRAIN_MASK_WALL) {
                    result[items[i].room].push({x, y, type: 'wall'});
                }
                if (code & ScreepsConstants.TERRAIN_MASK_SWAMP) {
                    result[items[i].room].push({x, y, type: 'swamp'});
                }*/
                result.spatial[items[i].room][y][x] = code;
            }
        }
    }

    return result;
}

export function checkTerrain(terrain: any, x: any, y: any, mask: any) {
    const code = terrain instanceof Uint8Array ? terrain[y * 50 + x] : Number(terrain.charAt(y * 50 + x));
    return (code & mask) > 0;
}

export function checkControllerAvailability(type: any, roomObjects: any, roomController: any, offset: any) {
    let rcl = 0;

    if (_.isObject(roomController) && roomController.level && (roomController.user || roomController.owner)) {
        rcl = roomController.level;
    }
    if (_.isNumber(roomController)) {
        rcl = roomController;
    }

    offset = offset || 0;

    const structuresCnt = _(roomObjects).filter((i: any) => i.type == type || i.type == 'constructionSite' && i.structureType == type).size();
    const availableCnt = ScreepsConstants.CONTROLLER_STRUCTURES[type][rcl] + offset;

    return structuresCnt < availableCnt;
}

// Note that game/rooms.js will swap this function out for a faster version, but may call back to
// this function.
export function getRoomNameFromXY(x: any, y: any) {
    if (x < 0) {
        x = 'W' + (-x - 1);
    }
    else {
        x = 'E' + (x);
    }
    if (y < 0) {
        y = 'N' + (-y - 1);
    }
    else {
        y = 'S' + (y);
    }
    return "" + x + y;
}

export function roomNameToXY(name: any) {
    let xx = parseInt(name.substr(1), 10);
    let verticalPos = 2;
    if (xx >= 100) {
        verticalPos = 4;
    } else if (xx >= 10) {
        verticalPos = 3;
    }
    let yy = parseInt(name.substr(verticalPos + 1), 10);
    let horizontalDir = name.charAt(0);
    let verticalDir = name.charAt(verticalPos);
    if (horizontalDir === 'W' || horizontalDir === 'w') {
        xx = -xx - 1;
    }
    if (verticalDir === 'N' || verticalDir === 'n') {
        yy = -yy - 1;
    }
    return [xx, yy];
}

export function comparatorDistance(target: any) {
    if (target.pos) target = target.pos;
    return (a: any, b: any) => {
        if (a.pos) a = a.pos;
        if (b.pos) b = b.pos;
        const da = Math.max(Math.abs(a.x - target.x), Math.abs(a.y - target.y));
        const db = Math.max(Math.abs(b.x - target.x), Math.abs(b.y - target.y));
        return da - db;
    };
}

export function storeIntents(_userId: any, userIntents: any, userRuntimeData: any) {
    const intents: Record<string, any> = {};

    for (const i in userIntents) {

        if (i == 'notify') {
            intents.notify = [];
            if (_.isArray(userIntents.notify)) {
                userIntents.notify.forEach((notifyItem: any) => {
                    intents.notify.push({
                        message: ("" + notifyItem.message).substring(0, 1000),
                        groupInterval: +notifyItem.groupInterval
                    })
                })
            }
            continue;
        }

        if (i == 'room') {
            const roomIntentsResult = userIntents.room;

            if (roomIntentsResult.createFlag) {
                _.forEach(roomIntentsResult.createFlag, (iCreateFlag) => {

                    intents[iCreateFlag.roomName] =
                        intents[iCreateFlag.roomName] || {};

                    const roomIntents = intents[iCreateFlag.roomName].room =
                        intents[iCreateFlag.roomName].room || {};

                    roomIntents.createFlag = roomIntents.createFlag || [];

                    roomIntents.createFlag.push({
                        x: parseInt(iCreateFlag.x),
                        y: parseInt(iCreateFlag.y),
                        name: "" + iCreateFlag.name,
                        color: +iCreateFlag.color,
                        secondaryColor: +iCreateFlag.secondaryColor,
                        roomName: iCreateFlag.roomName
                    })
                });
            }
            if (roomIntentsResult.createConstructionSite) {
                _.forEach(roomIntentsResult.createConstructionSite, (iCreateConstructionSite) => {

                    intents[iCreateConstructionSite.roomName] =
                        intents[iCreateConstructionSite.roomName] || {};

                    const roomIntents = intents[iCreateConstructionSite.roomName].room =
                        intents[iCreateConstructionSite.roomName].room || {};

                    roomIntents.createConstructionSite = roomIntents.createConstructionSite || [];

                    roomIntents.createConstructionSite.push({
                        x: parseInt(iCreateConstructionSite.x),
                        y: parseInt(iCreateConstructionSite.y),
                        structureType: "" + iCreateConstructionSite.structureType,
                        name: "" + iCreateConstructionSite.name,
                        roomName: "" + iCreateConstructionSite.roomName
                    });
                });
            }
            if (roomIntentsResult.removeConstructionSite) {
                _.forEach(roomIntentsResult.removeConstructionSite, (iRemoveConstructionSite) => {

                    intents[iRemoveConstructionSite.roomName] =
                        intents[iRemoveConstructionSite.roomName] || {};

                    const roomIntents = intents[iRemoveConstructionSite.roomName].room =
                        intents[iRemoveConstructionSite.roomName].room || {};

                    roomIntents.removeConstructionSite = roomIntents.removeConstructionSite || [];

                    roomIntents.removeConstructionSite.push({
                        roomName: "" + iRemoveConstructionSite.roomName,
                        id: "" + iRemoveConstructionSite.id
                    });
                });
            }
            if (roomIntentsResult.destroyStructure) {
                _.forEach(roomIntentsResult.destroyStructure, (iDestroyStructure) => {

                    intents[iDestroyStructure.roomName] =
                        intents[iDestroyStructure.roomName] || {};

                    const roomIntents = intents[iDestroyStructure.roomName].room =
                        intents[iDestroyStructure.roomName].room || {};

                    roomIntents.destroyStructure = roomIntents.destroyStructure || [];

                    roomIntents.destroyStructure.push({
                        roomName: "" + iDestroyStructure.roomName,
                        id: "" + iDestroyStructure.id
                    });
                });
            }

            if (roomIntentsResult.removeFlag) {
                _.forEach(roomIntentsResult.removeFlag, (iRemoveFlag) => {

                    intents[iRemoveFlag.roomName] =
                        intents[iRemoveFlag.roomName] || {};

                    const roomIntents = intents[iRemoveFlag.roomName].room =
                        intents[iRemoveFlag.roomName].room || {};

                    roomIntents.removeFlag = roomIntents.removeFlag || [];

                    roomIntents.removeFlag.push({
                        roomName: "" + iRemoveFlag.roomName,
                        name: "" + iRemoveFlag.name
                    });
                });
            }

            continue;
        }

        if (i == 'global') {
            const globalIntentsResult = userIntents.global;

            if (globalIntentsResult.createOrder) {
                _.forEach(globalIntentsResult.createOrder, (iCreateOrder: any) => {
                    intents.global = intents.global || {};
                    intents.global.createOrder = intents.global.createOrder || [];
                    intents.global.createOrder.push({
                        type: "" + iCreateOrder.type,
                        resourceType: "" + iCreateOrder.resourceType,
                        price: parseInt(iCreateOrder.price * 1000 as any),
                        totalAmount: parseInt(iCreateOrder.totalAmount),
                        roomName: iCreateOrder.roomName ? "" + iCreateOrder.roomName : undefined
                    })
                });
            }
            if (globalIntentsResult.cancelOrder) {
                _.forEach(globalIntentsResult.cancelOrder, (iCancelOrder) => {
                    intents.global = intents.global || {};
                    intents.global.cancelOrder = intents.global.cancelOrder || [];
                    intents.global.cancelOrder.push({ orderId: "" + iCancelOrder.orderId });
                });
            }
            if (globalIntentsResult.changeOrderPrice) {
                _.forEach(globalIntentsResult.changeOrderPrice, (iChangeOrderPrice) => {
                    intents.global = intents.global || {};
                    intents.global.changeOrderPrice = intents.global.changeOrderPrice || [];
                    intents.global.changeOrderPrice.push({
                        orderId: "" + iChangeOrderPrice.orderId,
                        newPrice: parseInt(iChangeOrderPrice.newPrice * 1000 as any),
                    });
                });
            }
            if (globalIntentsResult.extendOrder) {
                _.forEach(globalIntentsResult.extendOrder, (iExtendOrder) => {
                    intents.global = intents.global || {};
                    intents.global.extendOrder = intents.global.extendOrder || [];
                    intents.global.extendOrder.push({
                        orderId: "" + iExtendOrder.orderId,
                        addAmount: parseInt(iExtendOrder.addAmount),
                    });
                });
            }
            if (globalIntentsResult.deal) {
                _.forEach(globalIntentsResult.deal, (iDeal) => {
                    intents.global = intents.global || {};
                    intents.global.deal = intents.global.deal || [];
                    intents.global.deal.push({
                        orderId: "" + iDeal.orderId,
                        amount: parseInt(iDeal.amount),
                        targetRoomName: "" + iDeal.targetRoomName
                    });
                });
            }
            if (globalIntentsResult.spawnPowerCreep) {
                _.forEach(globalIntentsResult.spawnPowerCreep, (iSpawnPowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.spawnPowerCreep = intents.global.spawnPowerCreep || [];
                    intents.global.spawnPowerCreep.push({
                        id: "" + iSpawnPowerCreep.id,
                        name: "" + iSpawnPowerCreep.name,
                    });
                });
            }
            if (globalIntentsResult.suicidePowerCreep) {
                _.forEach(globalIntentsResult.suicidePowerCreep, (iSuicidePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.suicidePowerCreep = intents.global.suicidePowerCreep || [];
                    intents.global.suicidePowerCreep.push({
                        id: "" + iSuicidePowerCreep.id,
                    });
                });
            }
            if (globalIntentsResult.deletePowerCreep) {
                _.forEach(globalIntentsResult.deletePowerCreep, (iDeletePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.deletePowerCreep = intents.global.deletePowerCreep || [];
                    intents.global.deletePowerCreep.push({
                        id: "" + iDeletePowerCreep.id,
                        cancel: !!iDeletePowerCreep.cancel
                    });
                });
            }
            if (globalIntentsResult.upgradePowerCreep) {
                _.forEach(globalIntentsResult.upgradePowerCreep, (iUpgradePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.upgradePowerCreep = intents.global.upgradePowerCreep || [];
                    intents.global.upgradePowerCreep.push({
                        id: "" + iUpgradePowerCreep.id,
                        power: +iUpgradePowerCreep.power
                    });
                });
            }
            if (globalIntentsResult.createPowerCreep) {
                _.forEach(globalIntentsResult.createPowerCreep, (iCreatePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.createPowerCreep = intents.global.createPowerCreep || [];
                    intents.global.createPowerCreep.push({
                        name: "" + iCreatePowerCreep.name,
                        className: "" + iCreatePowerCreep.className,
                    });
                });
            }
            if (globalIntentsResult.renamePowerCreep) {
                _.forEach(globalIntentsResult.renamePowerCreep, (iRenamePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.renamePowerCreep = intents.global.renamePowerCreep || [];
                    intents.global.renamePowerCreep.push({
                        id: "" + iRenamePowerCreep.id,
                        name: "" + iRenamePowerCreep.name
                    });
                });
            }
            continue;
        }

        const object = userRuntimeData.userObjects[i] || userRuntimeData.roomObjects[i];

        if (!object) {
            continue;
        }

        const objectIntentsResult = userIntents[i];

        intents[object.room] = intents[object.room] || {};

        const objectIntents: Record<string, any> = intents[object.room][i] = {};

        // transfer can be invoked by another player

        if (objectIntentsResult.transfer) {
            objectIntents.transfer = {
                id: "" + objectIntentsResult.transfer.id,
                amount: parseInt(objectIntentsResult.transfer.amount),
                resourceType: "" + objectIntentsResult.transfer.resourceType
            };
        }

        if (objectIntentsResult.move) {
            objectIntents.move = objectIntentsResult.move.id ?
                { id: "" + objectIntentsResult.move.id } :
                { direction: parseInt(objectIntentsResult.move.direction) };
        }
        if (objectIntentsResult.pull) {
            objectIntents.pull = {
                id: "" + objectIntentsResult.pull.id
            };
        }
        if (objectIntentsResult.harvest) {
            objectIntents.harvest = {
                id: "" + objectIntentsResult.harvest.id
            };
        }
        if (objectIntentsResult.attack) {
            objectIntents.attack = {
                id: "" + objectIntentsResult.attack.id,
                x: parseInt(objectIntentsResult.attack.x),
                y: parseInt(objectIntentsResult.attack.y)
            };
        }
        if (objectIntentsResult.rangedAttack) {
            objectIntents.rangedAttack = {
                id: "" + objectIntentsResult.rangedAttack.id
            };
        }
        if (objectIntentsResult.rangedMassAttack) {
            objectIntents.rangedMassAttack = {};
        }
        if (objectIntentsResult.heal) {
            objectIntents.heal = {
                id: "" + objectIntentsResult.heal.id,
                x: parseInt(objectIntentsResult.heal.x),
                y: parseInt(objectIntentsResult.heal.y)
            };
        }
        if (objectIntentsResult.rangedHeal) {
            objectIntents.rangedHeal = {
                id: "" + objectIntentsResult.rangedHeal.id
            };
        }
        if (objectIntentsResult.repair) {
            objectIntents.repair = {
                id: "" + objectIntentsResult.repair.id,
                x: parseInt(objectIntentsResult.repair.x),
                y: parseInt(objectIntentsResult.repair.y)
            };
        }
        if (objectIntentsResult.build) {
            objectIntents.build = {
                id: "" + objectIntentsResult.build.id,
                x: parseInt(objectIntentsResult.build.x),
                y: parseInt(objectIntentsResult.build.y)
            };
        }
        if (objectIntentsResult.drop) {
            objectIntents.drop = {
                amount: parseInt(objectIntentsResult.drop.amount),
                resourceType: "" + objectIntentsResult.drop.resourceType
            };
        }
        if (objectIntentsResult.pickup) {
            objectIntents.pickup = {
                id: "" + objectIntentsResult.pickup.id
            };
        }
        if (objectIntentsResult.createCreep) {
            objectIntents.createCreep = {
                name: "" + objectIntentsResult.createCreep.name,
                body: _.filter(objectIntentsResult.createCreep.body, (i) => _.contains(ListItems.BODYPARTS_ALL, i)),
                energyStructures: objectIntentsResult.createCreep.energyStructures,
                directions: objectIntentsResult.createCreep.directions
            };
        }
        if (objectIntentsResult.renewCreep) {
            objectIntents.renewCreep = {
                id: "" + objectIntentsResult.renewCreep.id
            };
        }
        if (objectIntentsResult.recycleCreep) {
            objectIntents.recycleCreep = {
                id: "" + objectIntentsResult.recycleCreep.id
            };
        }
        if (objectIntentsResult.suicide) {
            objectIntents.suicide = {};
        }
        if (objectIntentsResult.remove) {
            objectIntents.remove = {};
        }
        if (objectIntentsResult.unclaim) {
            objectIntents.unclaim = {};
        }
        if (objectIntentsResult.say) {
            objectIntents.say = {
                message: objectIntentsResult.say.message.substring(0, 10),
                isPublic: !!objectIntentsResult.say.isPublic
            };
        }
        if (objectIntentsResult.claimController) {
            objectIntents.claimController = {
                id: "" + objectIntentsResult.claimController.id
            };
        }
        if (objectIntentsResult.attackController) {
            objectIntents.attackController = {
                id: "" + objectIntentsResult.attackController.id
            };
        }
        if (objectIntentsResult.unclaimController) {
            objectIntents.unclaimController = {
                id: "" + objectIntentsResult.unclaimController.id
            };
        }
        if (objectIntentsResult.upgradeController) {
            objectIntents.upgradeController = {
                id: "" + objectIntentsResult.upgradeController.id
            };
        }
        if (objectIntentsResult.reserveController) {
            objectIntents.reserveController = {
                id: "" + objectIntentsResult.reserveController.id
            };
        }
        if (objectIntentsResult.notifyWhenAttacked) {
            objectIntents.notifyWhenAttacked = {
                enabled: !!objectIntentsResult.notifyWhenAttacked.enabled
            };
        }
        if (objectIntentsResult.setPosition) {
            objectIntents.setPosition = {
                x: parseInt(objectIntentsResult.setPosition.x),
                y: parseInt(objectIntentsResult.setPosition.y),
                roomName: "" + objectIntentsResult.setPosition.roomName
            };
        }
        if (objectIntentsResult.setColor) {
            objectIntents.setColor = {
                color: "" + objectIntentsResult.setColor.color,
                secondaryColor: "" + objectIntentsResult.setColor.secondaryColor
            };
        }
        if (objectIntentsResult.destroy) {
            objectIntents.destroy = {};
        }
        if (objectIntentsResult.observeRoom) {
            objectIntents.observeRoom = {
                roomName: "" + objectIntentsResult.observeRoom.roomName
            };
        }
        if (objectIntentsResult.processPower) {
            objectIntents.processPower = {};
        }
        if (objectIntentsResult.dismantle) {
            objectIntents.dismantle = {
                id: "" + objectIntentsResult.dismantle.id
            };
        }
        if (objectIntentsResult.runReaction) {
            objectIntents.runReaction = {
                lab1: "" + objectIntentsResult.runReaction.lab1,
                lab2: "" + objectIntentsResult.runReaction.lab2
            };
        }
        if (objectIntentsResult.boostCreep) {
            objectIntents.boostCreep = {
                id: "" + objectIntentsResult.boostCreep.id,
                bodyPartsCount: parseInt(objectIntentsResult.boostCreep.bodyPartsCount)
            };
        }
        if (objectIntentsResult.unboostCreep) {
            objectIntents.unboostCreep = {
                id: "" + objectIntentsResult.unboostCreep.id
            }
        }
        if (objectIntentsResult.send) {
            objectIntents.send = {
                targetRoomName: "" + objectIntentsResult.send.targetRoomName,
                resourceType: "" + objectIntentsResult.send.resourceType,
                amount: parseInt(objectIntentsResult.send.amount),
                description: ("" + (objectIntentsResult.send.description || "")).substring(0, 100)
            };
        }
        if (objectIntentsResult.launchNuke) {
            objectIntents.launchNuke = {
                roomName: "" + objectIntentsResult.launchNuke.roomName,
                x: parseInt(objectIntentsResult.launchNuke.x),
                y: parseInt(objectIntentsResult.launchNuke.y)
            };
        }
        if (objectIntentsResult.setPublic) {
            objectIntents.setPublic = {
                isPublic: !!objectIntentsResult.setPubliScreepsConstants.isPublic
            };
        }
        if (objectIntentsResult.withdraw) {
            objectIntents.withdraw = {
                id: "" + objectIntentsResult.withdraw.id,
                amount: parseInt(objectIntentsResult.withdraw.amount),
                resourceType: "" + objectIntentsResult.withdraw.resourceType
            };
        }
        if (objectIntentsResult.activateSafeMode) {
            objectIntents.activateSafeMode = {};
        }
        if (objectIntentsResult.generateSafeMode) {
            objectIntents.generateSafeMode = {
                id: "" + objectIntentsResult.generateSafeMode.id,
            };
        }
        if (objectIntentsResult.signController) {
            objectIntents.signController = {
                id: "" + objectIntentsResult.signController.id,
                sign: ("" + objectIntentsResult.signController.sign).substring(0, 100)
            };
        }
        if (objectIntentsResult.setSpawnDirections) {
            objectIntents.setSpawnDirections = {
                directions: objectIntentsResult.setSpawnDirections.directions
            };
        }
        if (objectIntentsResult.cancelSpawning) {
            objectIntents.cancelSpawning = {};
        }
        if (objectIntentsResult.usePower) {
            objectIntents.usePower = {
                power: +objectIntentsResult.usePower.power,
                id: "" + objectIntentsResult.usePower.id
            };
        }
        if (objectIntentsResult.enableRoom) {
            objectIntents.enableRoom = {
                id: "" + objectIntentsResult.enableRoom.id
            };
        }
        if (objectIntentsResult.renew) {
            objectIntents.renew = {
                id: "" + objectIntentsResult.renew.id
            };
        }
        if (objectIntentsResult.produce) {
            objectIntents.produce = {
                id: "" + objectIntentsResult.produce.id,
                resourceType: "" + objectIntentsResult.produce.resourceType
            };
        }

        // for(var iCustomType in driver.config.customIntentTypes) {
        //     if(objectIntentsResult[iCustomType]) {
        //         objectIntents[iCustomType] = {};
        //         for(var prop in driver.config.customIntentTypes[iCustomType]) {
        //             switch(driver.config.customIntentTypes[iCustomType][prop]) {
        //                 case 'string': {
        //                     objectIntents[iCustomType][prop] = "" + objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //                 case 'number': {
        //                     objectIntents[iCustomType][prop] = +objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //                 case 'boolean': {
        //                     objectIntents[iCustomType][prop] = !!objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //             }
        //         }
        //     }
        // }

    }

    return intents;
}

export function sendAttackingNotification(target: any, roomController: any) {
    const driver = exports.getDriver();
    let labelText;
    if (target.type == 'creep') {
        labelText = 'creep ' + target.name;
    }
    else if (target.type == 'spawn') {
        labelText = 'spawn ' + target.name;
    }
    else {
        labelText = `${target.type} #${target._id}`;
    }
    const user = target.user ? target.user : roomController ? roomController.user : null;
    if (user) {
        driver.sendNotification(user, `Your ${labelText} in room ${target.room} is under attack!`);
    }
}

export function checkStructureAgainstController(object: any, roomObjects: any, roomController: any) {
    // owner-less objects are always active
    if (!object.user) {
        return true;
    }

    // eliminate some other easy cases
    if (!roomController || roomController.level < 1 || roomController.user !== object.user) {
        return false;
    }

    let allowedRemaining = ScreepsConstants.CONTROLLER_STRUCTURES[object.type][roomController.level];

    if (allowedRemaining === 0) {
        return false;
    }

    // if only one object ever allowed, this is it
    if (ScreepsConstants.CONTROLLER_STRUCTURES[object.type][8] === 1) {
        return allowedRemaining !== 0;
    }

    // Scan through the room objects of the same type and count how many are closer.
    let foundSelf = false;
    let objectDist = Math.max(Math.abs(object.x - roomController.x), Math.abs(object.y - roomController.y));
    let objectIds = _.keys(roomObjects);
    for (let i = 0; i < objectIds.length; i++) {
        let compareObj = roomObjects[objectIds[i]];
        if (compareObj.type === object.type && compareObj.user === object.user) {
            let compareDist = Math.max(Math.abs(compareObj.x - roomController.x), Math.abs(compareObj.y - roomController.y));

            if (compareDist < objectDist) {
                allowedRemaining--;
                if (allowedRemaining === 0) {
                    return false;
                }
            } else if (!foundSelf && compareDist === objectDist) {
                // Objects of equal distance that are discovered before we scan over the selected object are considered closer
                if (object === compareObj) {
                    foundSelf = true;
                } else {
                    allowedRemaining--;
                    if (allowedRemaining === 0) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

export function defineGameObjectProperties(obj: any, _dataFn: any, properties: any, opts: any) {
    const propertiesInfo = {};
    opts = opts || {};
    if (opts.enumerable === undefined) {
        opts.enumerable = true;
    }

    for (const name in properties) {
        eval(`
            propertiesInfo['${name}'] = {
                configurable: !!opts.configurable,
                enumerable: !!opts.enumerable,
                get() {
                    if(!this['_${name}']) {
                        this['_${name}'] = properties['${name}'](dataFn(this.id), this.id);
                    }
                    return this['_${name}'];
                },
                set: opts.canSet ? function(value) {
                    this['_${name}'] = value;
                } : undefined
                
            }`);
    }
    Object.defineProperties(obj, propertiesInfo);

    obj.toJSON = function () {
        const result: Record<string, any> = {};
        for (const i in this) {
            if (i[0] == '_' || _.contains(['toJSON', 'toString'], i)) {
                continue;
            }
            result[i] = this[i];
        }
        return result;
    }
}

export function isAtEdge(object: any) {
    if (object.pos) {
        object = object.pos;
    }

    return object.x == 0 || object.x == 49 || object.y == 0 || object.y == 49
}

export function serializePath(path: any) {
    if (!_.isArray<any>(path)) {
        throw new Error('path is not an array');
    }
    let result = '';
    if (!path.length) {
        return result;
    }
    if (path[0].x < 0 || path[0].y < 0) {
        throw new Error('path coordinates cannot be negative');
    }
    result += path[0].x > 9 ? path[0].x : '0' + path[0].x;
    result += path[0].y > 9 ? path[0].y : '0' + path[0].y;

    for (let i = 0; i < path.length; i++) {
        result += path[i].direction;
    }

    return result;
}

export function deserializePath(path: any) {
    if (!_.isString(path)) {
        throw new Error('`path` is not a string');
    }

    const result: any[] = [];
    if (!path.length) {
        return result;
    }
    let x, y, direction, dx, dy;

    x = parseInt(path.substring(0, 2));
    y = parseInt(path.substring(2, 4));
    if (_.isNaN(x) || _.isNaN(y)) {
        throw new Error('`path` is not a valid serialized path string');
    }

    for (let i = 4; i < path.length; i++) {
        direction = parseInt(path.charAt(i));
        if (!offsetsByDirection[direction]) {
            throw new Error('`path` is not a valid serialized path string');
        }
        dx = offsetsByDirection[direction][0];
        dy = offsetsByDirection[direction][1];
        if (i > 4) {
            x += dx;
            y += dy;
        }
        result.push({
            x, y,
            dx, dy,
            direction
        });
    }


    return result;
}

export function calcResources(object: any) {
    if (object.store) {
        return _.sum(object.store);
    }

    return _.sum(ListItems.RESOURCES_ALL, i =>
        typeof object[i] == 'object' ?
            object[i].amount :
            (object[i] || 0));
}

export function calcBodyEffectiveness(
    body: any,
    bodyPartType: any,
    methodName: any,
    basePower: any,
    withoutOldHits?: any) {
    let power = 0;
    body.forEach((i: any) => {
        if (!(i.hits || !withoutOldHits && i._oldHits) || i.type != bodyPartType) {
            return;
        }
        let iPower = basePower;
        if (i.boost && (Boosts as any)[bodyPartType][i.boost] && (Boosts as any)[bodyPartType][i.boost][methodName]) {
            iPower *= (Boosts as any)[bodyPartType][i.boost][methodName];
        }
        power += iPower;
    });
    return power;
}

export function dist(a: any, b: any) {
    if (a.pos) a = a.pos;
    if (b.pos) b = b.pos;
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function calcRoomsDistance(room1: any, room2: any, continuous: any) {
    const [x1, y1] = exports.roomNameToXY(room1);
    const [x2, y2] = exports.roomNameToXY(room2);
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    if (continuous) {
        const worldSize = driver.getWorldSize();
        dx = Math.min(worldSize - dx, dx);
        dy = Math.min(worldSize - dy, dy);
    }
    return Math.max(dx, dy);
}

export function calcTerminalEnergyCost(amount: any, range: any) {
    return Math.ceil(amount * (1 - Math.exp(-range / 30)))
}

export function calcNeededGcl(gclLevel: any) {
    return ScreepsConstants.GCL_MULTIPLY * Math.pow(gclLevel - 1, ScreepsConstants.GCL_POW);
}

export function calcTotalReactionsTime(mineral: any) {
    const reagents = _.reduce((Reactions as any), (a: any, n: any, j: any) => {
        _.forEach(n, (k, v) => a[k] = [v, j]); return a;
    }, {});
    const calcStep = (m: any): any => !!ReactionTime[m] ? ReactionTime[m] + calcStep(reagents[m][0]) + calcStep(reagents[m][1]) : 0;
    return calcStep(mineral);
}

export function capacityForResource(object: any, resourceType: any) {
    return object.storeCapacityResource &&
        object.storeCapacityResource[resourceType] ||
        Math.max(0, (object.storeCapacity || 0) - _.sum(object.storeCapacityResource));
}

export function calcReward(resourceDensities: any, targetDensity: any, itemsLimit?: any) {
    let resources: any[] = [];
    let densities: any[] = [];
    _.forEach(resourceDensities, (density, resource) => {
        resources.push(resource);
        densities.push(density);
    });

    let order = _.shuffle(_.range(resources.length));
    if (itemsLimit) {
        order = order.slice(0, itemsLimit);
    }
    let result = _.times<any>(order.length, (0 as any));
    let currentDensity = 0;
    for (let i = 0; i < order.length - 1; i++) {
        result[i] = Math.round(Math.random() * (targetDensity - currentDensity) / densities[order[i]]);
        currentDensity += result[i] * densities[order[i]];
    }
    result[order.length - 1] = Math.round((targetDensity - currentDensity) / densities[order.length - 1]);

    return _.object(order.map(i => resources[i]), result);
}
