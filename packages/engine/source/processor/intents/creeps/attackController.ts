import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, bulk, roomController, gameTime, eventLog}) => {

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(!target.user && !target.reservation) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime ||
        roomController.upgradeBlocked > gameTime) {
        return;
    }
    if(_.any(target.effects, e => e.effect == C.EFFECT_INVULNERABILITY && e.endTime > gameTime)) {
        return;
    }

    if(target.reservation) {
        var effect = Math.floor(_.filter(object.body, (i) => i.hits > 0 && i.type == C.CLAIM).length * C.CONTROLLER_RESERVE);
        if(!effect) {
            return;
        }
        const endTime = target.reservation.endTime - effect;
        bulk.update(target, {reservation: {endTime}});
    }
    if(target.user) {
        var effect = Math.floor(_.filter(object.body, (i) => i.hits > 0 && i.type == C.CLAIM).length * C.CONTROLLER_CLAIM_DOWNGRADE);
        if(!effect) {
            return;
        }
        const downgradeTime = target.downgradeTime - effect;
        bulk.update(target, {downgradeTime});
        target._upgradeBlocked = gameTime + C.CONTROLLER_ATTACK_BLOCKED_UPGRADE;
    }
    object.actionLog.attack = {x: target.x, y: target.y};

    eventLog.push({event: C.EVENT_ATTACK_CONTROLLER, objectId: object._id})
};