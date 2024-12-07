import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';
import { Boosts } from '@screeps/common/src/constants/boosts';

export default (object: any, intent: any, { roomObjects, bulk, stats, eventLog }: any) => {
    if (object.type != 'creep') {
        return;
    }
    if (object.spawning || !object.store || object.store.energy <= 0) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || !target.hitsMax || !ScreepsConstants.CONSTRUCTION_COST[target.type] || target.hits >= target.hitsMax) {
        return;
    }
    if (Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
        return;
    }

    const repairPower = _.filter(object.body, (i: any) =>
        (i.hits > 0 || i._oldHits > 0) &&
        i.type == BodyParts.WORK).length * ScreepsConstants.REPAIR_POWER ||
        0;
    const repairEnergyRemaining = object.store.energy / ScreepsConstants.REPAIR_COST;
    const repairHitsMax = target.hitsMax - target.hits;
    const repairEffect = Math.min(repairPower, repairEnergyRemaining, repairHitsMax);
    const repairCost = Math.min(object.store.energy, Math.ceil(repairEffect * ScreepsConstants.REPAIR_COST));

    let boostedParts = _.map(object.body, (i: any) => {
        if (i.type == BodyParts.WORK &&
            i.boost &&
            (Boosts as any)[BodyParts.WORK][i.boost].repair > 0) {
            return ((Boosts as any)[BodyParts.WORK][i.boost].repair - 1) * ScreepsConstants.REPAIR_POWER;
        }
        return 0;
    });

    boostedParts.sort((a, b) => b - a);
    boostedParts = boostedParts.slice(0, repairEffect);

    const boostedEffect = Math.min(Math.floor(repairEffect + _.sum(boostedParts)), repairHitsMax);

    if (!boostedEffect) {
        return;
    }

    target.hits += boostedEffect;
    object.store.energy -= repairCost;

    stats.inc('energyConstruction', object.user, repairCost);

    if (target.hits > target.hitsMax) {
        target.hits = target.hitsMax;
    }

    object.actionLog.repair = { x: target.x, y: target.y };

    bulk.update(target, { hits: target.hits });
    bulk.update(object, { store: { energy: object.store.energy } });

    eventLog.push({
        event: EventCode.EVENT_REPAIR,
        objectId: object._id,
        data: {
            targetId: target._id,
            amount: boostedEffect,
            energySpent: repairCost
        }
    });
};
