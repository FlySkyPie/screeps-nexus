import _ from 'lodash';

import * as utils from './../utils';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { Resource } from '@screeps/common/src/constants/resource';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';

let runtimeData: any,
    intents: any,
    register: any,
    globals: any,
    controllersClaimedInTick: any;

function _getActiveBodyparts(body: any, type: any) {
    let count = 0;
    for (let i = body.length - 1; i >= 0; i--) {
        if (body[i].hits <= 0)
            break;
        if (body[i].type === type)
            count++;
    }
    return count;
}

function _hasActiveBodypart(body: any, type: any) {
    if (!body) {
        return true;
    }
    for (let i = body.length - 1; i >= 0; i--) {
        if (body[i].hits <= 0)
            break;
        if (body[i].type === type)
            return true;
    }
    return false;
}

function _storeGetter(o: any) {
    return new globals.Store(o);
}

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    controllersClaimedInTick = 0;

    if (globals.Creep) {
        return;
    }

    const data = (id: any) => {
        if (!id) {
            throw new Error("This creep doesn't exist yet");
        }
        if (!runtimeData.roomObjects[id]) {
            throw new Error("Could not find an object with ID " + id);
        }
        return runtimeData.roomObjects[id];
    };

    const Creep = register.wrapFn(function (this: any, id: any) {
        if (id) {
            const _data = data(id);
            globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);
            this.id = id;
        }
    });

    Creep.prototype = Object.create(globals.RoomObject.prototype);
    Creep.prototype.constructor = Creep;

    utils.defineGameObjectProperties(Creep.prototype, data, {
        name: (o: any) => o.name,
        body: (o: any) => o.body,
        my: (o: any) => o.user == runtimeData.user._id,
        owner: (o: any) => new Object({ username: runtimeData.users[o.user].username }),
        spawning: (o: any) => o.spawning,
        ticksToLive: (o: any) => o.ageTime ? o.ageTime - runtimeData.time : undefined,
        carryCapacity: (o: any) => o.storeCapacity,
        carry: _storeGetter,
        store: _storeGetter,
        fatigue: (o: any) => o.fatigue,
        hits: (o: any) => o.hits,
        hitsMax: (o: any) => o.hitsMax,
        saying: (o: any) => {
            if (!o.actionLog || !o.actionLog.say) {
                return undefined;
            }
            if (o.user == runtimeData.user._id) {
                return o.actionLog.say.message;
            }
            return o.actionLog.say.isPublic ? o.actionLog.say.message : undefined;
        }
    });

    Object.defineProperty(Creep.prototype, 'memory', {
        get: function () {
            if (this.id && !this.my) {
                return undefined;
            }
            if (_.isUndefined(globals.Memory.creeps) || globals.Memory.creeps === 'undefined') {
                globals.Memory.creeps = {};
            }
            if (!_.isObject(globals.Memory.creeps)) {
                return undefined;
            }
            return globals.Memory.creeps[this.name] = globals.Memory.creeps[this.name] || {};
        },
        set: function (value) {
            if (this.id && !this.my) {
                throw new Error('Could not set other player\'s creep memory');
            }
            if (_.isUndefined(globals.Memory.creeps) || globals.Memory.creeps === 'undefined') {
                globals.Memory.creeps = {};
            }
            if (!_.isObject(globals.Memory.creeps)) {
                throw new Error('Could not set creep memory');
            }
            globals.Memory.creeps[this.name] = value;
        }
    });

    Creep.prototype.toString = register.wrapFn(function (this: any) {
        return `[creep ${this.name}]`;
    });

    Creep.prototype.move = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        if (target && (target instanceof globals.Creep)) {
            if (!target.pos.isNearTo(this.pos)) {
                return ErrorCode.ERR_NOT_IN_RANGE;
            }

            intents.set(this.id, 'move', { id: target.id });
            return ErrorCode.OK;
        }

        if (data(this.id).fatigue > 0) {
            return ErrorCode.ERR_TIRED;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.MOVE)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        let direction = +target;
        if (!direction || direction < 1 || direction > 8) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        intents.set(this.id, 'move', { direction });
        return ErrorCode.OK;
    });

    Creep.prototype.moveTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any, opts: any) {

        let visualized = false;

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (_.isObject(firstArg)) {
            opts = _.clone(secondArg);
        }
        opts = opts || {};

        if (data(this.id).fatigue > 0 && (!opts || !opts.visualizePathStyle)) {
            return ErrorCode.ERR_TIRED;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.MOVE)) {
            return ErrorCode.ERR_NO_BODYPART;
        }

        let [x, y, roomName] = utils.fetchXYArguments(firstArg, secondArg, globals);
        roomName = roomName || this.pos.roomName;
        if (_.isUndefined(x) || _.isUndefined(y)) {
            register.assertTargetObject(firstArg);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        const targetPos = new globals.RoomPosition(x, y, roomName);

        if (_.isUndefined(opts.reusePath)) {
            opts.reusePath = 5;
        }
        if (_.isUndefined(opts.serializeMemory)) {
            opts.serializeMemory = true;
        }

        if (opts.visualizePathStyle) {
            _.defaults(opts.visualizePathStyle, { fill: 'transparent', stroke: '#fff', lineStyle: 'dashed', strokeWidth: .15, opacity: .1 });
        }

        if (x == this.pos.x && y == this.pos.y && roomName == this.pos.roomName) {
            return ErrorCode.OK;
        }

        /*if(opts.reusePath && this.room.memory && _.isObject(this.room.memory) && this.room.memory._move) {

            var key = `${this.pos.x},${this.pos.y}:${roomName},${x},${y}`;

            if(key in this.room.memory._move) {
                if(this.room.memory._move[key].t + opts.reusePath < runtimeData.time ) {
                    delete this.room.memory._move[key];
                }
                else {
                    this.move(this.room.memory._move[key].d);
                    return ErrorCode.OK;
                }
            }
        }


        if(opts.noPathFinding) {
            return ErrorCode.ERR_NOT_FOUND;
        }

        var path = this.pos.findPathTo(new globals.RoomPosition(x,y,roomName), opts);

        if(opts.reusePath && this.room.memory && _.isObject(this.room.memory)) {

            this.room.memory._move = this.room.memory._move || {};

            path.forEach((i) => {
                var ix = i.x - i.dx;
                var iy = i.y - i.dy;
                var key = `${ix},${iy}:${roomName},${x},${y}`;
                this.room.memory._move[key] = {
                    t: runtimeData.time,
                    d: i.direction
                };
            });
        }*/

        if (opts.reusePath && this.memory && _.isObject(this.memory) && this.memory._move) {

            const _move = this.memory._move;

            if (runtimeData.time > _move.time + parseInt(opts.reusePath) || _move.room != this.pos.roomName) {
                delete this.memory._move;
            }
            else if (_move.dest.room == roomName && _move.dest.x == x && _move.dest.y == y) {

                var path = _.isString(_move.path) ? utils.deserializePath(_move.path) : _move.path;

                const idx = _.findIndex(path, { x: this.pos.x, y: this.pos.y });
                if (idx != -1) {
                    const oldMove = _.cloneDeep(_move);
                    path.splice(0, idx + 1);
                    try {
                        _move.path = opts.serializeMemory ? utils.serializePath(path) : path;
                    }
                    catch (e) {
                        console.log('$ERR', this.pos, x, y, roomName, JSON.stringify(path), '-----', JSON.stringify(oldMove));
                        throw e;
                    }
                }
                if (path.length == 0) {
                    return this.pos.isNearTo(targetPos) ? ErrorCode.OK : ErrorCode.ERR_NO_PATH;
                }
                if (opts.visualizePathStyle) {
                    this.room.visual.poly(path, opts.visualizePathStyle);
                    visualized = true;
                }
                const result = this.moveByPath(path);

                if (result == ErrorCode.OK) {
                    return ErrorCode.OK;
                }
            }
        }

        if (opts.noPathFinding) {
            return ErrorCode.ERR_NOT_FOUND;
        }

        var path = this.pos.findPathTo(targetPos, opts);

        if (opts.reusePath && this.memory && _.isObject(this.memory)) {
            this.memory._move = {
                dest: { x, y, room: roomName },
                time: runtimeData.time,
                path: opts.serializeMemory ? utils.serializePath(path) : _.clone(path),
                room: this.pos.roomName
            };
        }

        if (path.length == 0) {
            return ErrorCode.ERR_NO_PATH;
        }

        if (opts.visualizePathStyle && !visualized) {
            this.room.visual.poly(path, opts.visualizePathStyle);
        }

        return this.move(path[0].direction);
    });

    Creep.prototype.moveByPath = register.wrapFn(function (this: any, path: any) {
        if (_.isArray<any>(path) && path.length > 0 && (path[0] instanceof globals.RoomPosition)) {
            let idx = _.findIndex(path, (i: any) => i.isEqualTo(this.pos));
            if (idx === -1) {
                if (!path[0].isNearTo(this.pos)) {
                    return ErrorCode.ERR_NOT_FOUND;
                }
            }
            idx++;
            if (idx >= path.length) {
                return ErrorCode.ERR_NOT_FOUND;
            }

            return this.move(this.pos.getDirectionTo(path[idx]));
        }

        if (_.isString(path)) {
            path = utils.deserializePath(path);
        }
        if (!_.isArray(path)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        const cur = _.find(path, (i: any) =>
            i.x - i.dx == this.pos.x &&
            i.y - i.dy == this.pos.y);
        if (!cur) {
            return ErrorCode.ERR_NOT_FOUND;
        }

        return this.move(cur.direction);
    });

    Creep.prototype.harvest = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.WORK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (register.sources[target.id] && (target instanceof globals.Source)) {

            if (!target.energy) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }
            if (!target.pos.isNearTo(this.pos)) {
                return ErrorCode.ERR_NOT_IN_RANGE;
            }
            if (this.room.controller && (
                this.room.controller.owner && this.room.controller.owner.username != runtimeData.user.username ||
                this.room.controller.reservation && this.room.controller.reservation.username != runtimeData.user.username)) {
                return ErrorCode.ERR_NOT_OWNER;
            }

        }
        else if (register.minerals[target.id] && (target instanceof globals.Mineral)) {

            if (!target.mineralAmount) {
                return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
            }
            if (!target.pos.isNearTo(this.pos)) {
                return ErrorCode.ERR_NOT_IN_RANGE;
            }
            const extractor: any = _.find(target.pos.lookFor('structure'), { structureType: StructureEnum.STRUCTURE_EXTRACTOR });
            if (!extractor) {
                return ErrorCode.ERR_NOT_FOUND;
            }
            if (extractor.owner && !extractor.my) {
                return ErrorCode.ERR_NOT_OWNER;
            }
            if (!extractor.isActive()) {
                return ErrorCode.ERR_RCL_NOT_ENOUGH;
            }
            if (extractor.cooldown) {
                return ErrorCode.ERR_TIRED;
            }
        }
        else if (register.deposits[target.id] && (target instanceof globals.Deposit)) {
            if (!target.pos.isNearTo(this.pos)) {
                return ErrorCode.ERR_NOT_IN_RANGE;
            }
            if (target.cooldown) {
                return ErrorCode.ERR_TIRED;
            }
        }
        else {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'harvest', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.drop = register.wrapFn(function (this: any, resourceType: any, amount: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_.contains(ListItems.RESOURCES_ALL, resourceType)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!data(this.id).store || !data(this.id).store[resourceType]) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!amount) {
            amount = data(this.id).store[resourceType];
        }
        if (data(this.id).store[resourceType] < amount) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        intents.set(this.id, 'drop', { amount, resourceType });
        return ErrorCode.OK;
    });

    Creep.prototype.transfer = register.wrapFn(function (this: any, target: any, resourceType: any, amount: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (amount < 0) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!_.contains(ListItems.RESOURCES_ALL, resourceType)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!target ||
            !target.id ||
            (!register.spawns[target.id] && !register.powerCreeps[target.id] && !register.creeps[target.id] && !register.structures[target.id]) ||
            (!data(target.id).store && (register.structures[target.id].structureType != 'controller')) ||
            ((target instanceof globals.Creep) && target.spawning) ||
            !(target instanceof globals.StructureSpawn) && !(target instanceof globals.Structure) && !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (resourceType == Resource.RESOURCE_ENERGY && register.structures[target.id] && register.structures[target.id].structureType == 'controller') {
            return this.upgradeController(target);
        }

        if (!utils.capacityForResource(data(target.id), resourceType)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (!data(this.id).store || !data(this.id).store[resourceType]) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        const storedAmount = data(target.id).storeCapacityResource ? data(target.id).store[resourceType] || 0 : utils.calcResources(target);
        const targetCapacity = utils.capacityForResource(data(target.id), resourceType);

        if (!data(target.id).store || storedAmount >= targetCapacity) {
            return ErrorCode.ERR_FULL;
        }

        if (!amount) {
            amount = Math.min(data(this.id).store[resourceType], targetCapacity - storedAmount);
        }

        if (data(this.id).store[resourceType] < amount) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        if ((amount + storedAmount) > targetCapacity) {
            return ErrorCode.ERR_FULL;
        }

        intents.set(this.id, 'transfer', { id: target.id, amount, resourceType });
        return ErrorCode.OK;
    });

    Creep.prototype.withdraw = register.wrapFn(function (this: any, target: any, resourceType: any, amount: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (amount < 0) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!_.contains(ListItems.RESOURCES_ALL, resourceType)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        if (!target || !target.id || !data(target.id).store || ((!register.structures[target.id] || !(target instanceof globals.Structure)) && !(target instanceof globals.Tombstone) && !(target instanceof globals.Ruin))) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (target.structureType == 'terminal') {
            const effect: any = _.find(target.effects, { power: PWRCode.PWR_DISRUPT_TERMINAL });
            if (effect && effect.ticksRemaining > 0) {
                return ErrorCode.ERR_INVALID_TARGET;
            }
        }

        if (target.my === false && _.any(target.pos.lookFor('structure'), (i: any) => i.structureType == StructureEnum.STRUCTURE_RAMPART && !i.my && !i.isPublic)) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (register.structures[target.id] && register.structures[target.id].structureType == StructureEnum.STRUCTURE_NUKER) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!utils.capacityForResource(data(target.id), resourceType) && !data(target.id).store[resourceType] && !(target instanceof globals.Tombstone)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        const emptySpace = data(this.id).storeCapacity - utils.calcResources(data(this.id));

        if (emptySpace <= 0) {
            return ErrorCode.ERR_FULL;
        }

        if (!amount) {
            amount = Math.min(emptySpace, data(target.id).store[resourceType]);
        }

        if (amount > emptySpace) {
            return ErrorCode.ERR_FULL;
        }

        if (!amount || (data(target.id).store[resourceType] || 0) < amount) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        intents.set(this.id, 'withdraw', { id: target.id, amount, resourceType });
        return ErrorCode.OK;
    });

    Creep.prototype.pickup = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!target || !target.id || !register.energy[target.id] || !(target instanceof globals.Energy)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (utils.calcResources(data(this.id)) >= data(this.id).storeCapacity) {
            return ErrorCode.ERR_FULL;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'pickup', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.getActiveBodyparts = register.wrapFn(function (this: any, type: any) {
        return _getActiveBodyparts(this.body, type);
    });

    Creep.prototype.attack = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.ATTACK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] && !register.structures[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep) && !(target instanceof globals.StructureSpawn) && !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        const effect = _.find(target.effects, (e: any) =>
            (e.power == PWRCode.PWR_FORTIFY ||
                e.effect == ScreepsConstants.EFFECT_INVULNERABILITY) &&
            (e.ticksRemaining > 0));
        if (effect) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'attack', { id: target.id, x: target.pos.x, y: target.pos.y });
        return ErrorCode.OK;
    });

    Creep.prototype.rangedAttack = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.RANGED_ATTACK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] && !register.structures[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep) && !(target instanceof globals.StructureSpawn) && !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.pos.inRangeTo(target, 3)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        const effect = _.find(target.effects, (e: any) =>
            (e.power == PWRCode.PWR_FORTIFY ||
                e.effect == ScreepsConstants.EFFECT_INVULNERABILITY) &&
            (e.ticksRemaining > 0));
        if (effect) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'rangedAttack', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.rangedMassAttack = register.wrapFn(function (this: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.RANGED_ATTACK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }


        intents.set(this.id, 'rangedMassAttack', {});
        return ErrorCode.OK;
    });

    Creep.prototype.heal = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.HEAL)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }


        intents.set(this.id, 'heal', { id: target.id, x: target.pos.x, y: target.pos.y });
        return ErrorCode.OK;
    });

    Creep.prototype.rangedHeal = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.HEAL)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!this.pos.inRangeTo(target, 3)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }


        intents.set(this.id, 'rangedHeal', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.repair = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.WORK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!this.carry.energy) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!target || !target.id || !register.structures[target.id] ||
            !(target instanceof globals.Structure) && !(target instanceof globals.StructureSpawn)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.pos.inRangeTo(target, 3)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }


        intents.set(this.id, 'repair', { id: target.id, x: target.pos.x, y: target.pos.y });
        return ErrorCode.OK;
    });

    Creep.prototype.build = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.WORK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!this.carry.energy) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!target || !target.id || !register.constructionSites[target.id] || !(target instanceof globals.ConstructionSite)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.pos.inRangeTo(target, 3)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        const objects = register.objectsByRoom[data(this.id).room];
        const objectsInTile: any[] = [],
            creepsInTile: any[] = [],
            myCreepsInTile: any[] = [];
        const userId = data(this.id).user;
        _.forEach(objects, obj => {
            if (obj.x == target.pos.x && obj.y == target.pos.y && _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, obj.type)) {
                if (obj.type == 'creep') {
                    creepsInTile.push(obj);
                    if (obj.user == userId) {
                        myCreepsInTile.push(obj);
                    }
                } else {
                    objectsInTile.push(obj);
                }
            }
        });
        if (_.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, target.structureType)) {
            if (_.any(objectsInTile)) {
                return ErrorCode.ERR_INVALID_TARGET;
            }
            const blockingCreeps = (this.room.controller && this.room.controller.my && this.room.controller.safeMode) ? myCreepsInTile : creepsInTile;
            if (_.any(blockingCreeps)) {
                return ErrorCode.ERR_INVALID_TARGET;
            }
        }

        intents.set(this.id, 'build', { id: target.id, x: target.pos.x, y: target.pos.y });
        return ErrorCode.OK;
    });

    Creep.prototype.suicide = register.wrapFn(function (this: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        intents.set(this.id, 'suicide', {});
        return ErrorCode.OK;
    });

    Creep.prototype.say = register.wrapFn(function (this: any, message: any, isPublic: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        intents.set(this.id, 'say', { message: "" + message, isPublic });
        return ErrorCode.OK;
    });

    Creep.prototype.claimController = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        const controllersClaimed = runtimeData.user.rooms.length + controllersClaimedInTick;
        if (controllersClaimed &&
            (!runtimeData.user.gcl || runtimeData.user.gcl < utils.calcNeededGcl(controllersClaimed + 1))) {
            return ErrorCode.ERR_GCL_NOT_ENOUGH;
        }
        if (controllersClaimed >= ScreepsConstants.GCL_NOVICE && runtimeData.rooms[this.room.name].novice > Date.now()) {
            return ErrorCode.ERR_FULL;
        }
        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.CLAIM)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (target.structureType != 'controller') {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (target.level > 0) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (target.reservation && target.reservation.username != runtimeData.user.username) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }

        controllersClaimedInTick++;

        intents.set(this.id, 'claimController', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.attackController = register.wrapFn(function (this: any, target: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.StructureController)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!_getActiveBodyparts(this.body, BodyParts.CLAIM)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (!target.owner && !target.reservation) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (data(target.id).upgradeBlocked > runtimeData.time) {
            return ErrorCode.ERR_TIRED;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (_.any(target.effects, (e: any) => e.effect == ScreepsConstants.EFFECT_INVULNERABILITY && e.ticksRemaining > 0)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'attackController', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.upgradeController = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.WORK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!this.carry.energy) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.StructureController)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (target.upgradeBlocked && target.upgradeBlocked > 0) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.inRangeTo(this.pos, 3)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (!target.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target.level || !target.owner) {
            return ErrorCode.ERR_INVALID_TARGET;
        }


        intents.set(this.id, 'upgradeController', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.reserveController = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (target.structureType != 'controller') {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (target.owner) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (target.reservation && target.reservation.username != runtimeData.user.username) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.CLAIM)) {
            return ErrorCode.ERR_NO_BODYPART;
        }


        intents.set(this.id, 'reserveController', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.notifyWhenAttacked = register.wrapFn(function (this: any, enabled: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_.isBoolean(enabled)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        if (enabled != data(this.id).notifyWhenAttacked) {

            intents.set(this.id, 'notifyWhenAttacked', { enabled });
        }

        return ErrorCode.OK;
    });

    Creep.prototype.cancelOrder = register.wrapFn(function (this: any, name: any) {

        if (intents.remove(this.id, name)) {
            return ErrorCode.OK;
        }
        return ErrorCode.ERR_NOT_FOUND;
    });

    Creep.prototype.dismantle = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!_hasActiveBodypart(this.body, BodyParts.WORK)) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (!target || !target.id || !register.structures[target.id] ||
            !(target instanceof globals.Structure) && !(target instanceof globals.StructureSpawn) ||
            !ScreepsConstants.CONSTRUCTION_COST[target.structureType]) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (this.room.controller && !this.room.controller.my && this.room.controller.safeMode) {
            return ErrorCode.ERR_NO_BODYPART;
        }

        const effect = _.find(target.effects, (e: any) => (e.power == PWRCode.PWR_FORTIFY || e.effect == ScreepsConstants.EFFECT_INVULNERABILITY) && (e.ticksRemaining > 0));
        if (effect) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'dismantle', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.generateSafeMode = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!data(this.id).store || !(data(this.id).store[Resource.RESOURCE_GHODIUM] >= ScreepsConstants.SAFE_MODE_COST)) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.StructureController)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'generateSafeMode', { id: target.id });
        return ErrorCode.OK;
    });

    Creep.prototype.signController = register.wrapFn(function (this: any, target: any, sign: any) {

        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (target.structureType != 'controller') {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'signController', { id: target.id, sign: "" + sign });
        return ErrorCode.OK;
    });

    Creep.prototype.pull = register.wrapFn(function (this: any, target: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }

        if (!target || !target.id || !register.creeps[target.id] || !(target instanceof globals.Creep) || target.spawning || target.id == this.id) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'pull', { id: target.id });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'Creep', { enumerable: true, value: Creep });
}

