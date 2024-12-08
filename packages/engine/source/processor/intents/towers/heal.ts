import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { EventCode } from '@screeps/common/src/constants/event-code';

export default (object: any, intent: any, { roomObjects, bulk, eventLog, gameTime }: any) => {

    if (!object || object.type != 'tower' || !object.store) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'creep' && target.type !== 'powerCreep') {
        return;
    }
    if (target.spawning) {
        return;
    }
    if (object.store.energy < ScreepsConstants.TOWER_ENERGY_COST) {
        return;
    }

    let range = Math.max(Math.abs(target.x - object.x), Math.abs(target.y - object.y));
    let amount = ScreepsConstants.TOWER_POWER_HEAL;
    if (range > ScreepsConstants.TOWER_OPTIMAL_RANGE) {
        if (range > ScreepsConstants.TOWER_FALLOFF_RANGE) {
            range = ScreepsConstants.TOWER_FALLOFF_RANGE;
        }
        amount -= amount * ScreepsConstants.TOWER_FALLOFF * (range - ScreepsConstants.TOWER_OPTIMAL_RANGE) / (ScreepsConstants.TOWER_FALLOFF_RANGE - ScreepsConstants.TOWER_OPTIMAL_RANGE);
    }
    [PWRCode.PWR_OPERATE_TOWER, PWRCode.PWR_DISRUPT_TOWER].forEach(power => {
        const effect: any = _.find(object.effects, { power });
        if (effect && effect.endTime > gameTime) {
            amount *= POWER_INFO[power].effect[effect.level - 1];
        }
    });
    amount = Math.floor(amount);

    if (!amount) {
        return;
    }

    target._healToApply = (target._healToApply || 0) + amount;

    object.store.energy -= ScreepsConstants.TOWER_ENERGY_COST;
    bulk.update(object, { store: { energy: object.store.energy } });

    object.actionLog.heal = { x: target.x, y: target.y };
    target.actionLog.healed = { x: object.x, y: object.y };

    eventLog.push({
        event: EventCode.EVENT_HEAL,
        objectId: object._id,
        data: {
            targetId: target._id,
            amount: amount,
            healType: ScreepsConstants.EVENT_HEAL_TYPE_RANGED
        }
    });

};
