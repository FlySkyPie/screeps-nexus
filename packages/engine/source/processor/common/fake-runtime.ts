import _ from 'lodash';

import { pathFinder } from '@screeps/driver/src';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';
import { LookEnum } from '@screeps/common/src/constants/look-enum';

import * as utils from '../../utils';

let terrains: Record<string, any> = {};

class RoomPosition {
    public x: any;
    public y: any;
    public roomName: any;

    public static sUnpackLocal?: any;

    constructor(x: any, y: any, roomName: any) {
        x = +x;
        y = +y;

        if (_.isNaN(x) || _.isNaN(y) || !_.isString(roomName)) {
            throw new Error('invalid arguments in RoomPosition constructor');
        }

        this.x = x;
        this.y = y;
        this.roomName = roomName;
    }

    isEqualTo(p: any) {
        return p.x == this.x && p.y == this.y && p.roomName == this.roomName;
    }

    getRangeTo(p: any) {
        return p.roomName == this.roomName ? utils.dist(p, this) : Infinity;
    }

    getDirectionTo(p: any) {
        if (p.roomName == this.roomName) {
            return utils.getDirection(p.x - this.x, p.y - this.y);
        }

        const [thisRoomX, thisRoomY] = utils.roomNameToXY(this.roomName);
        const [thatRoomX, thatRoomY] = utils.roomNameToXY(p.roomName);

        return utils.getDirection(thatRoomX * 50 + p.x - thisRoomX * 50 - this.x, thatRoomY * 50 + p.y - thisRoomY * 50 - this.y);
    }

    lookFor(type: any) {
        if (type != LookEnum.LOOK_TERRAIN) {
            return null;
        }

        if (!terrains[this.roomName]) {
            // disallow movement via unknown terrain
            return 'wall';
        }

        const terrainStrings = ['plain', 'wall', 'swamp', 'wall'];
        return [terrainStrings[terrains[this.roomName][50 * this.y + this.x]]];
    }

    sPackLocal() {
        return packLocal(this.x, this.y);
    }
}

const packLocal = (x: any, y: any) => {
    let uint32 = 0;
    uint32 <<= 6; uint32 |= x;
    uint32 <<= 6; uint32 |= y;

    return String.fromCharCode(32 + uint32);
};

RoomPosition.sUnpackLocal = (packed: any, roomName: any) => {
    let uint32 = packed.codePointAt(0);
    if (uint32 < 32) {
        throw new Error(`Invalid uint value ${uint32}`)
    }
    uint32 -= 32;

    const y = uint32 & 0x3f; uint32 >>>= 6;
    const x = uint32 & 0x3f; uint32 >>>= 6;

    return new RoomPosition(x, y, roomName);
};

class CostMatrix {
    public _bits: any;

    constructor() {
        this._bits = new Uint8Array(2500);
    }

    set(xx: any, yy: any, val: any) {
        xx = xx | 0;
        yy = yy | 0;
        this._bits[xx * 50 + yy] = Math.min(Math.max(0, val), 255);
    }

    get(xx: any, yy: any) {
        xx = xx | 0;
        yy = yy | 0;
        return this._bits[xx * 50 + yy];
    }

    clone() {
        const newMatrix = new CostMatrix;
        newMatrix._bits = new Uint8Array(this._bits);
        return newMatrix;
    }
}

function packPath(roomPositions: any) {
    return _.reduce(roomPositions, (path, position: any) => `${path}${position.sPackLocal()}`, '');
}
const defaultCostMatrix = function defaultCostMatrix(roomId: any, opts: any, creep: any, roomObjects: any) {
    if (creep.room != roomId) {
        // disallow movement via unknown terrain
        return false;
    }

    const costs = new CostMatrix();

    let obstacleTypes = _.clone(ScreepsConstants.OBSTACLE_OBJECT_TYPES);
    obstacleTypes.push(StructureEnum.STRUCTURE_PORTAL);

    if (opts.ignoreDestructibleStructures) {
        obstacleTypes = _.without(obstacleTypes, 'constructedWall', 'rampart', 'spawn', 'extension', 'link', 'storage', 'observer', 'tower', 'powerBank', 'powerSpawn', 'lab', 'terminal');
    }
    if (opts.ignoreCreeps) {
        obstacleTypes = _.without(obstacleTypes, 'creep');
    }

    _.forEach(roomObjects, object => {
        if (
            _.contains(obstacleTypes, object.type) ||
            (!opts.ignoreDestructibleStructures && object.type == 'rampart' && !object.isPublic && object.user != creep.user) ||
            (!opts.ignoreDestructibleStructures && object.type == 'constructionSite' && object.user == creep.user && _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, object.structureType))
        ) {
            costs.set(object.x, object.y, Infinity);
        }

        if (object.type == 'swamp' && costs.get(object.x, object.y) == 0) {
            costs.set(object.x, object.y, opts.ignoreRoads ? 5 : 10);
        }

        if (!opts.ignoreRoads && object.type == 'road' && costs.get(object.x, object.y) < Infinity) {
            costs.set(object.x, object.y, 1);
        }
    });

    return costs;
};

