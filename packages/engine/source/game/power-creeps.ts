import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';

import * as utils from './../utils';

let runtimeData: any,
    intents: any,
    register: any,
    globals: any;

function calcFreePowerLevels() {
    const level = Math.floor(Math.pow((runtimeData.user.power || 0) / ScreepsConstants.POWER_LEVEL_MULTIPLY, 1 / ScreepsConstants.POWER_LEVEL_POW));
    const used = Object.keys(runtimeData.userPowerCreeps).length + _.sum(runtimeData.userPowerCreeps, 'level');
    return level - used;
}

function data(id: any) {
    return Object.assign({}, runtimeData.userPowerCreeps[id], runtimeData.roomObjects[id]);
}

function _storeGetter(o: any) {
    return new globals.Store(o);
}

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    if (globals.PowerCreep) {
        return;
    }

    const PowerCreep = register.wrapFn(function (this: any, id: any) {
        const _data = data(id);
        if (_data.room) {
            globals.RoomObject.call(this, _data.x, _data.y, _data.room);
        }
        this.id = id;
    });

    PowerCreep.prototype = Object.create(globals.RoomObject.prototype);
    PowerCreep.prototype.constructor = PowerCreep;

    utils.defineGameObjectProperties(PowerCreep.prototype, data, {
        name: (o: any) => o.name,
        my: (o: any) => o.user == runtimeData.user._id,
        owner: (o: any) => new Object({ username: runtimeData.users[o.user].username }),
        level: (o: any) => o.level,
        className: (o: any) => o.className,
        hitsMax: (o: any) => o.hitsMax,
        hits: (o: any) => o.hits,
        shard: (o: any) => o.shard || undefined,
        spawnCooldownTime: (o: any) => o.spawnCooldownTime !== null && o.spawnCooldownTime > Date.now() ? o.spawnCooldownTime : undefined,
        deleteTime: (o: any) => o.deleteTime || undefined,
        powers: (o: any) => _.mapValues(o.powers, i => ({
            level: i.level,
            cooldown: Math.max(0, (i.cooldownTime || 0) - runtimeData.time)
        })),
        saying: (o: any) => {
            if (!o.actionLog || !o.actionLog.say) {
                return undefined;
            }
            if (o.user == runtimeData.user._id) {
                return o.actionLog.say.message;
            }
            return o.actionLog.say.isPublic ? o.actionLog.say.message : undefined;
        },
        carry: _storeGetter,
        store: _storeGetter,
        carryCapacity: (o: any) => o.storeCapacity,
        ticksToLive: (o: any) => o.ageTime - runtimeData.time,
    });

    Object.defineProperty(PowerCreep.prototype, 'memory', {
        get: function () {
            if (this.id && !this.my) {
                return undefined;
            }
            if (_.isUndefined(globals.Memory.powerCreeps) || globals.Memory.powerCreeps === 'undefined') {
                globals.Memory.powerCreeps = {};
            }
            if (!_.isObject(globals.Memory.powerCreeps)) {
                return undefined;
            }
            return globals.Memory.powerCreeps[this.name] = globals.Memory.powerCreeps[this.name] || {};
        },
        set: function (value) {
            if (this.id && !this.my) {
                throw new Error('Could not set other player\'s creep memory');
            }
            if (_.isUndefined(globals.Memory.powerCreeps) || globals.Memory.powerCreeps === 'undefined') {
                globals.Memory.powerCreeps = {};
            }
            if (!_.isObject(globals.Memory.powerCreeps)) {
                throw new Error('Could not set creep memory');
            }
            globals.Memory.powerCreeps[this.name] = value;
        }
    });

    PowerCreep.prototype.toString = register.wrapFn(function (this: any) {
        return `[powerCreep ${this.name}]`;
    });

    PowerCreep.prototype.move = register.wrapFn(function (this: any, target: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.move.call(this, target);
    });

    PowerCreep.prototype.moveTo = register.wrapFn(function (this: any, firstArg: any, secondArg: any, opts: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.moveTo.call(this, firstArg, secondArg, opts);
    });

    PowerCreep.prototype.moveByPath = register.wrapFn(function (this: any, path: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.moveByPath.call(this, path);
    });

    PowerCreep.prototype.transfer = register.wrapFn(function (this: any, target: any, resourceType: any, amount: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.transfer.call(this, target, resourceType, amount);
    });

    PowerCreep.prototype.withdraw = register.wrapFn(function (this: any, target: any, resourceType: any, amount: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.withdraw.call(this, target, resourceType, amount);
    });

    PowerCreep.prototype.drop = register.wrapFn(function (this: any, resourceType: any, amount: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.drop.call(this, resourceType, amount);
    });

    PowerCreep.prototype.pickup = register.wrapFn(function (this: any, target: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.pickup.call(this, target);
    });

    PowerCreep.prototype.say = register.wrapFn(function (this: any, message: any, isPublic: any) {
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        return globals.Creep.prototype.say.call(this, message, isPublic);
    });

    PowerCreep.prototype.spawn = register.wrapFn(function (this: any, powerSpawn: any) {
        if (this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!(powerSpawn instanceof globals.StructurePowerSpawn)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.my || !powerSpawn.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!utils.checkStructureAgainstController(data(powerSpawn.id), register.objectsByRoom[data(powerSpawn.id).room], data(powerSpawn.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        if (this.spawnCooldownTime) {
            return ErrorCode.ERR_TIRED;
        }

        if (_.isUndefined(globals.Memory.powerCreeps)) {
            globals.Memory.powerCreeps = {};
        }
        if (_.isObject(globals.Memory.powerCreeps) && _.isUndefined(globals.Memory.powerCreeps[this.name])) {
            globals.Memory.powerCreeps[this.name] = {};
        }

        intents.pushByName('global', 'spawnPowerCreep', { id: powerSpawn.id, name: this.name }, 50);
        return ErrorCode.OK;
    });

    PowerCreep.prototype.suicide = register.wrapFn(function (this: any) {

        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        intents.pushByName('global', 'suicidePowerCreep', { id: this.id }, 50);
        return ErrorCode.OK;
    });

    PowerCreep.prototype.delete = register.wrapFn(function (this: any, cancel: any) {

        if (this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        intents.pushByName('global', 'deletePowerCreep', { id: this.id, cancel }, 50);
        return ErrorCode.OK;
    });

    PowerCreep.prototype.upgrade = register.wrapFn(function (this: any, power: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (calcFreePowerLevels() <= 0) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (this.level >= ScreepsConstants.POWER_CREEP_MAX_LEVEL) {
            return ErrorCode.ERR_FULL;
        }
        const powerInfo = POWER_INFO[power];
        if (!powerInfo || powerInfo.className !== this.className) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        const powerData = data(this.id).powers[power];
        const powerLevel = powerData ? powerData.level : 0;
        if (powerLevel == 5) {
            return ErrorCode.ERR_FULL;
        }

        if (this.level < powerInfo.level[powerLevel]) {
            return ErrorCode.ERR_FULL;
        }

        intents.pushByName('global', 'upgradePowerCreep', { id: this.id, power }, 50);
        return ErrorCode.OK;
    });

    PowerCreep.prototype.usePower = register.wrapFn(function (this: any, power: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (this.room.controller) {
            if (!this.room.controller.isPowerEnabled) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            if (!this.room.controller.my && this.room.controller.safeMode) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
        }

        const powerData = data(this.id).powers[power];
        const powerInfo = POWER_INFO[power];
        if (!powerData || !powerData.level || !powerInfo) {
            return ErrorCode.ERR_NO_BODYPART;
        }
        if (powerData.cooldownTime > runtimeData.time) {
            return ErrorCode.ERR_TIRED;
        }
        let ops = powerInfo.ops || 0;
        if (_.isArray(ops)) {
            ops = ops[powerData.level - 1];
        }
        if ((data(this.id).store.ops || 0) < ops) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (powerInfo.range) {
            if (!target) {
                return ErrorCode.ERR_INVALID_TARGET;
            }
            if (!this.pos.inRangeTo(target, powerInfo.range)) {
                return ErrorCode.ERR_NOT_IN_RANGE;
            }
            const currentEffect = _.find(target.effects, (i: any) => i.power == power);
            if (currentEffect && currentEffect.level > powerData.level && currentEffect.ticksRemaining > 0) {
                return ErrorCode.ERR_FULL;
            }
        }

        intents.set(this.id, 'usePower', { power, id: target ? target.id : undefined });
        return ErrorCode.OK;
    });

    PowerCreep.prototype.enableRoom = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }

        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (target.structureType != 'controller' || target.safeMode && !target.my) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        intents.set(this.id, 'enableRoom', { id: target.id });
        return ErrorCode.OK;
    });

    PowerCreep.prototype.renew = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }

        if (!target || !target.id || !register.structures[target.id] || !(target instanceof globals.StructurePowerBank) && !(target instanceof globals.StructurePowerSpawn)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if ((target instanceof globals.StructurePowerSpawn) && !utils.checkStructureAgainstController(data(target.id), register.objectsByRoom[data(target.id).room], data(target.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        intents.set(this.id, 'renew', { id: target.id });
        return ErrorCode.OK;
    });

    PowerCreep.prototype.cancelOrder = register.wrapFn(function (this: any, name: any) {

        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (intents.remove(this.id, name)) {
            return ErrorCode.OK;
        }
        return ErrorCode.ERR_NOT_FOUND;
    });

    PowerCreep.prototype.rename = register.wrapFn(function (this: any, name: any) {

        if (this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (_.any(runtimeData.userPowerCreeps, _.matches({ name }))) {
            return ErrorCode.ERR_NAME_EXISTS;
        }

        intents.pushByName('global', 'renamePowerCreep', { id: this.id, name }, 50);
        return ErrorCode.OK;
    });

    PowerCreep.prototype.notifyWhenAttacked = register.wrapFn(function (this: any, enabled: any) {

        if (!this.room) {
            return ErrorCode.ERR_BUSY;
        }
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!_.isBoolean(enabled)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        if (enabled != data(this.id).notifyWhenAttacked) {

            intents.set(this.id, 'notifyWhenAttacked', { enabled });
        }

        return ErrorCode.OK;
    });

    PowerCreep.create = register.wrapFn((name: any, className: any) => {

        if (calcFreePowerLevels() <= 0) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (_.any(runtimeData.userPowerCreeps, _.matches({ name }))) {
            return ErrorCode.ERR_NAME_EXISTS;
        }
        if (Object.values(ScreepsConstants.POWER_CLASS).indexOf(className) === -1) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        intents.pushByName('global', 'createPowerCreep', { name, className }, 50);
        return ErrorCode.OK;
    });



    Object.defineProperty(globals, 'PowerCreep', { enumerable: true, value: PowerCreep });
}
