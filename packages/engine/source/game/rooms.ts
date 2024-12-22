import _ from 'lodash';

import pathfinding from '@screeps/pathfinding/source/PathFinding';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { FindCode } from '@screeps/common/src/constants/find-code';
import { LookEnum } from '@screeps/common/src/constants/look-enum';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { ColorCode } from '@screeps/common/src/constants/color-code';

import {
    checkConstructionSite, checkControllerAvailability,
    deserializePath, fetchXYArguments, getDirection,
    getRoomNameFromXYFaster, roomNameToXY, serializePath
} from '../utils';

const abs = Math.abs;
// const min = Math.min;
const max = Math.max;

let runtimeData: any,
    intents: any,
    register: any,
    globals: any;

let positionsSetCacheCounter: any,
    createdFlagNames: any,
    createdSpawnNames: any,
    privateStore: any,
    createdConstructionSites: any;

let TerrainConstructor: any = null;
let TerrainConstructorSet: any = null;

function getPathfinder(id: any, opts: any) {
    opts = opts || {};
    _.defaults(opts, { maxOps: 2000, heuristicWeight: 1 });
    const key = `${opts.maxOps},${opts.heuristicWeight}`;

    if (!privateStore[id].pfFinders[key]) {
        privateStore[id].pfFinders[key] = new pathfinding.AStarFinder({
            diagonalMovement: 1,
            maxOpsLimit: opts.maxOps,
            heuristic: pathfinding.Heuristic.chebyshev,
            weight: opts.heuristicWeight
        });
    }
    return privateStore[id].pfFinders[key];
}

function makePathfindingGrid(id: any, opts: any, endNodesKey: any) {
    opts = opts || {};

    const rows = new Array(50);
    let obstacleTypes = _.clone(ScreepsConstants.OBSTACLE_OBJECT_TYPES);

    if (opts.ignoreDestructibleStructures) {
        obstacleTypes = _.without(obstacleTypes, 'constructedWall', 'spawn', 'extension', 'link', 'storage', 'observer', 'tower', 'powerBank', 'powerSpawn', 'lab', 'terminal');
    }
    if (opts.ignoreCreeps) {
        obstacleTypes = _.without(obstacleTypes, 'creep', 'powerCreep');
    }

    for (let y = 0; y < 50; y++) {
        rows[y] = new Array(50);
        for (let x = 0; x < 50; x++) {
            rows[y][x] = x == 0 || y == 0 || x == 49 || y == 49 ? 11 : 2;
            //var terrainCode = register.terrainByRoom.spatial[id][y][x];
            const terrainCode = runtimeData.staticTerrainData[id][y * 50 + x];
            if (terrainCode & ScreepsConstants.TERRAIN_MASK_WALL) {
                rows[y][x] = 0;
            }
            if ((terrainCode & ScreepsConstants.TERRAIN_MASK_SWAMP) && rows[y][x] == 2) {
                rows[y][x] = 10;
            }
        }
    }

    register.objectsByRoomKeys[id].forEach((key: any) => {
        const object = register.objectsByRoom[id][key];

        if (_.contains(obstacleTypes, object.type) ||
            !opts.ignoreDestructibleStructures && object.type == 'rampart' && !object.isPublic && object.user != runtimeData.user._id ||
            !opts.ignoreDestructibleStructures && object.type == 'constructionSite' && object.user == runtimeData.user._id && _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, object.structureType)) {

            rows[object.y][object.x] = 0;
        }

        if (object.type == 'road' && rows[object.y][object.x] > 0) {
            rows[object.y][object.x] = 1;
        }
    });


    if (opts.ignore) {
        if (!_.isArray(opts.ignore)) {
            throw new Error('option `ignore` is not an array');
        }
        _.forEach(opts.ignore, (i: any, key: any) => {
            if (!i) {
                return;
            }
            if (i.pos) {
                rows[i.pos.y][i.pos.x] = rows[i.pos.y][i.pos.x] > 2 ? 2 : rows[i.pos.y][i.pos.x];
            }
            if (_.isObject(i) && !_.isUndefined(i.x) && !(i instanceof globals.RoomPosition)) {
                opts.ignore[key] = new globals.RoomPosition(i.x, i.y, id);
            }
            if (!_.isUndefined(i.x)) {
                rows[i.y][i.x] = rows[i.y][i.x] > 2 ? 2 : rows[i.y][i.x];
            }
        });
    }

    if (opts.avoid) {
        if (!_.isArray(opts.avoid)) {
            throw new Error('option `avoid` is not an array');
        }
        _.forEach(opts.avoid, (i: any, key: any) => {
            if (!i) {
                return;
            }
            if (i.pos) {
                rows[i.pos.y][i.pos.x] = 0;
            }
            if (_.isObject(i) && !_.isUndefined(i.x) && !(i instanceof globals.RoomPosition)) {
                opts.avoid[key] = new globals.RoomPosition(i.x, i.y, id);
            }
            if (!_.isUndefined(i.x)) {
                rows[i.y][i.x] = 0;
            }
        });
    }
    if (endNodesKey) {
        _.forEach(privateStore[id].pfEndNodes[endNodesKey], (i) => {
            if (!_.isUndefined(i.x)) {
                rows[i.y][i.x] = 999;
            }
            else if (!_.isUndefined(i.pos)) {
                rows[i.pos.y][i.pos.x] = 999;
            }
        });
    }

    return new pathfinding.Grid(50, 50, rows);
}

function getPathfindingGrid(id: any, opts: any, endNodesKey?: any) {

    let gridName = 'grid';

    opts = opts || {};

    if (opts.ignoreCreeps) {
        gridName += '_ignoreCreeps'
    }
    if (opts.ignoreDestructibleStructures) {
        gridName += '_ignoreDestructibleStructures'
    }
    if (_.isNumber(endNodesKey)) {
        gridName += '_endNodes' + endNodesKey;
    }
    if (opts.avoid) {
        gridName += '_avoid' + privateStore[id].positionsSetCache.key(opts.avoid);
    }
    if (opts.ignore) {
        gridName += '_ignore' + privateStore[id].positionsSetCache.key(opts.ignore);
    }

    if (!privateStore[id].pfGrid[gridName]) privateStore[id].pfGrid[gridName] = makePathfindingGrid(id, opts, endNodesKey);

    return privateStore[id].pfGrid[gridName].clone();
}

