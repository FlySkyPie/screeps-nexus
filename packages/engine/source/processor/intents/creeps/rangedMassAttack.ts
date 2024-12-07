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

    const attackPower = utils.calcBodyEffectiveness(object.body, ScreepsConstants.RANGED_ATTACK, 'rangedMassAttack', ScreepsConstants.RANGED_ATTACK_POWER);

    if(attackPower == 0) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }

    const targets = _.filter(roomObjects, (i) => {
        return (!_.isUndefined(i.user) || i.type == 'powerBank') && i.user != object.user &&
            i.x >= object.x - 3 && i.x <= object.x + 3 &&
            i.y >= object.y - 3 && i.y <= object.y + 3;
    });

    const distanceRate = {0: 1, 1: 1, 2: 0.4, 3: 0.1};

    for(const i in targets) {

        const target = targets[i];

        if(target.type != 'rampart' && _.find(roomObjects, {type: 'rampart', x: target.x, y: target.y})) {
            continue;
        }
        if(!target.hits) {
            continue;
        }
        if(target.type == 'creep' && target.spawning) {
            continue;
        }
        if(_.some(target.effects, e => e.endTime >= gameTime && (e.power == ScreepsConstants.PWR_FORTIFY || e.effect == ScreepsConstants.EFFECT_INVULNERABILITY))) {
            continue;
        }

        const distance = Math.max(Math.abs(object.x - target.x), Math.abs(object.y - target.y));

        const targetAttackPower = Math.round(attackPower * distanceRate[distance]);

        require('../_damage')(object, target, targetAttackPower, ScreepsConstants.EVENT_ATTACK_TYPE_MASS_RANGED, scope);
    }

    object.actionLog.rangedMassAttack = {};
};
