import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as utils from '../../../utils';

import * as movement from '../movement';

export default (object: any, intent: any, { roomObjects }: any) => {

    if (object.spawning) {
        return;
    }

    object._oldFatigue = object.fatigue;

    let d = null;
    if (intent.direction) {
        d = utils.getOffsetsByDirection(intent.direction);
    }
    if (intent.id) {
        const creep = roomObjects[intent.id];
        if (creep && creep.type == 'creep' && utils.dist(object, creep) == 1) {
            d = [creep.x - object.x, creep.y - object.y];
        }
    }

    if (!d) {
        return;
    }

    const [dx, dy] = d;

    if (object.x + dx < 0 || object.x + dx > 49 || object.y + dy < 0 || object.y + dy > 49) {
        return;
    }

    const targetObjects = _.filter(roomObjects, _.matches({ x: object.x + dx, y: object.y + dy }));

    if (!_.any(targetObjects, (target: any) => _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, target.type) &&
        target.type != 'creep' && target.type != 'powerCreep' ||
        target.type == 'rampart' && !target.isPublic && object.user != target.user ||
        object.type == 'powerCreep' && target.type == 'portal' && target.destination.shard)) {

        movement.add(object, dx, dy);
    }
};