function makePathfindingGrid2(id: any, opts: any) {

    opts = opts || {};

    const costs = new globals.PathFinder.CostMatrix();

    let obstacleTypes = _.clone(ScreepsConstants.OBSTACLE_OBJECT_TYPES);
    obstacleTypes.push('portal');

    if (opts.ignoreDestructibleStructures) {
        obstacleTypes = _.without(obstacleTypes, 'constructedWall', 'spawn', 'extension', 'link', 'storage', 'observer', 'tower', 'powerBank', 'powerSpawn', 'lab', 'terminal');
    }
    if (opts.ignoreCreeps || register.rooms[id].controller && register.rooms[id].controller.safeMode && register.rooms[id].controller.my) {
        obstacleTypes = _.without(obstacleTypes, 'creep', 'powerCreep');
    }

    if (register.objectsByRoomKeys[id]) {
        register.objectsByRoomKeys[id].forEach((key: any) => {
            const object = register.objectsByRoom[id][key];

            if (_.contains(obstacleTypes, object.type) ||
                !opts.ignoreCreeps && register.rooms[id].controller && register.rooms[id].controller.safeMode && register.rooms[id].controller.my && (object.type == 'creep' || object.type == 'powerCreep') && object.user == runtimeData.user._id ||
                !opts.ignoreDestructibleStructures && object.type == 'rampart' && !object.isPublic && object.user != runtimeData.user._id ||
                !opts.ignoreDestructibleStructures && object.type == 'constructionSite' && object.user == runtimeData.user._id && _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, object.structureType)) {

                costs.set(object.x, object.y, 0xFF);
            }

            if (object.type == 'swamp' && costs.get(object.x, object.y) == 0) {
                costs.set(object.x, object.y, opts.ignoreRoads ? 5 : 10);
            }

            if (!opts.ignoreRoads && object.type == 'road' && costs.get(object.x, object.y) < 0xFF) {
                costs.set(object.x, object.y, 1);
            }
        });
    }

    return costs;
}

function getPathfindingGrid2(id: any, opts: any) {

    if (!privateStore[id]) {
        return new globals.PathFinder.CostMatrix();
    }

    let gridName = 'grid2';

    opts = opts || {};

    if (opts.ignoreCreeps) {
        gridName += '_ignoreCreeps';
    }
    if (opts.ignoreDestructibleStructures) {
        gridName += '_ignoreDestructibleStructures';
    }
    if (opts.ignoreRoads) {
        gridName += '_ignoreRoads';
    }

    if (!privateStore[id].pfGrid[gridName]) privateStore[id].pfGrid[gridName] = makePathfindingGrid2(id, opts);

    return privateStore[id].pfGrid[gridName];
}

function _findPath2(id: any, fromPos: any, toPos: any, opts: any) {

    opts = opts || {};

    if (fromPos.isEqualTo(toPos)) {
        return opts.serialize ? '' : [];
    }

    if (opts.avoid) {
        register.deprecated('`avoid` option cannot be used when `PathFinder.use()` is enabled. Use `costCallback` instead.');
        opts.avoid = undefined;
    }
    if (opts.ignore) {
        register.deprecated('`ignore` option cannot be used when `PathFinder.use()` is enabled. Use `costCallback` instead.');
        opts.ignore = undefined;
    }
    if (opts.maxOps === undefined && (opts.maxRooms === undefined || opts.maxRooms > 1) && fromPos.roomName != toPos.roomName) {
        opts.maxOps = 20000;
    }
    const searchOpts: Record<string, any> = {
        roomCallback: function (roomName: any) {
            let costMatrix = getPathfindingGrid2(roomName, opts);
            if (typeof opts.costCallback == 'function') {
                costMatrix = costMatrix.clone();
                const resultMatrix = opts.costCallback(roomName, costMatrix);
                if (resultMatrix instanceof globals.PathFinder.CostMatrix) {
                    costMatrix = resultMatrix;
                }
            }
            return costMatrix;
        },
        maxOps: opts.maxOps,
        maxRooms: opts.maxRooms
    };
    if (!opts.ignoreRoads) {
        searchOpts.plainCost = 2;
        searchOpts.swampCost = 10;
    }
    if (opts.plainCost) {
        searchOpts.plainCost = opts.plainCost;
    }
    if (opts.swampCost) {
        searchOpts.swampCost = opts.swampCost;
    }

    const ret = globals.PathFinder.search(fromPos, { range: Math.max(1, opts.range || 0), pos: toPos }, searchOpts);

    if (!opts.range &&
        (ret.path.length && ret.path[ret.path.length - 1].isNearTo(toPos) && !ret.path[ret.path.length - 1].isEqualTo(toPos) ||
            !ret.path.length && fromPos.isNearTo(toPos))) {
        ret.path.push(toPos);
    }
    let curX = fromPos.x, curY = fromPos.y;

    const resultPath = [];

    for (let i = 0; i < ret.path.length; i++) {
        let pos = ret.path[i];
        if (pos.roomName != id) {
            break;
        }
        let result = {
            x: pos.x,
            y: pos.y,
            dx: pos.x - curX,
            dy: pos.y - curY,
            direction: getDirection(pos.x - curX, pos.y - curY)
        };

        curX = result.x;
        curY = result.y;
        resultPath.push(result);
    }

    if (opts.serialize) {
        return serializePath(resultPath);
    }

    return resultPath;
}

