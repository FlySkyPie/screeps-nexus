import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (
    object,
    intent,
    {roomObjects, bulk, roomController, gameTime, eventLog, roomInfo}
) => {

    if(object.type != 'invaderCore') {
        return;
    }
    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(!target.user && !target.reservation) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime ||
        roomController.upgradeBlocked > gameTime) {
        return;
    }
    if(target.reservation) {
        var effect = Math.floor(C.INVADER_CORE_CONTROLLER_POWER * C.CONTROLLER_RESERVE);
        const endTime = target.reservation.endTime - effect;
        bulk.update(target, {reservation: {endTime}});
    }
    if(target.user) {
        var effect = Math.floor(C.INVADER_CORE_CONTROLLER_POWER * C.CONTROLLER_CLAIM_DOWNGRADE);
        const downgradeTime = target.downgradeTime - effect;
        bulk.update(target, {downgradeTime});
        target._upgradeBlocked = gameTime + C.CONTROLLER_ATTACK_BLOCKED_UPGRADE;
    }
    object.actionLog.reserveController = {x: target.x, y: target.y};

    roomInfo.active = true;

    eventLog.push({event: C.EVENT_ATTACK_CONTROLLER, objectId: object._id})
};