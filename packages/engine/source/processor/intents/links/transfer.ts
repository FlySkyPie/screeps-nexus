import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { Resource } from '@screeps/common/src/constants/resource';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, bulk, roomController, eventLog }: any) => {

    if (!object || object.type != 'link') {
        return;
    }

    if (!object.store || object.store.energy < intent.amount || intent.amount < 0) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target) {
        return;
    }

    if (target.type != 'link') {
        return;
    }
    let amount = intent.amount;
    let targetTotal;

    if (object.cooldown > 0) {
        return;
    }
    if (!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }
    targetTotal = target.store.energy;

    if (!target.storeCapacityResource || !target.storeCapacityResource.energy || targetTotal == target.storeCapacityResource.energy) {
        return;
    }

    if (targetTotal + amount > target.storeCapacityResource.energy) {
        amount = target.storeCapacityResource.energy - targetTotal;
    }
    target.store.energy += amount;

    object.store.energy -= amount;

    target.store.energy -= Math.ceil(amount * ScreepsConstants.LINK_LOSS_RATIO);
    object.cooldown += ScreepsConstants.LINK_COOLDOWN * Math.max(Math.abs(target.x - object.x), Math.abs(target.y - object.y));
    object.actionLog.transferEnergy = { x: target.x, y: target.y };
    bulk.update(target, { store: { energy: target.store.energy } });

    bulk.update(object, { store: { energy: object.store.energy }, cooldown: object.cooldown, actionLog: object.actionLog });

    eventLog.push({
        event: EventCode.EVENT_TRANSFER,
        objectId: object._id,
        data: {
            targetId: target._id,
            resourceType: Resource.RESOURCE_ENERGY,
            amount
        }
    });
};