function _findClosestByPath2(fromPos: any, objects: any, opts: any) {

    opts = opts || {};

    if (_.isNumber(objects)) {
        objects = register.rooms[fromPos.roomName].find(objects, { filter: opts.filter });
    }
    else if (opts.filter) {
        objects = _.filter(objects, opts.filter);
    }

    if (!objects.length) {
        return null;
    }

    const objectOnSquare = _.find(objects, obj => fromPos.isEqualTo(obj));
    if (objectOnSquare) {
        return objectOnSquare;
    }

    const goals = _.map(objects, (i: any) => {
        if (i.pos) {
            i = i.pos;
        }
        return { range: 1, pos: i };
    });

    if (opts.avoid) {
        register.deprecated('`avoid` option cannot be used when `PathFinder.use()` is enabled. Use `costCallback` instead.');
    }
    if (opts.ignore) {
        register.deprecated('`ignore` option cannot be used when `PathFinder.use()` is enabled. Use `costCallback` instead.');
    }
    const searchOpts: Record<string, any> = {
        roomCallback: function (roomName: any) {
            if (register.objectsByRoom[roomName]) {
                let costMatrix = getPathfindingGrid2(roomName, opts);
                if (typeof opts.costCallback == 'function') {
                    costMatrix = costMatrix.clone();
                    const resultMatrix = opts.costCallback(roomName, costMatrix);
                    if (resultMatrix instanceof globals.PathFinder.CostMatrix) {
                        costMatrix = resultMatrix;
                    }
                }
                return costMatrix;
            }
        },
        maxOps: opts.maxOps,
        maxRooms: 1
    };
    if (!opts.ignoreRoads) {
        searchOpts.plainCost = 2;
        searchOpts.swampCost = 10;
    }
    const ret = globals.PathFinder.search(fromPos, goals, searchOpts);

    let result = null;
    let lastPos = fromPos;

    if (ret.path.length) {
        lastPos = ret.path[ret.path.length - 1];
    }

    objects.forEach((obj: any) => {
        if (lastPos.isNearTo(obj)) {
            result = obj;
        }
    });

    return result;
}

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    positionsSetCacheCounter = 1;
    createdFlagNames = [];
    createdSpawnNames = [];
    privateStore = {};
    createdConstructionSites = 0;

    TerrainConstructor || (() => {
        for (const roomName in runtimeData.staticTerrainData) {
            const array = runtimeData.staticTerrainData[roomName];
            TerrainConstructor = array.constructor;
            break;
        }
    })();

    TerrainConstructorSet || (() => {
        TerrainConstructorSet = TerrainConstructor.prototype.set;
    })();

    if (globals.Room) {
        return;
    }

    // const data = (id: any) => {
    //     if (!runtimeData.rooms[id]) {
    //         throw new Error("Could not find a room with name " + id);
    //     }
    //     return runtimeData.rooms[id];
    // };


    /**
     * Room
     * @param id
     * @returns {number}
     * @constructor
     */
    const Room = register.wrapFn(function (this: any, id: any) {
        // const objectData = data(id);

        let gameInfo;
        let gameId = id;
        const match = id.match(/survival_(.*)$/);
        if (match) {
            gameId = match[1];
        }
        if (runtimeData.games && gameId in runtimeData.games) {
            gameInfo = runtimeData.games[gameId];
        }

        this.name = id;

        this.energyAvailable = 0;
        this.energyCapacityAvailable = 0;

        this.survivalInfo = gameInfo;

        privateStore[id] = {
            pfGrid: {},
            pfFinders: {},
            pfEndNodes: {},
            pfDijkstraFinder: new pathfinding.DijkstraFinder({ diagonalMovement: 1 }),
            pathCache: {},
            positionsSetCache: {

                cache: {},

                key(this: any, array: any) {

                    if (!_.isArray(array)) {
                        return 0;
                    }

                    const positionsArray = _.map(array, (i: any) => {
                        if (i && i.pos) {
                            return i.pos;
                        }
                        if (_.isObject(i) && !_.isUndefined(i.x) && !(i instanceof globals.RoomPosition)) {
                            return new globals.RoomPosition(i.x, i.y, id);
                        }
                        return i;
                    });

                    let key: any = _.findKey(this.cache, (objects: any) => {
                        return positionsArray.length == objects.length && _.every(positionsArray, (j) => _.any(objects, (object) => {
                            if (!_.isObject(j) || !j.isEqualTo) {
                                throw new Error('Invalid position ' + j + ', check your `opts` property');
                            }
                            return j.isEqualTo(object);
                        }));
                    });

                    if (key === undefined) {
                        key = positionsSetCacheCounter++;
                        this.cache[key] = _.clone(array);
                    }
                    else {
                        key = parseInt(key);
                    }

                    return key;
                }
            },
            lookTypeRegisters: {
                creep: register.byRoom[id].creeps,
                energy: register.byRoom[id].energy,
                resource: register.byRoom[id].energy,
                source: register.byRoom[id].sources,
                mineral: register.byRoom[id].minerals,
                deposit: register.byRoom[id].deposits,
                structure: register.byRoom[id].structures,
                flag: register.byRoom[id].flags,
                constructionSite: register.byRoom[id].constructionSites,
                tombstone: register.byRoom[id].tombstones,
                ruin: register.byRoom[id].ruins,
                nuke: register.byRoom[id].nukes,
                powerCreep: register.byRoom[id].powerCreeps
            },
            lookTypeSpatialRegisters: {
                creep: register.byRoom[id].spatial.creeps,
                energy: register.byRoom[id].spatial.energy,
                resource: register.byRoom[id].spatial.energy,
                source: register.byRoom[id].spatial.sources,
                mineral: register.byRoom[id].spatial.minerals,
                deposit: register.byRoom[id].spatial.deposits,
                structure: register.byRoom[id].spatial.structures,
                flag: register.byRoom[id].spatial.flags,
                constructionSite: register.byRoom[id].spatial.constructionSites,
                tombstone: register.byRoom[id].spatial.tombstones,
                ruin: register.byRoom[id].spatial.ruins,
                nuke: register.byRoom[id].spatial.nukes,
                powerCreep: register.byRoom[id].spatial.powerCreeps
            }
        };

        this.visual = new globals.RoomVisual(id);
    });

    Room.serializePath = register.wrapFn((path: any) => {
        return serializePath(path);
    });

    Room.deserializePath = register.wrapFn((str: any) => {
        return deserializePath(str);
    });

    Room.prototype.toString = register.wrapFn(function (this: any) {
        return `[room ${this.name}]`;
    });

    Room.prototype.toJSON = register.wrapFn(function (this: any) {
        const result: Record<string, any> = {};
        for (const i in this) {
            if (i[0] == '_' || _.contains(['toJSON', 'toString', 'controller', 'storage', 'terminal'], i)) {
                continue;
            }
            result[i] = this[i];
        }
        return result;
    });

    Object.defineProperty(Room.prototype, 'memory', {
        get: function () {
            if (_.isUndefined(globals.Memory.rooms) || globals.Memory.rooms === 'undefined') {
                globals.Memory.rooms = {};
            }
            if (!_.isObject(globals.Memory.rooms)) {
                return undefined;
            }
            return globals.Memory.rooms[this.name] = globals.Memory.rooms[this.name] || {};
        },

        set: function (value) {
            if (_.isUndefined(globals.Memory.rooms) || globals.Memory.rooms === 'undefined') {
                globals.Memory.rooms = {};
            }
            if (!_.isObject(globals.Memory.rooms)) {
                throw new Error('Could not set room memory');
            }
            globals.Memory.rooms[this.name] = value;
        }
    });

    Room.prototype.getEventLog = register.wrapFn(function (this: any, raw: any) {
        if (raw) {
            return runtimeData.roomEventLog[this.name] || '[]';
        }
        let { roomEventLogCache } = register;
        if (!roomEventLogCache[this.name]) {
            roomEventLogCache[this.name] = JSON.parse(runtimeData.roomEventLog[this.name] || '[]');
        }
        return roomEventLogCache[this.name];
    });

    Room.prototype.find = register.wrapFn(function (this: any, type: any, opts: any) {
        let result = [];
        opts = opts || {};
        if (register.findCache[type] && register.findCache[type][this.name]) {
            result = register.findCache[type][this.name];
        }
        else {
            switch (type) {
                case FindCode.FIND_EXIT:
                    register.findCache[type] = register.findCache[type] || {};
                    register.findCache[type][this.name] = this.find(FindCode.FIND_EXIT_TOP, opts)
                        .concat(this.find(FindCode.FIND_EXIT_BOTTOM, opts))
                        .concat(this.find(FindCode.FIND_EXIT_RIGHT, opts))
                        .concat(this.find(FindCode.FIND_EXIT_LEFT, opts));
                    return _.clone(register.findCache[type][this.name]);
                case FindCode.FIND_EXIT_TOP:
                case FindCode.FIND_EXIT_RIGHT:
                case FindCode.FIND_EXIT_BOTTOM:
                case FindCode.FIND_EXIT_LEFT:

                    register.findCache[type] = register.findCache[type] || {};

                    const exits = [];
                    for (let i = 0; i < 50; i++) {
                        let x = 0, y = 0;
                        if (type == FindCode.FIND_EXIT_LEFT || type == FindCode.FIND_EXIT_RIGHT) {
                            y = i;
                        }
                        else {
                            x = i;
                        }
                        if (type == FindCode.FIND_EXIT_RIGHT) {
                            x = 49;
                        }
                        if (type == FindCode.FIND_EXIT_BOTTOM) {
                            y = 49;
                        }
                        exits.push(!(runtimeData.staticTerrainData[this.name][y * 50 + x] & ScreepsConstants.TERRAIN_MASK_WALL));
                    }

                    result = _.reduce(exits, (accum, i, key) => {
                        if (i) {
                            if (type == FindCode.FIND_EXIT_TOP) {
                                //@ts-ignore
                                accum.push(this.getPositionAt(key, 0));
                            }
                            if (type == FindCode.FIND_EXIT_BOTTOM) {
                                //@ts-ignore
                                accum.push(this.getPositionAt(key, 49));
                            }
                            if (type == FindCode.FIND_EXIT_LEFT) {
                                //@ts-ignore
                                accum.push(this.getPositionAt(0, key));
                            }
                            if (type == FindCode.FIND_EXIT_RIGHT) {
                                //@ts-ignore
                                accum.push(this.getPositionAt(49, key));
                            }
                        }
                        return accum;
                    }, []);

                    register.findCache[type][this.name] = result;

                    break;
            }
        }

        if (opts.filter) {
            result = _.filter(result, opts.filter);
        }
        else {
            result = _.clone(result);
        }

        return result;

    });

    function _lookSpatialRegister(id: any, typeName: any, x: any, y: any, outArray?: any, withCoords?: any) {

        let item: any;

        if (typeName == 'terrain') {
            let result = 'plain';
            const terrainCode = runtimeData.staticTerrainData[id][y * 50 + x];
            if (terrainCode & ScreepsConstants.TERRAIN_MASK_SWAMP) {
                result = 'swamp';
            }
            if (terrainCode & ScreepsConstants.TERRAIN_MASK_WALL) {
                result = 'wall';
            }
            if (outArray) {
                item = { type: 'terrain', terrain: result };
                if (withCoords) {
                    item.x = x;
                    item.y = y;
                }
                outArray.push(item);
                return;
            }
            return [result];
        }

        if (x < 0 || y < 0 || x > 49 || y > 49) {
            throw new Error('look coords are out of bounds');
        }

        const typeResult = privateStore[id].lookTypeSpatialRegisters[typeName][x * 50 + y];
        if (typeResult) {
            if (outArray) {
                typeResult.forEach((i: any) => {
                    item = { type: typeName };
                    item[typeName] = i;
                    if (withCoords) {
                        item.x = x;
                        item.y = y;
                    }
                    outArray.push(item);
                });
                return;
            }
            return _.clone(typeResult);
        }
        return [];
    }

    function _lookAreaMixedRegister(
        id: any,
        type: any,
        top: any,
        left: any,
        bottom: any,
        right: any,
        withType: any,
        asArray: any,
        result: any) {
        const typeRegister = privateStore[id].lookTypeRegisters[type], keys = typeRegister && Object.keys(typeRegister);

        if (type != 'terrain' && keys.length < (bottom - top + 1) * (right - left + 1)) {

            // by objects

            const checkInside = (i: any) => {
                return (!i.pos && i.roomName == id || i.pos && i.pos.roomName == id) &&
                    i.pos && i.pos.y >= top && i.pos.y <= bottom && i.pos.x >= left && i.pos.x <= right ||
                    !i.pos && i.y >= top && i.y <= bottom && i.x >= left && i.x <= right;
            };
            let item: any;
            keys.forEach((key: any) => {
                const obj = typeRegister[key];
                if (checkInside(obj)) {
                    if (withType) {
                        item = { type: type };
                        item[type] = obj;
                        if (asArray) {
                            result.push({ x: obj.x || obj.pos.x, y: obj.y || obj.pos.y, type, [type]: obj });
                        }
                        else {
                            result[obj.y || obj.pos.y][obj.x || obj.pos.x].push(item);
                        }
                    }
                    else {
                        if (asArray) {
                            result.push({ x: obj.x || obj.pos.x, y: obj.y || obj.pos.y, [type]: obj });
                        }
                        else {
                            result[obj.y || obj.pos.y][obj.x || obj.pos.x] = result[obj.y || obj.pos.y][obj.x || obj.pos.x] || [];
                            result[obj.y || obj.pos.y][obj.x || obj.pos.x].push(obj);
                        }
                    }
                }
            });
        }
        else {

            // spatial

            for (let y = top; y <= bottom; y++) {
                for (let x = left; x <= right; x++) {
                    if (asArray) {
                        _lookSpatialRegister(id, type, x, y, result, true);
                    }
                    else {
                        if (result[y][x]) {
                            _lookSpatialRegister(id, type, x, y, result[y][x]);
                        }
                        else {
                            result[y][x] = _lookSpatialRegister(id, type, x, y, undefined);
                        }
                    }
                }
            }
        }
    }

    Room.prototype.lookAt = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {
        const [x, y] = fetchXYArguments(firstArg, secondArg, globals),
            result: any[] = [];

        _lookSpatialRegister(this.name, LookEnum.LOOK_CREEPS, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_ENERGY, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_RESOURCES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_SOURCES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_MINERALS, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_DEPOSITS, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_STRUCTURES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_FLAGS, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_CONSTRUCTION_SITES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_TERRAIN, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_NUKES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_TOMBSTONES, x, y, result);
        _lookSpatialRegister(this.name, LookEnum.LOOK_POWER_CREEPS, x, y, result);

        return result;
    });

    Room.prototype.lookForAt = register.wrapFn(function (this: any, type: any, firstArg: any, secondArg: any) {
        const [x, y] = fetchXYArguments(firstArg, secondArg, globals);

        if (type != 'terrain' && !(type in privateStore[this.name].lookTypeSpatialRegisters)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        return _lookSpatialRegister(this.name, type, x, y);
    });

    Room.prototype.lookAtArea = register.wrapFn(function (
        this: any, top: any, left: any, bottom: any, right: any, asArray: any) {

        const result: any = asArray ? [] : {};

        if (!asArray) {
            for (let y = top; y <= bottom; y++) {
                result[y] = {};
                for (let x = left; x <= right; x++) {
                    result[y][x] = [];
                }
            }
        }

        _lookAreaMixedRegister(this.name, LookEnum.LOOK_CREEPS, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_ENERGY, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_RESOURCES, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_SOURCES, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_MINERALS, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_DEPOSITS, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_STRUCTURES, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_FLAGS, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_CONSTRUCTION_SITES, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_TERRAIN, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_NUKES, top, left, bottom, right, true, asArray, result);
        _lookAreaMixedRegister(this.name, LookEnum.LOOK_TOMBSTONES, top, left, bottom, right, true, asArray, result);

        return result;
    });

    Room.prototype.lookForAtArea = register.wrapFn(function (
        this: any, type: any, top: any, left: any, bottom: any, right: any, asArray: any) {

        const result: any = asArray ? [] : {};

        if (!asArray) {
            for (let y = top; y <= bottom; y++) {
                result[y] = {};
            }
        }

        _lookAreaMixedRegister(this.name, type, top, left, bottom, right, false, asArray, result);

        return result;
    });


    Room.prototype.findPath = register.wrapFn(function (this: any, fromPos: any, toPos: any, opts: any) {
        if (fromPos.roomName != this.name) {
            return opts.serialize ? '' : [];
        }

        if (register._useNewPathFinder) {
            return _findPath2(this.name, fromPos, toPos, opts);
        }

        const fromX = fromPos.x;
        const fromY = fromPos.y;
        let path;
        let cacheKeySuffix = '';

        opts = _.clone(opts || {});

        if (opts.ignoreCreeps) {
            cacheKeySuffix += '_ignoreCreeps'
        }
        if (opts.ignoreDestructibleStructures) {
            cacheKeySuffix += '_ignoreDestructibleStructures'
        }
        if (opts.avoid) {
            cacheKeySuffix += '_avoid' + privateStore[this.name].positionsSetCache.key(opts.avoid);
        }
        if (opts.ignore) {
            cacheKeySuffix += '_ignore' + privateStore[this.name].positionsSetCache.key(opts.ignore);
        }

        if (_.isNumber(toPos)) {
            if (!privateStore[this.name].pfEndNodes[toPos]) {
                return opts.serialize ? '' : [];
            }

            var grid = getPathfindingGrid(this.name, opts, toPos);

            path = privateStore[this.name].pfDijkstraFinder.findPath(fromX, fromY, -999, -999, grid);
        }
        else {
            if (toPos.roomName != this.name) {
                return opts.serialize ? '' : [];
            }

            const toX = toPos.x;
            const toY = toPos.y;
            var cacheKey = `${fromX},${fromY},${toX},${toY}${cacheKeySuffix}`;

            if (privateStore[this.name].pathCache[cacheKey]) {
                return opts.serialize ? serializePath(privateStore[this.name].pathCache[cacheKey]) : _.cloneDeep(privateStore[this.name].pathCache[cacheKey]);
            }

            if (fromX == toX && fromY == toY) {
                return opts.serialize ? '' : [];
            }
            if (fromX < 0 || fromY < 0 || toX < 0 || toY < 0 ||
                fromX >= 50 || fromY >= 50 || toX >= 50 || toY >= 50) {
                return opts.serialize ? '' : [];
            }

            if (abs(fromX - toX) < 2 && abs(fromY - toY) < 2) {
                const result = [{
                    x: toX,
                    y: toY,
                    dx: toX - fromX,
                    dy: toY - fromY,
                    direction: getDirection(toX - fromX, toY - fromY)
                }];
                return opts.serialize ? serializePath(result) : result;
            }

            const grid = getPathfindingGrid(this.name, opts), finder = getPathfinder(this.name, opts);

            grid.setWalkableAt(toX, toY, true);
            path = finder.findPath(fromX, fromY, toX, toY, grid);
        }

        path.splice(0, 1);

        let curX = fromX, curY = fromY;

        const resultPath = _.map(path, (step: any) => {
            const result = {
                x: step[0],
                y: step[1],
                dx: step[0] - curX,
                dy: step[1] - curY,
                direction: getDirection(step[0] - curX, step[1] - curY)
            };

            curX = result.x;
            curY = result.y;
            return result;
        });

        if (resultPath.length > 0) {
            const lastStep = resultPath[resultPath.length - 1], cacheKey = `${fromX},${fromY},${lastStep.x},${lastStep.y}${cacheKeySuffix}`;
            privateStore[this.name].pathCache[cacheKey] = _.cloneDeep(resultPath);
        }

        if (opts.serialize) {
            return serializePath(resultPath);
        }

        return resultPath;
    });

    Room.prototype.getPositionAt = register.wrapFn(function (this: any, x: any, y: any) {
        if (x < 0 || x > 49 || y < 0 || y > 49) {
            return null;
        }
        return new globals.RoomPosition(x, y, this.name);
    });

    Room.prototype.createFlag = register.wrapFn(function (
        this: any, firstArg: any, secondArg: any, name: any, color: any, secondaryColor: any) {
        const [x, y] = fetchXYArguments(firstArg, secondArg, globals);

        if (_.isUndefined(x) || _.isUndefined(y) || x < 0 || x > 49 || y < 0 || y > 49) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (_.size(globals.Game.flags) >= ScreepsConstants.FLAGS_LIMIT) {
            return ErrorCode.ERR_FULL;
        }
        if (_.isObject(firstArg)) {
            secondaryColor = color;
            color = name;
            name = secondArg;
        }
        if (!color) {
            color = ColorCode.COLOR_WHITE;
        }
        if (!secondaryColor) {
            secondaryColor = color;
        }
        if (!_.contains(ListItems.COLORS_ALL, color)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!_.contains(ListItems.COLORS_ALL, secondaryColor)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!name) {
            let cnt = 1;
            do {
                name = 'Flag' + cnt;
                cnt++;
            }
            while (_.any(register.flags, _.matches({ name })) || createdFlagNames.indexOf(name) != -1);
        }
        if (_.any(register.flags, _.matches({ name })) || createdFlagNames.indexOf(name) != -1) {
            return ErrorCode.ERR_NAME_EXISTS;
        }
        if (name.length > 60) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        createdFlagNames.push(name);

        const roomName = "" + this.name;
        globals.Game.flags[name] = new globals.Flag(name, color, secondaryColor, roomName, x, y);

        intents.pushByName('room', 'createFlag', { roomName, x, y, name, color, secondaryColor });

        return name;
    });

    Room.prototype.createConstructionSite = register.wrapFn(function (
        this: any, firstArg: any, secondArg: any, structureType: any, name: any) {
        const [x, y] = fetchXYArguments(firstArg, secondArg, globals);

        if (_.isUndefined(x) || _.isUndefined(y) || x < 0 || x > 49 || y < 0 || y > 49) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (_.isString(secondArg) && _.isUndefined(structureType)) {
            structureType = secondArg;
        }
        if (!ScreepsConstants.CONSTRUCTION_COST[structureType]) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (structureType == 'spawn' && typeof name == 'string') {
            if (createdSpawnNames.indexOf(name) != -1) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (_.any(register.spawns, _.matches({ name })) ||
                _.any(register.constructionSites, _.matches({ structureType: 'spawn', name }))) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
        }
        if (this.controller && this.controller.level > 0 && !this.controller.my) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        const roomName = "" + this.name;
        if (!checkControllerAvailability(structureType, register.objectsByRoom[this.name], this.controller)) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!checkConstructionSite(register.objectsByRoom[roomName], structureType, x, y) ||
            !checkConstructionSite(runtimeData.staticTerrainData[roomName], structureType, x, y)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        const _a = _.filter(runtimeData.userObjects, _.matches({ type: 'constructionSite' }));

        if (_.size(_a) +
            createdConstructionSites >= ScreepsConstants.MAX_CONSTRUCTION_SITES) {
            return ErrorCode.ERR_FULL;
        }

        const intent: Record<string, any> = { roomName, x, y, structureType };

        if (structureType == 'spawn') {
            if (typeof name !== 'string') {
                let cnt = 1;
                do {
                    name = "Spawn" + cnt;
                    cnt++;
                }
                while (_.any(register.spawns, _.matches({ name })) ||
                _.any(register.constructionSites, _.matches({ structureType: 'spawn', name })) ||
                    createdSpawnNames.indexOf(name) != -1);
            }
            createdSpawnNames.push(name);
            intent.name = name;
        }

        createdConstructionSites++;

        intents.pushByName('room', 'createConstructionSite', intent);

        return ErrorCode.OK;
    });

    Room.prototype.getEndNodes = register.wrapFn(function (this: any, type: any, opts: any) {
        let key;

        opts = opts || {};

        if (_.isUndefined(type)) {
            throw new Error('Find type cannot be undefined');
        }

        if (!opts.filter && _.isNumber(type)) {
            key = type;
        }
        else {
            if (_.isNumber(type)) {
                type = this.find(type, opts);
            }

            key = privateStore[this.name].positionsSetCache.key(type);

            privateStore[this.name].pfEndNodes[key] = privateStore[this.name].positionsSetCache.cache[key];
        }

        if (!privateStore[this.name].pfEndNodes[key]) {
            privateStore[this.name].pfEndNodes[key] = _.clone(type);
            if (_.isNumber(type)) {
                privateStore[this.name].pfEndNodes[key] = this.find(type, opts);
            }
        }
        return { key, objects: privateStore[this.name].pfEndNodes[key] };
    });

    Room.prototype.findExitTo = register.wrapFn(function (this: any, room: any) {
        return register.map.findExit(this.name, room);
    });

    Room.prototype.getTerrain = register.wrapFn(function (this: any) {
        return new Room.Terrain(this.name);
    });

    Object.defineProperty(globals, 'Room', { enumerable: true, value: Room });

    /**
     * RoomVisual
     * @param id
     * @returns {object}
     * @constructor
     */
    const RoomVisual = register.wrapFn(function (this: any, roomName: any) {
        this.roomName = roomName;
    });

    RoomVisual.prototype.circle = register.wrapFn(function (this: any, x: any, y: any, style: any) {
        if (typeof x == 'object') {
            style = y;
            y = x.y;
            x = x.x;
        }
        globals.console.addVisual(this.roomName, { t: 'c', x, y, s: style });
        return this;
    });

    RoomVisual.prototype.line = register.wrapFn(function (this: any, x1: any, y1: any, x2: any, y2: any, style: any) {
        if (typeof x1 == 'object' && typeof y1 == 'object') {
            style = x2;
            x2 = y1.x;
            y2 = y1.y;
            y1 = x1.y;
            x1 = x1.x;
        }
        globals.console.addVisual(this.roomName, { t: 'l', x1, y1, x2, y2, s: style });
        return this;
    });

    RoomVisual.prototype.rect = register.wrapFn(function (this: any, x: any, y: any, w: any, h: any, style: any) {
        if (typeof x == 'object') {
            style = h;
            h = w;
            w = y;
            y = x.y;
            x = x.x;
        }
        globals.console.addVisual(this.roomName, { t: 'r', x, y, w, h, s: style });
        return this;
    });

    RoomVisual.prototype.poly = register.wrapFn(function (this: any, points: any, style: any) {
        if (_.isArray(points) && _.some(points)) {
            points = points.map((i: any) => i.x !== undefined ? [i.x, i.y] : i);
            globals.console.addVisual(this.roomName, { t: 'p', points, s: style });
        }
        return this;
    });

    RoomVisual.prototype.text = register.wrapFn(function (this: any, text: any, x: any, y: any, style: any) {
        if (typeof x == 'object') {
            style = y;
            y = x.y;
            x = x.x;
        }
        globals.console.addVisual(this.roomName, { t: 't', text, x, y, s: style });
        return this;
    });

    RoomVisual.prototype.getSize = register.wrapFn(function (this: any) {
        return globals.console.getVisualSize(this.roomName);
    });

    RoomVisual.prototype.clear = register.wrapFn(function (this: any) {
        globals.console.clearVisual(this.roomName);
        return this;
    });

    Object.defineProperty(globals, 'RoomVisual', { enumerable: true, value: RoomVisual });


    Room.Terrain = register.wrapFn(function (this: any, roomName: any) {
        "use strict";
        roomName = "" + roomName;

        const array = (runtimeData.staticTerrainData || {})[roomName];
        if (!array)
            throw new Error(`Could not access room ${roomName}`);

        this.get = register.wrapFn((x: any, y: any) => {
            const value = array[y * 50 + x];
            return (value & ScreepsConstants.TERRAIN_MASK_WALL) || (value & ScreepsConstants.TERRAIN_MASK_SWAMP) || 0;
        });

        this.getRawBuffer = register.wrapFn((destinationArray: any) => {
            if (!!destinationArray) {
                TerrainConstructorSet.call(destinationArray, array);
                return destinationArray;
            }
            return new TerrainConstructor(array);
        });
    });
}

