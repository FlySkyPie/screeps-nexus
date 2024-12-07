import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, scope) => {
    const {roomObjects, roomTerrain, bulk, roomController, gameTime} = scope;

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    let target = roomObjects[intent.id];
    if(!target || !C.CONSTRUCTION_COST[target.type]) {
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


    const power = utils.calcBodyEffectiveness(object.body, C.WORK, 'dismantle', C.DISMANTLE_POWER);
    const amount = Math.min(power, target.hits);
    let energyGain = Math.floor(amount * C.DISMANTLE_COST);

    const effect = _.find(target.effects, e => e.endTime >= gameTime && (e.power == C.PWR_SHIELD || e.power == C.PWR_FORTIFY || e.effect == C.EFFECT_INVULNERABILITY));
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

        require('../_damage')(object, target, amount, C.EVENT_ATTACK_TYPE_DISMANTLE, scope);
    }
};
