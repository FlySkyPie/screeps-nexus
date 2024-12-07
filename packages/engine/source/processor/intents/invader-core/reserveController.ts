import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventCode } from '@screeps/common/src/constants/event-code';

export default (object: any, intent: any, scope: any) => {
    const { roomObjects, bulk, gameTime, eventLog } = scope;

    if (object.type != 'invaderCore') {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }

    if (target.user || target.reservation && target.reservation.user != object.user) {
        return;
    }

    if (!target.reservation) {
        target.reservation = {
            user: object.user,
            endTime: gameTime + 1
        };
    }

    const effect = ScreepsConstants.INVADER_CORE_CONTROLLER_POWER * ScreepsConstants.CONTROLLER_RESERVE;
    if (target.reservation.endTime + effect > gameTime + ScreepsConstants.CONTROLLER_RESERVE_MAX) {
        return;
    }

    object.actionLog.reserveController = { x: target.x, y: target.y };

    target.reservation.endTime += effect;
    bulk.update(target, { reservation: target.reservation });

    eventLog.push({ event: EventCode.EVENT_RESERVE_CONTROLLER, objectId: object._id, data: { amount: effect } });
};
