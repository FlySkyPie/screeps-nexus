import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    const {roomObjects, bulk, stats, gameTime} = scope;

    if(object.type != 'spawn') {
        return;
    }
    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'creep' || target.user != object.user || target.spawning) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(_.filter(target.body, (i) => i.type == ScreepsConstants.CLAIM).length > 0) {
        return;
    }

    const effect = Math.floor(ScreepsConstants.SPAWN_RENEW_RATIO * ScreepsConstants.CREEP_LIFE_TIME / ScreepsConstants.CREEP_SPAWN_TIME / target.body.length);
    if(target.ageTime + effect > gameTime + ScreepsConstants.CREEP_LIFE_TIME) {
        return;
    }

    const cost = Math.ceil(ScreepsConstants.SPAWN_RENEW_RATIO * utils.calcCreepCost(target.body) / ScreepsConstants.CREEP_SPAWN_TIME / target.body.length);
    const result = require('./_charge-energy')(object, cost, undefined, scope);

    if(!result) {
        return;
    }

    stats.inc('energyCreeps', object.user, cost);

    target.actionLog.healed = {x: object.x, y: object.y};
    bulk.inc(target, 'ageTime', effect);

    if(_.any(target.body, i => !!i.boost)) {
        target.body.forEach(i => {
            i.boost = null;
        });
        require('../creeps/_recalc-body')(target);
        // we may not be able to hold all of the resources we could before now.
        require('../creeps/_drop-resources-without-space')(target, scope);
        bulk.update(target, {body: target.body, storeCapacity: target.storeCapacity});
    }

};
