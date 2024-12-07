import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';

export default (object: any, intent: any, { roomObjects, bulk, gameTime, eventLog }: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if (target.user || target.reservation && target.reservation.user != object.user) {
        return;
    }

    const effect = _.filter(object.body, (i: any) =>
        i.hits > 0 &&
        i.type == BodyParts.CLAIM).length * ScreepsConstants.CONTROLLER_RESERVE;
    if (!effect) {
        return;
    }

    if (!target.reservation) {
        target.reservation = {
            user: object.user,
            endTime: gameTime + 1
        };
    }


    if (target.reservation.endTime + effect > gameTime + ScreepsConstants.CONTROLLER_RESERVE_MAX) {
        return;
    }

    object.actionLog.reserveController = { x: target.x, y: target.y };

    target.reservation.endTime += effect;
    bulk.update(target, { reservation: target.reservation });

    eventLog.push({
        event: EventCode.EVENT_RESERVE_CONTROLLER,
        objectId: object._id,
        data: {
            amount: effect
        }
    });
};
