import _ from 'lodash';

import { EventCode } from '@screeps/common/src/constants/event-code';
import { Resource } from '@screeps/common/src/constants/resource';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, bulk, eventLog }: any) => {
    if (object.type != 'invaderCore') {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target) {
        return;
    }

    if (!_.contains(['tower', 'creep'], target.type)) {
        return;
    }
    const targetTotal = target.type == 'creep' ? utils.calcResources(target) : target.store.energy;
    const targetCapacity = target.storeCapacity || target.storeCapacityResource.energy;
    if (targetTotal == targetCapacity) {
        return;
    }

    let amount = intent.amount;
    if (targetTotal + amount > targetCapacity) {
        amount = targetCapacity - targetTotal;
    }

    target.store.energy += amount;

    object.actionLog.transferEnergy = { x: target.x, y: target.y };

    bulk.update(object, { actionLog: object.actionLog });
    bulk.update(target, { store: { energy: target.store.energy } });

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
