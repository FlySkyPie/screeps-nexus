import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';
import { Resource } from '@screeps/common/src/constants/resource';
import { Reactions } from '@screeps/common/src/constants/reactions';
import { ReactionTime } from '@screeps/common/src/constants/reaction-time';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';

export default (object: any, intent: any, { roomObjects, bulk, gameTime }: any) => {

    if (!!object.cooldownTime && object.cooldownTime > gameTime) {
        return;
    }

    let reactionAmount = ScreepsConstants.LAB_REACTION_AMOUNT;
    const effect: any = _.find(object.effects, { power: PWRCode.PWR_OPERATE_LAB });
    if (effect && effect.endTime > gameTime) {
        reactionAmount += POWER_INFO[PWRCode.PWR_OPERATE_LAB].effect[effect.level - 1];
    }

    const lab1 = roomObjects[intent.lab1];
    const _l1 = _.filter(_.keys(lab1.store), k =>
        k != Resource.RESOURCE_ENERGY &&
        lab1.store[k])
    const lab1MineralType = _.first(_l1);
    if (!lab1 || lab1.type != 'lab' || !lab1MineralType || lab1.store[lab1MineralType] < reactionAmount) {
        return;
    }
    if (Math.abs(lab1.x - object.x) > 2 || Math.abs(lab1.y - object.y) > 2) {
        return;
    }

    const lab2 = roomObjects[intent.lab2];
    const _l2 = _.filter(_.keys(lab2.store), k =>
        k != Resource.RESOURCE_ENERGY &&
        lab2.store[k]);
    const lab2MineralType = _.first(_l2);
    if (!lab2 || lab2.type != 'lab' || !lab2MineralType || lab2.store[lab2MineralType] < reactionAmount) {
        return;
    }
    if (Math.abs(lab2.x - object.x) > 2 || Math.abs(lab2.y - object.y) > 2) {
        return;
    }

    const _a = _.filter(_.keys(object.store), k => k != Resource.RESOURCE_ENERGY && object.store[k]);
    const mineralType = _.first(_a);
    if ((object.store[mineralType] || 0) + reactionAmount > ScreepsConstants.LAB_MINERAL_CAPACITY) {
        return;
    }

    const product = (Reactions as any)[lab1MineralType][lab2MineralType];

    if (!product || mineralType && mineralType != product) {
        return;
    }

    if (object.storeCapacityResource[product]) {
        bulk.update(object, {
            store: { [product]: (object.store[product] || 0) + reactionAmount },
            cooldownTime: gameTime + ReactionTime[product]
        });
    } else {
        bulk.update(object, {
            store: { [product]: (object.store[product] || 0) + reactionAmount },
            cooldownTime: gameTime + ReactionTime[product],
            storeCapacityResource: { [product]: ScreepsConstants.LAB_MINERAL_CAPACITY },
            storeCapacity: null
        });
    }

    lab1.store[lab1MineralType] -= reactionAmount;
    if (lab1.store[lab1MineralType]) {
        bulk.update(lab1, { store: { [lab1MineralType]: lab1.store[lab1MineralType] } });
    } else {
        bulk.update(lab1, {
            store: { [lab1MineralType]: lab1.store[lab1MineralType] },
            storeCapacityResource: { [lab1MineralType]: null },
            storeCapacity: ScreepsConstants.LAB_ENERGY_CAPACITY + ScreepsConstants.LAB_MINERAL_CAPACITY
        });
    }
    lab2.store[lab2MineralType] -= reactionAmount;
    if (lab2.store[lab2MineralType]) {
        bulk.update(lab2, { store: { [lab2MineralType]: lab2.store[lab2MineralType] } });
    } else {
        bulk.update(lab2, {
            store: { [lab2MineralType]: lab2.store[lab2MineralType] },
            storeCapacityResource: { [lab2MineralType]: null },
            storeCapacity: ScreepsConstants.LAB_ENERGY_CAPACITY + ScreepsConstants.LAB_MINERAL_CAPACITY
        });
    }

    object.actionLog.runReaction = { x1: lab1.x, y1: lab1.y, x2: lab2.x, y2: lab2.y };
};
