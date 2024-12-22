import _ from 'lodash';

import * as utils from '../utils';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { FindCode } from '@screeps/common/src/constants/find-code';
import { Resource } from '@screeps/common/src/constants/resource';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { Reactions } from '@screeps/common/src/constants/reactions';
import { Boosts } from '@screeps/common/src/constants/boosts';
import { ListItems } from '@screeps/common/src/tables/list-items';
import { BodyParts } from '@screeps/common/src/constants/body-parts';

import * as names from './names';

let runtimeData: any,
    intents: any,
    register: any,
    globals: any,
    createdCreepNames: any,
    lastActivateSafeMode: any;

function data(id: any) {
    if (!runtimeData.roomObjects[id]) {
        throw new Error("Could not find an object with ID " + id);
    }
    return runtimeData.roomObjects[id];
}

function _storeGetter(o: any) {
    return new globals.Store(o);
}

export function make(_runtimeData: any, _intents: any, _register: any, _globals: any) {

    runtimeData = _runtimeData;
    intents = _intents;
    register = _register;
    globals = _globals;

    createdCreepNames = [];
    lastActivateSafeMode = null;

    if (globals.Structure) {
        return;
    }

    /**
     * Structure
     * @param id
     * @constructor
     */
    const Structure = register.wrapFn(function (this: any, id: any) {
        if (id) {
            this.id = id;
            const _data = data(id);
            globals.RoomObject.call(this, _data.x, _data.y, _data.room, _data.effects);

            if (_data.type == StructureEnum.STRUCTURE_CONTROLLER) {
                register.rooms[_data.room].controller = this;
            }

            if (_data.type == StructureEnum.STRUCTURE_STORAGE) {
                register.rooms[_data.room].storage = this;
            }

            if (_data.type == StructureEnum.STRUCTURE_TERMINAL) {
                register.rooms[_data.room].terminal = this;
            }
        }
    });

    Structure.prototype = Object.create(globals.RoomObject.prototype);
    Structure.prototype.constructor = Structure;

    utils.defineGameObjectProperties(Structure.prototype, data, {
        hits: (o: any) => o.hits,
        hitsMax: (o: any) => o.hitsMax,
        structureType: (o: any) => o.type
    });

    Structure.prototype.toString = register.wrapFn(function (this: any) {
        return `[structure (${this.structureType}) #${this.id}]`;
    });

    Structure.prototype.destroy = register.wrapFn(function (this: any) {
        if (!this.room) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.room.controller || !this.room.controller.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (this.room.find(FindCode.FIND_HOSTILE_CREEPS).length > 0 ||
            this.room.find(FindCode.FIND_HOSTILE_POWER_CREEPS).length > 0) {
            return ErrorCode.ERR_BUSY;
        }

        intents.pushByName('room', 'destroyStructure', { roomName: this.room.name, id: this.id });
        return ErrorCode.OK;
    });

    Structure.prototype.notifyWhenAttacked = register.wrapFn(function (this: any, enabled: any) {
        if (!this.room) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (this.my === false || (this.room.controller && this.room.controller.owner && !this.room.controller.my)) {
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

    Structure.prototype.isActive = register.wrapFn(function (this: any) {
        if (!this.owner) {
            return true;
        }
        if (!ScreepsConstants.CONTROLLER_STRUCTURES[data(this.id).type]) {
            return true;
        }
        if (!this.room || !this.room.controller) {
            return false;
        }
        return utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id));
    });

    Object.defineProperty(globals, 'Structure', { enumerable: true, value: Structure });

    /**
     * OwnedStructure
     * @param id
     * @constructor
     */

    const OwnedStructure = register.wrapFn(function (this: any, id: any) {
        Structure.call(this, id);
    });
    OwnedStructure.prototype = Object.create(Structure.prototype);
    OwnedStructure.prototype.constructor = OwnedStructure;

    utils.defineGameObjectProperties(OwnedStructure.prototype, data, {
        owner: (o: any) => _.isUndefined(o.user) || o.user === null ? undefined : {
            username: runtimeData.users[o.user].username
        },
        my: (o: any) => _.isUndefined(o.user) ? undefined : o.user == runtimeData.user._id
    });

    Object.defineProperty(globals, 'OwnedStructure', { enumerable: true, value: OwnedStructure });

    /**
     * StructureContainer
     * @param id
     * @constructor
     */
    const StructureContainer = register.wrapFn(function (this: any, id: any) {
        Structure.call(this, id);
    });
    StructureContainer.prototype = Object.create(Structure.prototype);
    StructureContainer.prototype.constructor = StructureContainer;

    utils.defineGameObjectProperties(StructureContainer.prototype, data, {
        store: _storeGetter,
        storeCapacity: (o: any) => o.storeCapacity,
        ticksToDecay: (o: any) => o.nextDecayTime ? o.nextDecayTime - runtimeData.time : o.decayTime ? o.decayTime - runtimeData.time : undefined,
    });

    Object.defineProperty(globals, 'StructureContainer', { enumerable: true, value: StructureContainer });

    /**
     * StructureController
     * @param id
     * @constructor
     */
    const StructureController = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureController.prototype = Object.create(OwnedStructure.prototype);
    StructureController.prototype.constructor = StructureController;

    utils.defineGameObjectProperties(StructureController.prototype, data, {
        ticksToDowngrade: (o: any) => o.downgradeTime ? o.downgradeTime - runtimeData.time : undefined,
        reservation: (o: any) => o.reservation ? {
            username: runtimeData.users[o.reservation.user].username,
            ticksToEnd: o.reservation.endTime - runtimeData.time
        } : undefined,
        level: (o: any) => o.level,
        progress: (o: any) => o.level > 0 ? o.progress : undefined,
        progressTotal: (o: any) => o.level > 0 && o.level < 8 ? ScreepsConstants.CONTROLLER_LEVELS[o.level] : undefined,
        upgradeBlocked: (o: any) => o.upgradeBlocked && o.upgradeBlocked > runtimeData.time ? o.upgradeBlocked - runtimeData.time : undefined,
        safeMode: (o: any) => o.safeMode && o.safeMode > runtimeData.time ? o.safeMode - runtimeData.time : undefined,
        safeModeCooldown: (o: any) => o.safeModeCooldown && o.safeModeCooldown > runtimeData.time ? o.safeModeCooldown - runtimeData.time : undefined,
        safeModeAvailable: (o: any) => o.safeModeAvailable || 0,
        sign: (o: any) => o.hardSign ? {
            username: ScreepsConstants.SYSTEM_USERNAME,
            text: o.hardSign.text,
            time: o.hardSign.time,
            datetime: new Date(o.hardSign.datetime)
        } : o.sign ? {
            username: runtimeData.users[o.sign.user].username,
            text: o.sign.text,
            time: o.sign.time,
            datetime: new Date(o.sign.datetime)
        } : undefined,
        isPowerEnabled: (o: any) => !!o.isPowerEnabled
    });

    StructureController.prototype.unclaim = register.wrapFn(function (this: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        intents.set(this.id, 'unclaim', {});
        return ErrorCode.OK;
    });

    StructureController.prototype.activateSafeMode = register.wrapFn(function (this: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.safeModeAvailable <= 0) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (this.safeModeCooldown || this.upgradeBlocked > 0 ||
            this.ticksToDowngrade < ScreepsConstants.CONTROLLER_DOWNGRADE[this.level] / 2 - ScreepsConstants.CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD) {
            return ErrorCode.ERR_TIRED;
        }
        if (_.any(register.structures, (i: any) => i.structureType == 'controller' && i.my && i.safeMode)) {
            return ErrorCode.ERR_BUSY;
        }

        if (lastActivateSafeMode) {
            intents.remove(lastActivateSafeMode, 'activateSafeMode');
        }
        lastActivateSafeMode = this.id;

        intents.set(this.id, 'activateSafeMode', {});
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureController', { enumerable: true, value: StructureController });

    /**
     * StructureExtension
     * @param id
     * @constructor
     */
    const StructureExtension = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureExtension.prototype = Object.create(OwnedStructure.prototype);
    StructureExtension.prototype.constructor = StructureExtension;

    utils.defineGameObjectProperties(StructureExtension.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy || 0 : 0,
        store: _storeGetter
    });

    Object.defineProperty(globals, 'StructureExtension', { enumerable: true, value: StructureExtension });

    /**
     * StructureExtractor
     * @param id
     * @constructor
     */
    const StructureExtractor = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureExtractor.prototype = Object.create(OwnedStructure.prototype);
    StructureExtractor.prototype.constructor = StructureExtractor;

    utils.defineGameObjectProperties(StructureExtractor.prototype, data, {
        cooldown: (o: any) => o.cooldown || 0
    });

    Object.defineProperty(globals, 'StructureExtractor', { enumerable: true, value: StructureExtractor });

    /**
     * StructureKeeperLair
     * @param id
     * @constructor
     */
    const StructureKeeperLair = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureKeeperLair.prototype = Object.create(OwnedStructure.prototype);
    StructureKeeperLair.prototype.constructor = StructureKeeperLair;

    utils.defineGameObjectProperties(StructureKeeperLair.prototype, data, {
        my: () => false,
        owner: () => ({ username: 'Source Keeper' }),
        ticksToSpawn: (o: any) => o.nextSpawnTime ? o.nextSpawnTime - runtimeData.time : undefined
    });

    Object.defineProperty(globals, 'StructureKeeperLair', { enumerable: true, value: StructureKeeperLair });

    /**
     * StructureLab
     * @param id
     * @constructor
     */
    const StructureLab = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureLab.prototype = Object.create(OwnedStructure.prototype);
    StructureLab.prototype.constructor = StructureLab;

    const labMineralAmountGetter = (o: any) => _.sum(o.store) - (o.store.energy || 0);
    const labMineralTypeGetter = (o: any) => _.keys(o.store).filter(k => k != Resource.RESOURCE_ENERGY && o.store[k]).at(0)!;

    utils.defineGameObjectProperties(StructureLab.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy : 0,
        cooldown: (o: any) => o.cooldownTime && o.cooldownTime > runtimeData.time ? o.cooldownTime - runtimeData.time : 0,
        mineralAmount: labMineralAmountGetter,
        mineralCapacity: (_o: any) => ScreepsConstants.LAB_MINERAL_CAPACITY,
        mineralType: labMineralTypeGetter,
        store: _storeGetter
    });

    StructureLab.prototype.runReaction = register.wrapFn(function (this: any, lab1: any, lab2: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.cooldown > 0) {
            return ErrorCode.ERR_TIRED;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!lab1 || !lab1.id || !register.structures[lab1.id] ||
            !(lab1 instanceof globals.Structure) || lab1.structureType != StructureEnum.STRUCTURE_LAB || lab1.id == this.id) {
            register.assertTargetObject(lab1);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!lab2 || !lab2.id || !register.structures[lab2.id] ||
            !(lab2 instanceof globals.Structure) || lab2.structureType != StructureEnum.STRUCTURE_LAB || lab2.id == this.id) {
            register.assertTargetObject(lab2);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (this.pos.getRangeTo(lab1) > 2 || this.pos.getRangeTo(lab2) > 2) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        let reactionAmount = ScreepsConstants.LAB_REACTION_AMOUNT;
        const effect: any = _.find(this.effects, i => i.power == PWRCode.PWR_OPERATE_LAB);
        if (effect && effect.ticksRemaining > 0) {
            reactionAmount += POWER_INFO[PWRCode.PWR_OPERATE_LAB].effect[effect.level - 1];
        }
        if (this.mineralAmount > this.mineralCapacity - reactionAmount) {
            return ErrorCode.ERR_FULL;
        }
        if (lab1.mineralAmount < reactionAmount || lab2.mineralAmount < reactionAmount) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (!(lab1.mineralType in Reactions) || !(Reactions as any)[lab1.mineralType][lab2.mineralType] ||
            this.mineralType && this.mineralType != (Reactions as any)[lab1.mineralType][lab2.mineralType]) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        intents.set(this.id, 'runReaction', { lab1: lab1.id, lab2: lab2.id });
        return ErrorCode.OK;
    });

    StructureLab.prototype.boostCreep = register.wrapFn(function (this: any, target: any, bodyPartsCount: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!target || !target.id || !register.creeps[target.id] || !(target instanceof globals.Creep) || target.spawning) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.pos.isNearTo(target)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (data(this.id).store.energy < ScreepsConstants.LAB_BOOST_ENERGY) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (labMineralAmountGetter(data(this.id)) < ScreepsConstants.LAB_BOOST_MINERAL) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        bodyPartsCount = bodyPartsCount || 0;
        const _f = (target.body).filter((i: any) =>
            !i.boost &&
            (Boosts as any)[i.type] &&
            (Boosts as any)[i.type][labMineralTypeGetter(data(this.id))]);

        const nonBoostedParts = _.size(_f);

        if (!nonBoostedParts || bodyPartsCount && bodyPartsCount > nonBoostedParts) {
            return ErrorCode.ERR_NOT_FOUND;
        }

        intents.set(this.id, 'boostCreep', { id: target.id, bodyPartsCount });
        return ErrorCode.OK;
    });

    StructureLab.prototype.unboostCreep = register.wrapFn(function (this: any, target: any) {
        if (!target || !target.id || !register.creeps[target.id] || !(target instanceof globals.Creep)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.my || !target.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (this.cooldown > 0) {
            return ErrorCode.ERR_TIRED;
        }
        if (!_.some(target.body, (p: any) => !!p.boost)) {
            return ErrorCode.ERR_NOT_FOUND;
        }
        if (!this.pos.isNearTo(target)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'unboostCreep', { id: target.id });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureLab', { enumerable: true, value: StructureLab });

    /**
     * StructureLink
     * @param id
     * @constructor
     */
    const StructureLink = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureLink.prototype = Object.create(OwnedStructure.prototype);
    StructureLink.prototype.constructor = StructureLink;

    utils.defineGameObjectProperties(StructureLink.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy || 0 : 0,
        cooldown: (o: any) => o.cooldown || 0,
        store: _storeGetter
    });

    StructureLink.prototype.transferEnergy = register.wrapFn(function (this: any, target: any, amount: any) {

        if (amount < 0) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!target ||
            !target.id ||
            !register.structures[target.id] ||
            !(target instanceof globals.Structure) ||
            target === this ||
            target.structureType != StructureEnum.STRUCTURE_LINK) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!target.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (this.my === false && _.any(this.pos.lookFor('structure'), (i: any) => i.structureType == StructureEnum.STRUCTURE_RAMPART)) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (this.cooldown > 0) {
            return ErrorCode.ERR_TIRED;
        }
        if (!this.room.controller) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        if (!data(this.id).store || !data(this.id).store.energy) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (!amount) {
            amount = Math.min(data(this.id).store.energy, data(target.id).storeCapacityResource ? data(target.id).storeCapacityResource.energy - data(target.id).store.energy : 0);
        }
        if (this.energy < amount) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (!data(target.id).storeCapacityResource || !data(target.id).storeCapacityResource.energy || data(target.id).store.energy + amount > data(target.id).storeCapacityResource.energy) {
            return ErrorCode.ERR_FULL;
        }
        if (target.pos.roomName != this.pos.roomName) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'transfer', { id: target.id, amount, resourceType: 'energy' });
        return ErrorCode.OK;

    });

    Object.defineProperty(globals, 'StructureLink', { enumerable: true, value: StructureLink });

    /**
     * StructureObserver
     * @param id
     * @constructor
     */
    const StructureObserver = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureObserver.prototype = Object.create(OwnedStructure.prototype);
    StructureObserver.prototype.constructor = StructureObserver;

    StructureObserver.prototype.observeRoom = register.wrapFn(function (this: any, roomName: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!_.isString(roomName) || !/^(W|E)\d+(S|N)\d+$/.test(roomName)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        const [tx, ty] = utils.roomNameToXY(roomName);
        const [x, y] = utils.roomNameToXY(data(this.id).room);

        const effect: any = _.find(this.effects, i => i.power == PWRCode.PWR_OPERATE_OBSERVER);
        if ((!effect || effect.ticksRemaining <= 0) &&
            (Math.abs(tx - x) > ScreepsConstants.OBSERVER_RANGE || Math.abs(ty - y) > ScreepsConstants.OBSERVER_RANGE)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'observeRoom', { roomName });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureObserver', { enumerable: true, value: StructureObserver });

    /**
     * StructurePowerBank
     * @param id
     * @constructor
     */
    const StructurePowerBank = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructurePowerBank.prototype = Object.create(OwnedStructure.prototype);
    StructurePowerBank.prototype.constructor = StructurePowerBank;

    utils.defineGameObjectProperties(StructurePowerBank.prototype, data, {
        power: (o: any) => o.store.power,
        ticksToDecay: (o: any) => o.nextDecayTime ? o.nextDecayTime - runtimeData.time : o.decayTime ? o.decayTime - runtimeData.time : undefined,
        my: () => false,
        owner: () => ({ username: 'Power Bank' })
    });

    Object.defineProperty(globals, 'StructurePowerBank', { enumerable: true, value: StructurePowerBank });

    /**
     * StructurePowerSpawn
     * @param id
     * @constructor
     */
    const StructurePowerSpawn = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructurePowerSpawn.prototype = Object.create(OwnedStructure.prototype);
    StructurePowerSpawn.prototype.constructor = StructurePowerSpawn;

    utils.defineGameObjectProperties(StructurePowerSpawn.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy || 0 : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy : 0,
        power: (o: any) => o.store ? o.store.power || 0 : 0,
        powerCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.power : 0,
        store: _storeGetter
    });

    StructurePowerSpawn.prototype.processPower = register.wrapFn(function (this: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        let amount = 1;
        const effect = _.find(this.effects, (i: any) => i.power == PWRCode.PWR_OPERATE_POWER);
        if (effect && effect.ticksRemaining > 0) {
            amount += POWER_INFO[PWRCode.PWR_OPERATE_POWER].effect[effect.level - 1];
        }
        if (this.power < amount || this.energy < amount * ScreepsConstants.POWER_SPAWN_ENERGY_RATIO) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        intents.set(this.id, 'processPower', {});
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructurePowerSpawn', { enumerable: true, value: StructurePowerSpawn });

    /**
     * StructureRampart
     * @param id
     * @constructor
     */
    const StructureRampart = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureRampart.prototype = Object.create(OwnedStructure.prototype);
    StructureRampart.prototype.constructor = StructureRampart;

    utils.defineGameObjectProperties(StructureRampart.prototype, data, {
        ticksToDecay: (o: any) => o.nextDecayTime ? o.nextDecayTime - runtimeData.time : o.decayTime ? o.decayTime - runtimeData.time : undefined,
        isPublic: (o: any) => !!o.isPublic
    });

    StructureRampart.prototype.setPublic = register.wrapFn(function (this: any, isPublic: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        intents.set(this.id, 'setPublic', { isPublic: !!isPublic });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureRampart', { enumerable: true, value: StructureRampart });

    /**
     * StructureRoad
     * @param id
     * @constructor
     */
    const StructureRoad = register.wrapFn(function (this: any, id: any) {
        Structure.call(this, id);
    });
    StructureRoad.prototype = Object.create(Structure.prototype);
    StructureRoad.prototype.constructor = StructureRoad;

    utils.defineGameObjectProperties(StructureRoad.prototype, data, {
        ticksToDecay: (o: any) => o.nextDecayTime ? o.nextDecayTime - runtimeData.time : o.decayTime ? o.decayTime - runtimeData.time : undefined
    });

    Object.defineProperty(globals, 'StructureRoad', { enumerable: true, value: StructureRoad });


    /**
     * StructureStorage
     * @param id
     * @constructor
     */
    const StructureStorage = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureStorage.prototype = Object.create(OwnedStructure.prototype);
    StructureStorage.prototype.constructor = StructureStorage;

    utils.defineGameObjectProperties(StructureStorage.prototype, data, {
        store: _storeGetter,
        storeCapacity: (o: any) => o.storeCapacity
    });

    Object.defineProperty(globals, 'StructureStorage', { enumerable: true, value: StructureStorage });

    /**
     * StructureTerminal
     * @param id
     * @constructor
     */
    const StructureTerminal = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureTerminal.prototype = Object.create(OwnedStructure.prototype);
    StructureTerminal.prototype.constructor = StructureTerminal;

    utils.defineGameObjectProperties(StructureTerminal.prototype, data, {
        store: _storeGetter,
        storeCapacity: (o: any) => o.storeCapacity,
        cooldown: (o: any) => o.cooldownTime && o.cooldownTime > runtimeData.time ? o.cooldownTime - runtimeData.time : 0
    });

    StructureTerminal.prototype.send = register.wrapFn(function (
        this: any, resourceType: any, amount: any, targetRoomName: any, description: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!/^(W|E)\d+(N|S)\d+$/.test(targetRoomName)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!_.contains(ListItems.RESOURCES_ALL, resourceType)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        if (!data(this.id).store || !data(this.id).store[resourceType] || data(this.id).store[resourceType] < amount) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (data(this.id).cooldownTime > runtimeData.time) {
            return ErrorCode.ERR_TIRED;
        }
        const range = utils.calcRoomsDistance(data(this.id).room, targetRoomName, true);
        const cost = utils.calcTerminalEnergyCost(amount, range);
        if (resourceType != Resource.RESOURCE_ENERGY && data(this.id).store.energy < cost ||
            resourceType == Resource.RESOURCE_ENERGY && data(this.id).store.energy < amount + cost) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }
        if (description && (!_.isString(description) || description.length > 100)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        intents.set(this.id, 'send', { resourceType, amount, targetRoomName, description });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureTerminal', { enumerable: true, value: StructureTerminal });

    /**
     * StructureTower
     * @param id
     * @constructor
     */
    const StructureTower = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureTower.prototype = Object.create(OwnedStructure.prototype);
    StructureTower.prototype.constructor = StructureTower;

    utils.defineGameObjectProperties(StructureTower.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy || 0 : 0,
        store: _storeGetter
    });

    StructureTower.prototype.attack = register.wrapFn(function (this: any, target: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] && !register.structures[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep) && !(target instanceof globals.StructureSpawn) && !(target instanceof globals.Structure)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!data(this.id).store || (data(this.id).store.energy < ScreepsConstants.TOWER_ENERGY_COST)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        intents.set(this.id, 'attack', { id: target.id });
        return ErrorCode.OK;
    });

    StructureTower.prototype.heal = register.wrapFn(function (this: any, target: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target || !target.id || !register.creeps[target.id] && !register.powerCreeps[target.id] ||
            !(target instanceof globals.Creep) && !(target instanceof globals.PowerCreep)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!data(this.id).store || (data(this.id).store.energy < ScreepsConstants.TOWER_ENERGY_COST)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        intents.set(this.id, 'heal', { id: target.id });
        return ErrorCode.OK;
    });

    StructureTower.prototype.repair = register.wrapFn(function (this: any, target: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target || !target.id || !register.structures[target.id] ||
            !(target instanceof globals.Structure) && !(target instanceof globals.StructureSpawn)) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!data(this.id).store || (data(this.id).store.energy < ScreepsConstants.TOWER_ENERGY_COST)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        intents.set(this.id, 'repair', { id: target.id });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureTower', { enumerable: true, value: StructureTower });

    /**
     * StructureWall
     * @param id
     * @constructor
     */
    const StructureWall = register.wrapFn(function (this: any, id: any) {
        Structure.call(this, id);
    });
    StructureWall.prototype = Object.create(Structure.prototype);
    StructureWall.prototype.constructor = StructureWall;

    utils.defineGameObjectProperties(StructureWall.prototype, data, {
        ticksToLive: (o: any) => o.ticksToLive,
    });

    Object.defineProperty(globals, 'StructureWall', { enumerable: true, value: StructureWall });


    /**
     * StructureSpawn
     * @param id
     * @constructor
     */
    const StructureSpawn = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureSpawn.prototype = Object.create(OwnedStructure.prototype);
    StructureSpawn.prototype.constructor = StructureSpawn;

    utils.defineGameObjectProperties(StructureSpawn.prototype, data, {
        name: (o: any) => o.name,
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy || 0 : 0,
        spawning: (o: any, id: any) => o.spawning ? new StructureSpawn.Spawning(id) : null,
        store: _storeGetter
    });

    Object.defineProperty(StructureSpawn.prototype, 'memory', {
        get: function () {
            if (!this.my) {
                return undefined;
            }
            if (_.isUndefined(globals.Memory.spawns) || globals.Memory.spawns === 'undefined') {
                globals.Memory.spawns = {};
            }
            if (!_.isObject(globals.Memory.spawns)) {
                return undefined;
            }
            return globals.Memory.spawns[data(this.id).name] = globals.Memory.spawns[data(this.id).name] || {};
        },

        set: function (value) {
            if (!this.my) {
                throw new Error('Could not set other player\'s spawn memory');
            }
            if (_.isUndefined(globals.Memory.spawns) || globals.Memory.spawns === 'undefined') {
                globals.Memory.spawns = {};
            }
            if (!_.isObject(globals.Memory.spawns)) {
                throw new Error('Could not set spawn memory');
            }
            globals.Memory.spawns[data(this.id).name] = value;
        }
    });

    StructureSpawn.prototype.toString = register.wrapFn(function (this: any) {
        return `[spawn ${data(this.id).user == runtimeData.user._id ? data(this.id).name : '#' + this.id}]`;
    });

    StructureSpawn.prototype.canCreateCreep = register.wrapFn(function (this: any, body: any, name: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (data(this.id).spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!body || !_.isArray(body) || body.length == 0 || body.length > ScreepsConstants.MAX_CREEP_SIZE) {
            return ErrorCode.ERR_INVALID_ARGS;
        }
        for (let i = 0; i < body.length; i++) {
            if (!_.contains(ListItems.BODYPARTS_ALL, body[i]))
                return ErrorCode.ERR_INVALID_ARGS;
        }

        if (this.room.energyAvailable < utils.calcCreepCost(body)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }

        if (runtimeData.roomObjects[this.id].off) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        if (name && (globals.Game.creeps[name] || createdCreepNames.indexOf(name) != -1)) {
            return ErrorCode.ERR_NAME_EXISTS;
        }

        return ErrorCode.OK;
    });

    StructureSpawn.prototype.createCreep = register.wrapFn(function (this: any, body: any, name: any, creepMemory: any) {

        if (_.isObject(name) && _.isUndefined(creepMemory)) {
            creepMemory = name;
            name = undefined;
        }

        const canResult = this.canCreateCreep(body, name);
        if (canResult != ErrorCode.OK) {
            return canResult;
        }

        if (!name) {
            name = names.getUniqueName((i: any) => {
                return _.any(runtimeData.roomObjects, _.matches({ type: 'creep', user: data(this.id).user, name: i })) ||
                    createdCreepNames.indexOf(i) != -1;
            });
        }

        createdCreepNames.push(name);

        if (_.isUndefined(globals.Memory.creeps)) {
            globals.Memory.creeps = {};
        }
        if (_.isObject(globals.Memory.creeps)) {
            if (!_.isUndefined(creepMemory)) {
                globals.Memory.creeps[name] = creepMemory;
            }
            else {
                globals.Memory.creeps[name] = globals.Memory.creeps[name] || {};
            }
        }

        globals.Game.creeps[name] = new globals.Creep();
        globals.RoomObject.call(globals.Game.creeps[name], this.pos.x, this.pos.y, this.pos.roomName);
        Object.defineProperties(globals.Game.creeps[name], {
            name: {
                enumerable: true,
                get() {
                    return name;
                }
            },
            spawning: {
                enumerable: true,
                get() {
                    return true;
                }
            },
            my: {
                enumerable: true,
                get() {
                    return true;
                }
            },
            body: {
                enumerable: true,
                get() {
                    return _.map(body, type => ({ type, hits: 100 }))
                }
            },
            owner: {
                enumerable: true,
                get() {
                    return new Object({ username: runtimeData.user.username });
                }
            },
            ticksToLive: {
                enumerable: true,
                get() {
                    return ScreepsConstants.CREEP_LIFE_TIME;
                }
            },
            carryCapacity: {
                enumerable: true,
                get() {
                    return _.reduce(body, (result, type) => result += type == BodyParts.CARRY ? ScreepsConstants.CARRY_CAPACITY : 0, 0);
                }
            },
            carry: {
                enumerable: true,
                get() {
                    return { energy: 0 };
                }
            },
            fatigue: {
                enumerable: true,
                get() {
                    return 0;
                }
            },
            hits: {
                enumerable: true,
                get() {
                    return body.length * 100;
                }
            },
            hitsMax: {
                enumerable: true,
                get() {
                    return body.length * 100;
                }
            },
            saying: {
                enumerable: true,
                get() {
                    return undefined;
                }
            }
        });

        intents.set(this.id, 'createCreep', { name, body });
        return name;
    });

    function calcEnergyAvailable(roomObjects: any, energyStructures: any) {
        return _.sum(energyStructures, (id: any) => {
            if (roomObjects[id] && !roomObjects[id].off && (roomObjects[id].type === 'spawn' || roomObjects[id].type === 'extension') && roomObjects[id].store) {
                return roomObjects[id].store.energy;
            } else {
                return 0;
            }
        });
    }

    StructureSpawn.prototype.spawnCreep = register.wrapFn(function spawnCreep(
        this: any, body: any, name: any, options: Record<string, any> = {}) {

        if (!name || !_.isObject(options)) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        if (globals.Game.creeps[name] || createdCreepNames.indexOf(name) != -1) {
            return ErrorCode.ERR_NAME_EXISTS;
        }

        let energyStructures = options.energyStructures &&
            _.uniq(_.map(options.energyStructures, _.property('id')));

        let directions = options.directions;
        if (directions !== undefined) {
            if (!_.isArray(directions)) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
            // convert directions to numbers, eliminate duplicates
            directions = _.uniq(_.map(directions, (d: any) => +d));
            // bail if any numbers are out of bounds or non-integers
            if (directions.length == 0 || !_.all(directions, (direction: any) => direction >= 1 && direction <= 8 && direction === (direction | 0))) {
                return ErrorCode.ERR_INVALID_ARGS;
            }
        }

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (data(this.id).spawning) {
            return ErrorCode.ERR_BUSY;
        }

        if (data(this.id).off) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        if (!body || !_.isArray(body) || body.length === 0 || body.length > ScreepsConstants.MAX_CREEP_SIZE) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        for (let i = 0; i < body.length; i++) {
            if (!_.contains(ListItems.BODYPARTS_ALL, body[i]))
                return ErrorCode.ERR_INVALID_ARGS;
        }

        let energyAvailable = energyStructures ? calcEnergyAvailable(runtimeData.roomObjects, energyStructures) : this.room.energyAvailable;
        if (energyAvailable < utils.calcCreepCost(body)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }

        if (options.dryRun) {
            return ErrorCode.OK;
        }

        createdCreepNames.push(name);

        if (_.isUndefined(globals.Memory.creeps)) {
            globals.Memory.creeps = {};
        }

        if (_.isObject(globals.Memory.creeps)) {
            globals.Memory.creeps[name] = options.memory || globals.Memory.creeps[name] || {};
        }

        globals.Game.creeps[name] = new globals.Creep();
        globals.RoomObject.call(globals.Game.creeps[name], this.pos.x, this.pos.y, this.pos.roomName);
        Object.defineProperties(globals.Game.creeps[name], {
            name: {
                enumerable: true,
                get() {
                    return name;
                }
            },
            spawning: {
                enumerable: true,
                get() {
                    return true;
                }
            },
            my: {
                enumerable: true,
                get() {
                    return true;
                }
            },
            body: {
                enumerable: true,
                get() {
                    return _.map(body, type => ({ type, hits: 100 }))
                }
            },
            owner: {
                enumerable: true,
                get() {
                    return new Object({ username: runtimeData.user.username });
                }
            },
            ticksToLive: {
                enumerable: true,
                get() {
                    return ScreepsConstants.CREEP_LIFE_TIME;
                }
            },
            carryCapacity: {
                enumerable: true,
                get() {
                    return _.reduce(body, (result, type) => result += type === BodyParts.CARRY ? ScreepsConstants.CARRY_CAPACITY : 0, 0);
                }
            },
            carry: {
                enumerable: true,
                get() {
                    return { energy: 0 };
                }
            },
            fatigue: {
                enumerable: true,
                get() {
                    return 0;
                }
            },
            hits: {
                enumerable: true,
                get() {
                    return body.length * 100;
                }
            },
            hitsMax: {
                enumerable: true,
                get() {
                    return body.length * 100;
                }
            },
            saying: {
                enumerable: true,
                get() {
                    return undefined;
                }
            }
        });

        intents.set(this.id, 'createCreep', { name, body, energyStructures, directions });

        return ErrorCode.OK;
    });

    StructureSpawn.prototype.notifyWhenAttacked = register.wrapFn(function (this: any, enabled: any) {

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

    StructureSpawn.prototype.renewCreep = register.wrapFn(function (this: any, target: any) {

        if (this.spawning) {
            return ErrorCode.ERR_BUSY;
        }
        if (!target || !target.id || !register.creeps[target.id] || !(target instanceof globals.Creep) || target.spawning) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!this.my || !target.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (runtimeData.roomObjects[this.id].off) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (this.room.energyAvailable < Math.ceil(ScreepsConstants.SPAWN_RENEW_RATIO * utils.calcCreepCost(target.body) / ScreepsConstants.CREEP_SPAWN_TIME / target.body.length)) {
            return ErrorCode.ERR_NOT_ENOUGH_ENERGY;
        }
        if (target.ticksToLive + Math.floor(ScreepsConstants.SPAWN_RENEW_RATIO * ScreepsConstants.CREEP_LIFE_TIME / ScreepsConstants.CREEP_SPAWN_TIME / target.body.length) > ScreepsConstants.CREEP_LIFE_TIME) {
            return ErrorCode.ERR_FULL;
        }
        if (_.any(target.body, (i: any) => !!i.boost)) {
            register.deprecated('Using `StructureSpawn.renewCreep` on a boosted creep is deprecated and will throw an error soon. Please remove boosts using `StructureLab.unboostCreep` before renewing.');
        }

        intents.set(this.id, 'renewCreep', { id: target.id });
        return ErrorCode.OK;
    });

    StructureSpawn.prototype.recycleCreep = register.wrapFn(function (this: any, target: any) {

        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target || !target.id || !register.creeps[target.id] || !(target instanceof globals.Creep) || target.spawning) {
            register.assertTargetObject(target);
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (runtimeData.roomObjects[this.id].off) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        if (!target.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (!target.pos.isNearTo(this.pos)) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }

        intents.set(this.id, 'recycleCreep', { id: target.id });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureSpawn', { enumerable: true, value: StructureSpawn });
    Object.defineProperty(globals, 'Spawn', { enumerable: true, value: StructureSpawn });

    /**
     * SpawnSpawning
     * @param {Number} spawnId
     * @param {Object} properties
     * @constructor
     */
    StructureSpawn.Spawning = register.wrapFn(function (this: any, spawnId: any) {
        Object.defineProperty(this, 'spawn', {
            enumerable: false,
            value: register._objects[spawnId]
        });
        this.name = data(spawnId).spawning.name;
        this.needTime = data(spawnId).spawning.needTime;
        this.remainingTime = data(spawnId).spawning.remainingTime;
        this.directions = data(spawnId).spawning.directions;
    });

    StructureSpawn.Spawning.prototype.setDirections = register.wrapFn(function (this: any, directions: any) {
        if (!this.spawn.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (_.isArray(directions) && directions.length > 0) {
            // convert directions to numbers, eliminate duplicates
            directions = _.uniq(_.map(directions, (e: any) => +e));
            // bail if any numbers are out of bounds or non-integers
            if (!_.any(directions, (direction: any) => direction < 1 || direction > 8 || direction !== (direction | 0))) {
                intents.set(this.spawn.id, 'setSpawnDirections', { directions });
                return ErrorCode.OK;
            }
        }
        return ErrorCode.ERR_INVALID_ARGS;
    });

    StructureSpawn.Spawning.prototype.cancel = register.wrapFn(function (this: any) {
        if (!this.spawn.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        intents.set(this.spawn.id, 'cancelSpawning', {});
        return ErrorCode.OK;
    });

    /**
     * StructureNuker
     * @param id
     * @constructor
     */
    const StructureNuker = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureNuker.prototype = Object.create(OwnedStructure.prototype);
    StructureNuker.prototype.constructor = StructureNuker;

    utils.defineGameObjectProperties(StructureNuker.prototype, data, {
        energy: (o: any) => o.store ? o.store.energy : 0,
        energyCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.energy : 0,
        ghodium: (o: any) => o.store ? o.store.G : 0,
        ghodiumCapacity: (o: any) => o.storeCapacityResource ? o.storeCapacityResource.G : 0,
        cooldown: (o: any) => o.cooldownTime && o.cooldownTime > runtimeData.time ? o.cooldownTime - runtimeData.time : 0,
        store: _storeGetter
    });

    StructureNuker.prototype.launchNuke = register.wrapFn(function (this: any, pos: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }
        if (runtimeData.rooms[this.room.name].novice > Date.now() || runtimeData.rooms[this.room.name].respawnArea > Date.now()) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (!(pos instanceof globals.RoomPosition)) {
            return ErrorCode.ERR_INVALID_TARGET;
        }
        if (this.cooldown > 0) {
            return ErrorCode.ERR_TIRED;
        }
        if (!utils.checkStructureAgainstController(data(this.id), register.objectsByRoom[data(this.id).room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }
        const [tx, ty] = utils.roomNameToXY(pos.roomName);
        const [x, y] = utils.roomNameToXY(data(this.id).room);

        if (Math.abs(tx - x) > ScreepsConstants.NUKE_RANGE || Math.abs(ty - y) > ScreepsConstants.NUKE_RANGE) {
            return ErrorCode.ERR_NOT_IN_RANGE;
        }
        if (this.energy < this.energyCapacity || this.ghodium < this.ghodiumCapacity) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        intents.set(this.id, 'launchNuke', { roomName: pos.roomName, x: pos.x, y: pos.y });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureNuker', { enumerable: true, value: StructureNuker });


    /**
     * StructurePortal
     * @param id
     * @constructor
     */
    const StructurePortal = register.wrapFn(function (this: any, id: any) {
        Structure.call(this, id);
    });
    StructurePortal.prototype = Object.create(Structure.prototype);
    StructurePortal.prototype.constructor = StructurePortal;

    utils.defineGameObjectProperties(StructurePortal.prototype, data, {
        destination: (o: any) => {
            if (o.destination.shard) {
                return {
                    shard: o.destination.shard,
                    room: o.destination.room
                };
            }
            else {
                return new globals.RoomPosition(o.destination.x, o.destination.y, o.destination.room);
            }
        },
        ticksToDecay: (o: any) => o.decayTime ? o.decayTime - runtimeData.time : undefined
    });

    Object.defineProperty(globals, 'StructurePortal', { enumerable: true, value: StructurePortal });

    const StructureFactory = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureFactory.prototype = Object.create(OwnedStructure.prototype);
    StructureFactory.prototype.constructor = StructureFactory;

    utils.defineGameObjectProperties(StructureFactory.prototype, data, {
        level: (o: any) => o.level,
        store: _storeGetter,
        storeCapacity: (o: any) => o.storeCapacity,
        cooldown: (o: any) => o.cooldownTime && o.cooldownTime > runtimeData.time ? o.cooldownTime - runtimeData.time : 0
    });

    StructureFactory.prototype.produce = register.wrapFn(function (this: any, resourceType: any) {
        if (!this.my) {
            return ErrorCode.ERR_NOT_OWNER;
        }

        if (this.cooldown > 0) {
            return ErrorCode.ERR_TIRED;
        }

        if (!ListItems.COMMODITIES[resourceType]) {
            return ErrorCode.ERR_INVALID_ARGS;
        }

        const rawFactory = data(this.id);
        if (!!ListItems.COMMODITIES[resourceType].level && ListItems.COMMODITIES[resourceType].level != rawFactory.level) {
            return ErrorCode.ERR_INVALID_TARGET;
        }

        if (!utils.checkStructureAgainstController(rawFactory, register.objectsByRoom[rawFactory.room], data(this.room.controller.id))) {
            return ErrorCode.ERR_RCL_NOT_ENOUGH;
        }

        if (!!ListItems.COMMODITIES[resourceType].level &&
            (rawFactory.level > 0) &&
            !_.some(rawFactory.effects, (e: any) =>
                e.power == PWRCode.PWR_OPERATE_FACTORY &&
                e.level == ListItems.COMMODITIES[resourceType].level &&
                e.endTime >= runtimeData.time)) {
            return ErrorCode.ERR_BUSY;
        }

        if (_.some(_.keys(ListItems.COMMODITIES[resourceType].components), p => (rawFactory.store[p] || 0) < ListItems.COMMODITIES[resourceType].components[p])) {
            return ErrorCode.ERR_NOT_ENOUGH_RESOURCES;
        }

        if (!rawFactory.storeCapacity || (utils.calcResources(rawFactory) - utils.calcResources(ListItems.COMMODITIES[resourceType].components) + (ListItems.COMMODITIES[resourceType].amount || 1) > rawFactory.storeCapacity)) {
            return ErrorCode.ERR_FULL;
        }

        intents.set(this.id, 'produce', { resourceType });
        return ErrorCode.OK;
    });

    Object.defineProperty(globals, 'StructureFactory', { enumerable: true, value: StructureFactory });

    const StructureInvaderCore = register.wrapFn(function (this: any, id: any) {
        OwnedStructure.call(this, id);
    });
    StructureInvaderCore.prototype = Object.create(OwnedStructure.prototype);
    StructureInvaderCore.prototype.constructor = StructureInvaderCore;

    utils.defineGameObjectProperties(StructureInvaderCore.prototype, data, {
        level: (o: any) => o.level,
        ticksToDeploy: (o: any) => o.deployTime ? o.deployTime - runtimeData.time : undefined
    });

    StructureInvaderCore.prototype.toString = register.wrapFn(function (this: any) {
        return `[invaderCore ${'#' + this.id}]`;
    });

    Object.defineProperty(globals, 'StructureInvaderCore', { enumerable: true, value: StructureInvaderCore });
}