export function makePos(_register: any, _g?: any) {

    register = _register;

    if (globals.RoomPosition) {
        return;
    }

    /**
     * RoomPosition
     * @param x
     * @param y
     * @param roomName
     * @constructor
     */
    const kMaxWorldSize = 256;
    const kMaxWorldSize2 = kMaxWorldSize >> 1;
    const roomNames: any[] = [];

    roomNames[0] = 'sim';

    let RoomPosition = register.wrapFn(function RoomPosition(this: any, xx: any, yy: any, roomName: any) {
        let xy = roomName === 'sim' ? [-kMaxWorldSize2, -kMaxWorldSize2] : roomNameToXY(roomName);
        xy[0] += kMaxWorldSize2;
        xy[1] += kMaxWorldSize2;
        if (
            xy[0] < 0 || xy[0] > kMaxWorldSize || xy[0] !== xy[0] ||
            xy[1] < 0 || xy[1] > kMaxWorldSize || xy[1] !== xy[1] ||
            xx < 0 || xx > 49 || xx !== xx ||
            yy < 0 || yy > 49 || yy !== yy
        ) {
            throw new Error('Invalid arguments in RoomPosition constructor');
        }
        Object.defineProperty(this, '__packedPos', {
            enumerable: false,
            value: xy[0] << 24 | xy[1] << 16 | xx << 8 | yy,
            writable: true,
        });
    });

    Object.defineProperties(RoomPosition.prototype, {
        x: {
            enumerable: true,
            get() {
                return (this.__packedPos >> 8) & 0xff;
            },
            set(val) {
                if (val < 0 || val > 49 || val !== val) {
                    throw new Error('Invalid coordinate');
                }
                this.__packedPos = this.__packedPos & ~(0xff << 8) | val << 8;
            },
        },

        y: {
            enumerable: true,
            get() {
                return this.__packedPos & 0xff;
            },
            set(val) {
                if (val < 0 || val > 49 || val !== val) {
                    throw new Error('Invalid coordinate');
                }
                this.__packedPos = this.__packedPos & ~0xff | val;
            },
        },

        roomName: {
            enumerable: true,
            get() {
                let roomName = roomNames[this.__packedPos >>> 16];
                if (roomName === undefined) {
                    return getRoomNameFromXYFaster(
                        (this.__packedPos >>> 24) - kMaxWorldSize2,
                        (this.__packedPos >>> 16 & 0xff) - kMaxWorldSize2
                    );
                } else {
                    return roomName;
                }
            },
            set(val) {
                let xy = val === 'sim' ? [-kMaxWorldSize2, -kMaxWorldSize2] : roomNameToXY(val);
                xy[0] += kMaxWorldSize2;
                xy[1] += kMaxWorldSize2;
                if (
                    xy[0] < 0 || xy[0] > kMaxWorldSize || xy[0] !== xy[0] ||
                    xy[1] < 0 || xy[1] > kMaxWorldSize || xy[1] !== xy[1]
                ) {
                    throw new Error('Invalid roomName');
                }
                this.__packedPos = this.__packedPos & ~(0xffff << 16) | xy[0] << 24 | xy[1] << 16;
            },
        },
    });

    RoomPosition.prototype.toJSON = register.wrapFn(function (this: any) {
        return Object.assign({
            x: this.x,
            y: this.y,
            roomName: this.roomName,
        }, this);
    });

    RoomPosition.prototype.toString = register.wrapFn(function (this: any) {
        return `[room ${this.roomName} pos ${this.x},${this.y}]`;
    });

    RoomPosition.prototype.inRangeTo = register.wrapFn(function (
        this: any, firstArg: any, secondArg: any, thirdArg: any) {
        let x = firstArg, y = secondArg, range = thirdArg, roomName = this.roomName;
        if (_.isUndefined(thirdArg)) {
            let pos = firstArg;
            if (pos.pos) {
                pos = pos.pos;
            }
            x = pos.x;
            y = pos.y;
            roomName = pos.roomName;
            range = secondArg;
        }

        return abs(x - this.x) <= range && abs(y - this.y) <= range && roomName == this.roomName;
    });

    RoomPosition.prototype.isNearTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {
        const [x, y, roomName] = fetchXYArguments(firstArg, secondArg, globals);
        return abs(x - this.x) <= 1 && abs(y - this.y) <= 1 && (!roomName || roomName == this.roomName);
    });

    RoomPosition.prototype.getDirectionTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {
        const [x, y, roomName] = fetchXYArguments(firstArg, secondArg, globals);

        if (!roomName || roomName == this.roomName) {
            return getDirection(x - this.x, y - this.y);
        }

        const [thisRoomX, thisRoomY] = roomNameToXY(this.roomName);
        const [thatRoomX, thatRoomY] = roomNameToXY(roomName);

        return getDirection(thatRoomX * 50 + x - thisRoomX * 50 - this.x, thatRoomY * 50 + y - thisRoomY * 50 - this.y);
    });

    RoomPosition.prototype.findPathTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any, opts: any) {
        let [x, y, roomName] = fetchXYArguments(firstArg, secondArg, globals);
        const room = register.rooms[this.roomName];

        if (_.isObject(secondArg)) {
            opts = _.clone(secondArg);
        }
        opts = opts || {};

        roomName = roomName || this.roomName;

        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }

        if (roomName == this.roomName || register._useNewPathFinder) {
            return room.findPath(this, new globals.RoomPosition(x, y, roomName), opts);
        }
        else {
            const exitDir = room.findExitTo(roomName);
            if (exitDir < 0) {
                return [];
            }
            const exit = this.findClosestByPath(exitDir, opts);
            if (!exit) {
                return [];
            }
            return room.findPath(this, exit, opts);
        }
    });

    RoomPosition.prototype.findClosestByPath = register.wrapFn(function (this: any, type: any, opts: any) {
        opts = _.clone(opts || {});

        const room = register.rooms[this.roomName];

        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }

        if (_.isUndefined(type)) {
            return null;
        }

        if (register._useNewPathFinder) {
            return _findClosestByPath2(this, type, opts);
        }

        opts.serialize = false;

        let result = null;
        let isNear: any;
        const endNodes = room.getEndNodes(type, opts);

        if (!opts.algorithm) {

            let minH: any,
                sumH = 0;

            endNodes.objects.forEach((i: any) => {
                let x = i.x;
                let y = i.y;
                // let roomName = i.roomName;

                if (i.pos) {
                    x = i.pos.x;
                    y = i.pos.y;
                    // roomName = i.pos.roomName;
                }
                const h = max(abs(this.x - x), abs(this.y - y));
                if (_.isUndefined(minH) || minH > h) {
                    minH = h;
                }
                sumH += h;
            });

            opts.algorithm = sumH > minH * 10 ? 'dijkstra' : 'astar';
        }

        if (opts.algorithm == 'dijkstra') {

            isNear = 1;

            endNodes.objects.forEach((i: any) => {
                const distance = this.isEqualTo(i) ? -1 :
                    this.isNearTo(i) ? 0 : 1;
                if (distance < isNear) {
                    result = i;
                    isNear = distance;
                }
            });

            if (isNear == 1) {
                const path = room.findPath(this, endNodes.key, opts);
                if (path.length > 0) {
                    const lastStep = path[path.length - 1], lastStepPos = room.getPositionAt(lastStep.x, lastStep.y);
                    result = _.find(endNodes.objects, (i) => lastStepPos.isEqualTo(i));
                }
            }
        }

        if (opts.algorithm == 'astar') {

            endNodes.objects.forEach((i: any) => {
                let path;

                const distance = this.isEqualTo(i) ? -1 :
                    this.isNearTo(i) ? 0 :
                        (path = this.findPathTo(i, opts)) && path.length > 0 &&
                            room.getPositionAt(path[path.length - 1].x, path[path.length - 1].y).isNearTo(i) ?
                            path.length : undefined;

                if ((_.isUndefined(isNear) || distance <= isNear) && !_.isUndefined(distance)) {
                    isNear = distance;
                    result = i;
                }
            });
        }

        return result;
    });

    RoomPosition.prototype.findInRange = register.wrapFn(function (this: any, type: any, range: any, opts: any) {
        const room = register.rooms[this.roomName];

        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }

        opts = _.clone(opts || {});

        let objects = [];
        const result: any[] = [];

        if (_.isNumber(type)) {
            objects = room.find(type, opts);
        }
        if (_.isArray(type)) {
            objects = opts.filter ? _.filter(type, opts.filter) : type;
        }

        objects.forEach((i: any) => {
            if (this.inRangeTo(i, range)) {
                result.push(i);
            }
        });

        return result;
    });

    RoomPosition.prototype.findClosestByRange = register.wrapFn(function (this: any, type: any, opts: any) {
        const room = register.rooms[this.roomName];

        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }

        opts = _.clone(opts || {});

        let objects = [];
        // const result = [];

        if (_.isNumber(type)) {
            objects = room.find(type, opts);
        }
        if (_.isArray(type)) {
            objects = opts.filter ? _.filter(type, opts.filter) : type;
        }

        let closest = null, minRange = Infinity;

        objects.forEach((i: any) => {
            const range = this.getRangeTo(i);
            if (range < minRange) {
                minRange = range;
                closest = i;
            }
        });

        return closest;
    });

    RoomPosition.prototype.isEqualTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {
        if (firstArg.__packedPos !== undefined) {
            return firstArg.__packedPos === this.__packedPos;
        }
        const [x, y, roomName] = fetchXYArguments(firstArg, secondArg, globals);
        return x == this.x && y == this.y && (!roomName || roomName == this.roomName);
    });

    RoomPosition.prototype.getRangeTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any) {
        const [x, y, roomName] = fetchXYArguments(firstArg, secondArg, globals);
        if (roomName && roomName != this.roomName) {
            return Infinity;
        }
        return max(abs(this.x - x), abs(this.y - y));
    });

    RoomPosition.prototype.look = register.wrapFn(function (this: any) {
        const room = register.rooms[this.roomName];
        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }
        return room.lookAt(this);
    });

    RoomPosition.prototype.lookFor = register.wrapFn(function (this: any, type: any) {
        if (type == 'terrain') {
            const terrainCode = runtimeData.staticTerrainData[this.roomName][this.y * 50 + this.x];
            if (terrainCode & ScreepsConstants.TERRAIN_MASK_WALL) {
                return ['wall'];
            }
            else if (terrainCode & ScreepsConstants.TERRAIN_MASK_SWAMP) {
                return ['swamp'];
            }
            else {
                return ['plain'];
            }
        }
        const room = register.rooms[this.roomName];
        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }
        return room.lookForAt(type, this);
    });

    RoomPosition.prototype.createFlag = register.wrapFn(function (
        this: any, name: any, color: any, secondaryColor: any) {
        const room = register.rooms[this.roomName];
        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }
        return room.createFlag(this, name, color, secondaryColor);
    });

    RoomPosition.prototype.createConstructionSite = register.wrapFn(function (this: any, structureType: any, name: any) {
        const room = register.rooms[this.roomName];
        if (!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }
        return room.createConstructionSite(this.x, this.y, structureType, name);
    });

    Object.defineProperty(globals, 'RoomPosition', { enumerable: true, value: RoomPosition });


    /**
     * RoomObject
     * @param room
     * @param x
     * @param y
     * @constructor
     */
    const RoomObject = register.wrapFn(function (this: any, x: any, y: any, room: any, effects: any) {
        this.room = register.rooms[room];
        this.pos = new globals.RoomPosition(x, y, room);
        if (effects) {
            this.effects = effects.map((i: any) => ({
                power: i.power,
                effect: i.effect,
                level: i.level,
                ticksRemaining: i.endTime - runtimeData.time
            })).filter((i: any) => i.ticksRemaining > 0);
        }
    });

    Object.defineProperty(globals, 'RoomObject', { enumerable: true, value: RoomObject });
}