const findPath = function findPath(source: any, target: any, opts: any, scope: any) {
    const { roomTerrain, roomObjects } = scope;
    terrains = { [source.room]: roomTerrain };

    const roomCallback = (roomName: any) => {
        let costMatrix: any = defaultCostMatrix(roomName, opts, source, roomObjects);
        if (typeof opts.costCallback == 'function') {
            costMatrix = costMatrix.clone();
            const resultMatrix = opts.costCallback(roomName, costMatrix);
            if (resultMatrix instanceof CostMatrix) {
                costMatrix = resultMatrix;
            }
        }

        return costMatrix;
    };
    const searchOpts = _.clone(opts);
    searchOpts.maxRooms = 1;
    searchOpts.roomCallback = roomCallback;
    if (!searchOpts.ignoreRoads) {
        searchOpts.plainCost = 2;
        searchOpts.swampCost = 10;
    }

    const fromPos = new RoomPosition(source.x, source.y, source.room);

    const ret = pathFinder.search(
        fromPos,
        target,
        searchOpts
    );

    if (target instanceof RoomPosition && !opts.range &&
        (ret.path.length && ret.path[ret.path.length - 1].getRangeTo(target) === 1 ||
            !ret.path.length && fromPos.getRangeTo(target) === 1)) {
        ret.path.push(target);
    }

    return ret;
};


const flee = function flee(creep: any, hostiles: any, range: any, _opts: any, scope: any) {
    const danger = hostiles.map((c: any) => {
        return {
            pos: new RoomPosition(c.x, c.y, c.room),
            range: range
        }
    });

    const result = findPath(creep, danger, { flee: true }, scope);
    if (!_.some(result.path)) {
        return 0;
    }

    const fleePosition = result.path[0];
    return utils.getDirection(fleePosition.x - creep.x, fleePosition.y - creep.y);
};

const moveTo = function moveTo(creep: any, target: any, opts: any, scope: any) {
    const { bulk, gameTime } = scope;

    opts = opts || {};
    if (_.isUndefined(opts.reusePath)) {
        opts.reusePath = 5;
    }
    if (_.isUndefined(opts.range)) {
        opts.range = 0;
    }

    if (utils.dist(creep, target) <= opts.range) {
        return 0;
    }

    const targetPosition = new RoomPosition(target.x, target.y, target.room);
    if (
        !creep['memory_move'] ||
        !creep['memory_move']['dest'] ||
        !creep['memory_move']['time'] ||
        (creep['memory_move']['dest'] != targetPosition.sPackLocal()) ||
        (gameTime > (creep['memory_move']['time'] + opts.reusePath))) {

        const result = findPath(
            creep,
            { range: opts.range, pos: new RoomPosition(target.x, target.y, target.room) },
            opts,
            scope
        );
        if (!result.path) {
            return 0;
        }
        const memory_move = {
            dest: targetPosition.sPackLocal(),
            path: packPath(result.path),
            time: gameTime
        };
        bulk.update(creep, { memory_move });
    }

    const direction = nextDirectionByPath(creep, creep['memory_move']['path']);
    if (direction) {
        bulk.update(creep, { memory_move: { lastMove: gameTime } });
    }
    return direction;
};

const walkTo = (creep: any, target: any, opts: any, context: any) => {
    const { scope, intents } = context;
    const { gameTime, bulk, roomObjects } = scope;

    const direction = moveTo(creep, target, opts, scope);
    if (!direction) {
        return direction;
    }

    const offsets = utils.getOffsetsByDirection(direction);
    const creepAhead: any = _.find(roomObjects, { type: 'creep', user: creep.user, x: creep.x + offsets[0], y: creep.y + offsets[1] });
    if (creepAhead &&
        (!creepAhead['memory_move'] || (creepAhead['memory_move']['lastMove'] &&
            (creepAhead['memory_move']['lastMove'] + 1 < gameTime)))) {
        intents.set(creepAhead._id, 'move', { direction: utils.getDirection(creep.x - creepAhead.x, creep.y - creepAhead.y) });
        bulk.update(creepAhead, { memory_move: { dest: null, time: null, path: null, lastMove: gameTime } });
    }
    intents.set(creep._id, 'move', { direction });
};

const findClosestByPath = function findClosestByPath(fromPos: any, objects: any, opts: any, scope: any) {
    if (!_.some(objects)) {
        return null;
    }

    const { roomTerrain } = scope;
    terrains = { [fromPos.room]: roomTerrain };

    opts = opts || {};
    if (_.isUndefined(opts.range)) {
        opts.range = 0;
    }

    const objectHere = _.find(objects, obj => utils.dist(fromPos, obj) == 0);
    if (objectHere) {
        return objectHere;
    }

    const goals = _.map(objects, (i: any) => {
        return {
            range: 1,
            pos: new RoomPosition(i.x, i.y, i.room)
        };
    });

    const ret = findPath(
        fromPos,
        goals,
        opts,
        scope
    );
    if (!ret.path) {
        return null;
    }

    let result = null;
    let lastPos = fromPos;

    if (ret.path.length) {
        lastPos = ret.path[ret.path.length - 1];
    }

    objects.forEach((obj: any) => {
        if (utils.dist(lastPos, obj) <= 1) {
            result = obj;
        }
    });

    return result;
};

const nextDirectionByPath = (creep: any, path: any) => {
    const currentPositionIndex = path.indexOf(packLocal(creep.x, creep.y));
    if (currentPositionIndex == path.length - 1) {
        return 0;
    }

    let nextPosition = undefined;
    if (currentPositionIndex < 0) {
        const firstPosition = RoomPosition.sUnpackLocal(path[0], creep.room);
        if (utils.dist(creep, firstPosition) <= 1) {
            nextPosition = firstPosition;
        }
    } else {
        nextPosition = RoomPosition.sUnpackLocal(path[1 + currentPositionIndex], creep.room);
    }

    if (!nextPosition) {
        return 0;
    }

    return utils.getDirection(nextPosition.x - creep.x, nextPosition.y - creep.y);
};

const hasActiveBodyparts = function hasActiveBodyparts(creep: any, part: any) {
    return !!creep.body && _.some(creep.body, (p: any) => (p.hits > 0) && (p.type == part));
};

export { findPath };
export { findClosestByPath };
export { moveTo };
export { walkTo };
export { flee };
export { RoomPosition };
export { CostMatrix };
export { hasActiveBodyparts };
