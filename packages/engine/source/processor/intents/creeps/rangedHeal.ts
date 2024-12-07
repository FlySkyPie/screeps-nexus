import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, roomController, gameTime, eventLog }: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || (target.type != 'creep' && target.type != 'powerCreep') || target.spawning) {
        return;
    }
    if (Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
        return;
    }
    if (roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }

    const healPower = utils.calcBodyEffectiveness(object.body, BodyParts.HEAL, 'rangedHeal', ScreepsConstants.RANGED_HEAL_POWER);

    target._healToApply = (target._healToApply || 0) + healPower;

    object.actionLog.rangedHeal = { x: target.x, y: target.y };
    target.actionLog.healed = { x: object.x, y: object.y };

    eventLog.push({ event: EventCode.EVENT_HEAL, objectId: object._id, data: { targetId: target._id, amount: healPower, healType: ScreepsConstants.EVENT_HEAL_TYPE_RANGED } });
};
