import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';

import * as utils from '../../../utils';

export default (object: any, intent: any, scope: any) => {
    const { roomObjects, bulk, roomController, stats, eventLog, gameTime } = scope;

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target) {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    if (target.type == 'source') {

        if (!target.energy) {
            return;
        }

        if (roomController && (roomController.user && roomController.user != object.user || roomController.reservation && roomController.reservation.user != object.user)) {
            return;
        }

        let harvestAmount = utils.calcBodyEffectiveness(object.body, BodyParts.WORK, 'harvest', ScreepsConstants.HARVEST_POWER);

        if (harvestAmount) {

            let amount = Math.min(target.energy, harvestAmount);

            target.energy -= amount;
            object.store = object.store || {};
            object.store.energy = (object.store.energy || 0) + amount;

            let invaderHarvested = (target.invaderHarvested || 0) + amount;

            bulk.update(object, { store: { energy: object.store.energy } });
            bulk.update(target, { energy: target.energy, invaderHarvested });

            let sum = utils.calcResources(object);

            if (sum > object.storeCapacity) {
                require('./drop')(object, {
                    amount: Math.min(object.store.energy, sum - object.storeCapacity),
                    resourceType: 'energy'
                }, scope);
            }

            object.actionLog.harvest = { x: target.x, y: target.y };

            stats.inc('energyHarvested', object.user, amount);

            eventLog.push({ event: EventCode.EVENT_HARVEST, objectId: object._id, data: { targetId: target._id, amount } });
        }
    }

    if (target.type == 'mineral') {

        if (!target.mineralAmount) {
            return;
        }

        const extractor: any = _.find(roomObjects, (i: any) =>
            i.type == StructureEnum.STRUCTURE_EXTRACTOR &&
            i.x == target.x &&
            i.y == target.y);

        if (!extractor) {
            return;
        }
        if (extractor.user && extractor.user != object.user) {
            return;
        }
        if (!utils.checkStructureAgainstController(extractor, roomObjects, roomController)) {
            return;
        }
        if (extractor.cooldown) {
            return;
        }

        let harvestAmount = utils.calcBodyEffectiveness(object.body, BodyParts.WORK, 'harvest', ScreepsConstants.HARVEST_MINERAL_POWER);

        if (harvestAmount) {

            let amount = Math.min(target.mineralAmount, harvestAmount);
            object.store = object.store || {};
            bulk.update(target, { mineralAmount: target.mineralAmount - amount });
            bulk.update(object, { store: { [target.mineralType]: (object.store[target.mineralType] || 0) + amount } });

            let sum = utils.calcResources(object);

            if (sum > object.storeCapacity) {
                require('./drop')(object, {
                    amount: Math.min(object.store[target.mineralType], sum - object.storeCapacity),
                    resourceType: target.mineralType
                }, scope);
            }

            object.actionLog.harvest = { x: target.x, y: target.y };

            extractor._cooldown = ScreepsConstants.EXTRACTOR_COOLDOWN;

            eventLog.push({
                event: EventCode.EVENT_HARVEST,
                objectId: object._id,
                data: {
                    targetId: target._id,
                    amount: harvestAmount
                }
            });
        }
    }

    if (target.type == 'deposit') {
        if (target.cooldownTime && target.cooldownTime > gameTime) {
            return;
        }

        const amount = utils.calcBodyEffectiveness(object.body, BodyParts.WORK, 'harvest', ScreepsConstants.HARVEST_DEPOSIT_POWER);
        bulk.update(object, { store: { [target.depositType]: (object.store[target.depositType] || 0) + amount } });

        let sum = utils.calcResources(object);

        if (sum > object.storeCapacity) {
            require('./drop')(object, {
                amount: Math.min(object.store[target.depositType], sum - object.storeCapacity),
                resourceType: target.depositType
            }, scope);
        }

        object.actionLog.harvest = { x: target.x, y: target.y };

        bulk.inc(target, 'harvested', amount);
        const cooldown = Math.ceil(ScreepsConstants.DEPOSIT_EXHAUST_MULTIPLY * Math.pow(target.harvested, ScreepsConstants.DEPOSIT_EXHAUST_POW));
        if (cooldown > 1) {
            target._cooldown = cooldown;
        }
        bulk.update(target, { decayTime: ScreepsConstants.DEPOSIT_DECAY_TIME + gameTime });
    }
};
