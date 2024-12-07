import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventCode } from '@screeps/common/src/constants/event-code';

export default (object: any, intent: any, { roomObjects, bulk, roomController, gameTime, eventLog }: any) => {

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
    if (!target.user && !target.reservation) {
        return;
    }
    if (roomController && roomController.user != object.user && roomController.safeMode > gameTime ||
        roomController.upgradeBlocked > gameTime) {
        return;
    }
    if (_.any(target.effects, (e: any) =>
        e.effect == ScreepsConstants.EFFECT_INVULNERABILITY &&
        e.endTime > gameTime)) {
        return;
    }

    if (target.reservation) {
        var effect = Math.floor(_.filter(object.body, (i: any) =>
            i.hits > 0 &&
            i.type == BodyParts.CLAIM).length * ScreepsConstants.CONTROLLER_RESERVE);
        if (!effect) {
            return;
        }
        const endTime = target.reservation.endTime - effect;
        bulk.update(target, { reservation: { endTime } });
    }
    if (target.user) {
        var effect = Math.floor(_.filter(object.body, (i: any) =>
            i.hits > 0 &&
            i.type == BodyParts.CLAIM).length * ScreepsConstants.CONTROLLER_CLAIM_DOWNGRADE);
        if (!effect) {
            return;
        }
        const downgradeTime = target.downgradeTime - effect;
        bulk.update(target, { downgradeTime });
        target._upgradeBlocked = gameTime + ScreepsConstants.CONTROLLER_ATTACK_BLOCKED_UPGRADE;
    }
    object.actionLog.attack = { x: target.x, y: target.y };

    eventLog.push({ event: EventCode.EVENT_ATTACK_CONTROLLER, objectId: object._id })
};
