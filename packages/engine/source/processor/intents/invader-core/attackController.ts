import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { EventCode } from '@screeps/common/src/constants/event-code';

export default (
    object: any,
    intent: any,
    { roomObjects, bulk, roomController, gameTime, eventLog, roomInfo }: any,
) => {

    if (object.type != 'invaderCore') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (!target.user && !target.reservation) {
        return;
    }
    if (roomController && roomController.user != object.user && roomController.safeMode > gameTime ||
        roomController.upgradeBlocked > gameTime) {
        return;
    }
    if (target.reservation) {
        var effect = Math.floor(ScreepsConstants.INVADER_CORE_CONTROLLER_POWER * ScreepsConstants.CONTROLLER_RESERVE);
        const endTime = target.reservation.endTime - effect;
        bulk.update(target, { reservation: { endTime } });
    }
    if (target.user) {
        var effect = Math.floor(ScreepsConstants.INVADER_CORE_CONTROLLER_POWER * ScreepsConstants.CONTROLLER_CLAIM_DOWNGRADE);
        const downgradeTime = target.downgradeTime - effect;
        bulk.update(target, { downgradeTime });
        target._upgradeBlocked = gameTime + ScreepsConstants.CONTROLLER_ATTACK_BLOCKED_UPGRADE;
    }
    object.actionLog.reserveController = { x: target.x, y: target.y };

    roomInfo.active = true;

    eventLog.push({
        event: EventCode.EVENT_ATTACK_CONTROLLER, objectId: object._id
    })
};