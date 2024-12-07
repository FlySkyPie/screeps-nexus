import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    const {roomObjects, roomController, gameTime} = scope;

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
    if(Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
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


    const attackPower = utils.calcBodyEffectiveness(object.body, ScreepsConstants.RANGED_ATTACK, 'rangedAttack', ScreepsConstants.RANGED_ATTACK_POWER);

    require('../_damage')(object, target, attackPower, ScreepsConstants.EVENT_ATTACK_TYPE_RANGED, scope);

};