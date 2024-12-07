import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, roomController, gameTime, eventLog}) => {

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || (target.type != 'creep'  && target.type != 'powerCreep') || target.spawning) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }

    const healPower = utils.calcBodyEffectiveness(object.body, C.HEAL, 'heal', C.HEAL_POWER);

    target._healToApply = (target._healToApply || 0) + healPower;

    object.actionLog.heal = {x: target.x, y: target.y};
    target.actionLog.healed = {x: object.x, y: object.y};

    eventLog.push({event: C.EVENT_HEAL, objectId: object._id, data: {targetId: target._id, amount: healPower, healType: C.EVENT_HEAL_TYPE_MELEE}});
};