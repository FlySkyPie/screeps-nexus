import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { ListItems } from '@screeps/common/src/tables/list-items';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, bulk, eventLog }: any) => {

    const resourceType = intent.resourceType;
    if (!_.contains(ListItems.RESOURCES_ALL, resourceType)) {
        return;
    }
    if (!object || object.spawning || !object.store || !(object.store[resourceType] >= intent.amount) || intent.amount < 0) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type == 'creep' && target.spawning) {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    const targetCapacity = utils.capacityForResource(target, resourceType);

    if (!targetCapacity) {
        return;
    }

    let amount = intent.amount;

    const storedAmount = target.storeCapacityResource ? target.store[resourceType] : utils.calcResources(target);

    if (storedAmount >= targetCapacity) {
        return;
    }
    if (storedAmount + amount > targetCapacity) {
        amount = targetCapacity - storedAmount;
    }

    if (!amount) {
        return;
    }

    target.store[resourceType] = (target.store[resourceType] || 0) + amount;
    bulk.update(target, { store: { [resourceType]: target.store[resourceType] } });

    object.store[resourceType] -= amount;
    bulk.update(object, { store: { [resourceType]: object.store[resourceType] } });

    if (target.type == 'lab' && intent.resourceType != 'energy' && !target.storeCapacityResource[resourceType]) {
        bulk.update(target, {
            storeCapacityResource: { [resourceType]: ScreepsConstants.LAB_MINERAL_CAPACITY },
            storeCapacity: null
        });
    }

    eventLog.push({
        event: EventCode.EVENT_TRANSFER,
        objectId: object._id,
        data: {
            targetId: target._id,
            resourceType: resourceType,
            amount
        }
    });

};
