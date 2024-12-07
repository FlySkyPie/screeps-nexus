import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, scope) => {

    const {roomObjects, bulk, roomController, energyAvailable, gameTime} = scope;

    if(!object || object.type != 'spawn') return;

    const effect = _.find(object.effects, {power: C.PWR_DISRUPT_SPAWN});

    if(object.spawning && (!effect || effect.endTime <= gameTime)) {
        object.spawning.remainingTime--;

        if(object.spawning.remainingTime <= 0) {

            const spawningCreep = _.find(roomObjects, {type: 'creep', name: object.spawning.name, x: object.x, y: object.y});

            const bornOk = require('./_born-creep')(object, spawningCreep, scope);

            if(bornOk) {
                bulk.update(object, {spawning: null});
            }
            else {
                bulk.update(object, {spawning: {remainingTime: 0}});
            }
        }
        else {
            bulk.update(object, {spawning: {remainingTime: object.spawning.remainingTime}});
        }
    }

    if(!roomController || roomController.level < 1 || roomController.user != object.user) {
        return;
    }
    let spawns = _.filter(roomObjects, {type: 'spawn'});
    if(spawns.length > C.CONTROLLER_STRUCTURES.spawn[roomController.level]) {
        spawns.sort(utils.comparatorDistance(roomController));
        spawns = _.take(spawns, C.CONTROLLER_STRUCTURES.spawn[roomController.level]);
        if(!_.contains(spawns, object)) {
            return;
        }
    }

    if(!object.tutorial && energyAvailable < C.SPAWN_ENERGY_CAPACITY && object.store.energy < C.SPAWN_ENERGY_CAPACITY) {
        object.store.energy++;
        bulk.update(object, {store:{energy: object.store.energy}});
    }

};
