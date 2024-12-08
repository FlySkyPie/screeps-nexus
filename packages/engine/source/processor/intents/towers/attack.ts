import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { EventAttackType } from '@screeps/common/src/constants/event-attack-type';

import * as utils from '../../../utils';

import _damage from '../_damage';

export default (object: any, intent: any, scope: any) => {

    let { roomObjects, bulk, roomController, gameTime } = scope;

    if (!object || object.type != 'tower' || !object.store) {
        return;
    }

    let target = roomObjects[intent.id];
    if (!target || target == object) {
        return;
    }
    if (target.type == 'creep' && target.spawning) {
        return;
    }
    if (!target.hits) {
        return;
    }
    if (object.store.energy < ScreepsConstants.TOWER_ENERGY_COST) {
        return;
    }
    const rampart = _.find(roomObjects, { type: 'rampart', x: target.x, y: target.y });
    if (rampart) {
        target = rampart;
    }

    let range = Math.max(Math.abs(target.x - object.x), Math.abs(target.y - object.y));
    let amount = ScreepsConstants.TOWER_POWER_ATTACK;
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

    _damage(object, target, amount, EventAttackType.EVENT_ATTACK_TYPE_RANGED, scope);

    object.store.energy -= ScreepsConstants.TOWER_ENERGY_COST;
    bulk.update(object, { store: { energy: object.store.energy } });


    object.actionLog.attack = { x: target.x, y: target.y };
    if (target.actionLog) {
        target.actionLog.attacked = { x: object.x, y: object.y };
    }

    if (target.notifyWhenAttacked) {
        utils.sendAttackingNotification(target, roomController);
    }
};
