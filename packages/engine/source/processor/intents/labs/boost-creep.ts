import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { Boosts } from '@screeps/common/src/constants/boosts';
import { Resource } from '@screeps/common/src/constants/resource';

import _recalcBody from '../creeps/_recalc-body';

export default (object: any, intent: any, { roomObjects, bulk }: any) => {
    if (!object || !object.store) {
        return;
    }

    const _a =  _.filter(_.keys(object.store),k => k != Resource.RESOURCE_ENERGY && object.store[k]);
    const mineralType = _.first(_a);
    if (!mineralType) {
        return;
    }
    if (object.store[mineralType] < ScreepsConstants.LAB_BOOST_MINERAL ||
        object.store.energy < ScreepsConstants.LAB_BOOST_ENERGY) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'creep' || target.spawning) {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    let nonBoostedParts: any = _.filter(target.body, (i: any) =>
        !i.boost &&
        (Boosts as any)[i.type] &&
        (Boosts as any)[i.type][mineralType]);

    if (!nonBoostedParts.length) {
        return;
    }

    if (nonBoostedParts[0].type != BodyParts.TOUGH) {
        nonBoostedParts.reverse();
    }

    if (intent.bodyPartsCount) {
        nonBoostedParts = nonBoostedParts.slice(0, intent.bodyPartsCount);
    }

    while (object.store[mineralType] >= ScreepsConstants.LAB_BOOST_MINERAL && object.store.energy >= ScreepsConstants.LAB_BOOST_ENERGY && nonBoostedParts.length) {
        nonBoostedParts[0].boost = mineralType;
        object.store[mineralType] -= ScreepsConstants.LAB_BOOST_MINERAL;
        object.store.energy -= ScreepsConstants.LAB_BOOST_ENERGY;
        nonBoostedParts.splice(0, 1);
    }

    if (object.store[mineralType]) {
        bulk.update(object, { store: { [mineralType]: object.store[mineralType], energy: object.store.energy } });
    } else {
        bulk.update(object, {
            store: { [mineralType]: object.store[mineralType], energy: object.store.energy },
            storeCapacityResource: { [mineralType]: null },
            storeCapacity: ScreepsConstants.LAB_ENERGY_CAPACITY + ScreepsConstants.LAB_MINERAL_CAPACITY
        });
    }

    _recalcBody(target);

    bulk.update(target, { body: target.body, storeCapacity: target.storeCapacity });
    target.actionLog.healed = { x: object.x, y: object.y };
};
