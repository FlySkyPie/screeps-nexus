import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';

import * as utils from '../../../utils';

export default (object: any, scope: any) => {

    const { roomObjects, bulk, roomController, energyAvailable, gameTime } = scope;

    if (!object || object.type != 'spawn') return;

    const effect: any = _.find(object.effects, { power: PWRCode.PWR_DISRUPT_SPAWN });

    if (object.spawning && (!effect || effect.endTime <= gameTime)) {
        object.spawning.remainingTime--;

        if (object.spawning.remainingTime <= 0) {

            const spawningCreep = _.find(roomObjects, { type: 'creep', name: object.spawning.name, x: object.x, y: object.y });

            const bornOk = require('./_born-creep')(object, spawningCreep, scope);

            if (bornOk) {
                bulk.update(object, { spawning: null });
            }
            else {
                bulk.update(object, { spawning: { remainingTime: 0 } });
            }
        }
        else {
            bulk.update(object, { spawning: { remainingTime: object.spawning.remainingTime } });
        }
    }

    if (!roomController || roomController.level < 1 || roomController.user != object.user) {
        return;
    }
    let spawns = _.filter(roomObjects, { type: 'spawn' });
    if (spawns.length > ScreepsConstants.CONTROLLER_STRUCTURES.spawn[roomController.level]) {
        spawns.sort(utils.comparatorDistance(roomController));
        spawns = _.take(spawns, ScreepsConstants.CONTROLLER_STRUCTURES.spawn[roomController.level]);
        if (!_.contains(spawns, object)) {
            return;
        }
    }

    if (!object.tutorial && energyAvailable < ScreepsConstants.SPAWN_ENERGY_CAPACITY && object.store.energy < ScreepsConstants.SPAWN_ENERGY_CAPACITY) {
        object.store.energy++;
        bulk.update(object, { store: { energy: object.store.energy } });
    }

};
