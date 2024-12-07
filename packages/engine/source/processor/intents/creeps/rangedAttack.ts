import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { BodyParts } from '@screeps/common/src/constants/body-parts';
import { EventAttackType } from '@screeps/common/src/constants/event-attack-type';

import * as utils from '../../../utils';

export default (object: any, intent: any, scope: any) => {

    const { roomObjects, roomController, gameTime } = scope;

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    let target = roomObjects[intent.id];
    if (!target || target == object) {
        return;
    }
    if (Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
        return;
    }
    if (target.type == 'creep' && target.spawning) {
        return;
    }
    if (!target.hits) {
        return;
    }
    if (roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }
    const rampart = _.find(roomObjects, { type: 'rampart', x: target.x, y: target.y });
    if (rampart) {
        target = rampart;
    }


    const attackPower = utils.calcBodyEffectiveness(object.body, BodyParts.RANGED_ATTACK, 'rangedAttack', ScreepsConstants.RANGED_ATTACK_POWER);

    require('../_damage')(object, target, attackPower, EventAttackType.EVENT_ATTACK_TYPE_RANGED, scope);

};
