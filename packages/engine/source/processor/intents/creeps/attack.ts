import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, scope) => {

    let {roomObjects, roomController, gameTime} = scope;

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    let target = roomObjects[intent.id];
    if(!target || target == object) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(target.type == 'creep' && target.spawning) {
        return;
    }
    if(!target.hits) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }
    const rampart = _.find(roomObjects, {type: 'rampart', x: target.x, y: target.y});
    if(rampart) {
        target = rampart;
    }

    const attackPower = utils.calcBodyEffectiveness(object.body, C.ATTACK, 'attack', C.ATTACK_POWER);

    require('../_damage')(object, target, attackPower, C.EVENT_ATTACK_TYPE_MELEE, scope);

    object._attack = true;


};