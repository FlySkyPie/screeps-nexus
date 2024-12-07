import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {
    const {roomObjects, roomTerrain, bulk, roomController, gameTime} = scope;

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    let target = roomObjects[intent.id];
    if(!target || !ScreepsConstants.CONSTRUCTION_COST[target.type]) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }
    const rampart = _.find(roomObjects, {type: 'rampart', x: target.x, y: target.y});
    if(rampart) {
        target = rampart;
    }


    const power = utils.calcBodyEffectiveness(object.body, ScreepsConstants.WORK, 'dismantle', ScreepsConstants.DISMANTLE_POWER);
    const amount = Math.min(power, target.hits);
    let energyGain = Math.floor(amount * ScreepsConstants.DISMANTLE_COST);

    const effect = _.find(target.effects, e => e.endTime >= gameTime && (e.power == ScreepsConstants.PWR_SHIELD || e.power == ScreepsConstants.PWR_FORTIFY || e.effect == ScreepsConstants.EFFECT_INVULNERABILITY));
    if(effect) {
        energyGain = 0;
    }

    if(amount) {
        object.store = object.store || {};
        object.store.energy += energyGain;
        bulk.update(object, {store:{energy: object.store.energy}});

        const usedSpace = utils.calcResources(object);
        if (usedSpace > object.storeCapacity) {
            require('./drop')(object, {amount: usedSpace - object.storeCapacity, resourceType: 'energy'}, scope);
        }

        require('../_damage')(object, target, amount, ScreepsConstants.EVENT_ATTACK_TYPE_DISMANTLE, scope);
    }
};
