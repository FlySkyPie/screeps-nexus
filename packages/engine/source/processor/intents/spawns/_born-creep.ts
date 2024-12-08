import _ from 'lodash';

import * as utils from '../../../utils';

import * as movement from '../movement';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (spawn: any, creep: any, scope: any) => {
    const { roomObjects, roomTerrain, bulk } = scope;

    let newX: any,
        newY: any,
        isOccupied,
        hostileOccupied;
    const checkObstacleFn = (i: any) => (i.x == newX && i.y == newY) && (
        _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, i.type) ||                                          // just unwalkable
        (i.type == 'constructionSite' && _.contains(ScreepsConstants.OBSTACLE_OBJECT_TYPES, i.structureType))  // unwalkable site
    );

    let directions = [1, 2, 3, 4, 5, 6, 7, 8];
    if (spawn.spawning && spawn.spawning.directions) {
        directions = spawn.spawning.directions;
    }
    const otherDirections = _.difference([1, 2, 3, 4, 5, 6, 7, 8], directions);
    // find the first direction where the creep can spawn
    for (var direction of directions) {
        var [dx, dy] = utils.getOffsetsByDirection(direction);

        newX = spawn.x + dx;
        newY = spawn.y + dy;
        isOccupied = _.any(roomObjects, checkObstacleFn) ||
            utils.checkTerrain(roomTerrain, newX, newY, ScreepsConstants.TERRAIN_MASK_WALL) ||
            movement.isTileBusy(newX, newY);

        if (!isOccupied) {
            break;
        }

        // remember the first direction where we found a hostile creep
        if (!hostileOccupied) {
            hostileOccupied = _.find(roomObjects, (i: any) => i.x == newX && i.y == newY && i.type == 'creep' && i.user != spawn.user);
        }
    }

    // if we found a place to spawn, do so
    if (!isOccupied) {
        bulk.update(creep, {
            x: newX,
            y: newY,
            spawning: false
        });
        return true;
    }

    // spawn is surrounded, spawnstomp the first hostile we found above, unless...
    if (hostileOccupied) {
        // bail if there's an opening we could spawn to but chose not to
        for (var direction of otherDirections) {
            var [dx, dy] = utils.getOffsetsByDirection(direction);

            newX = spawn.x + dx;
            newY = spawn.y + dy;
            isOccupied = _.any(roomObjects, checkObstacleFn) ||
                utils.checkTerrain(roomTerrain, newX, newY, ScreepsConstants.TERRAIN_MASK_WALL) ||
                movement.isTileBusy(newX, newY);

            if (!isOccupied) {
                return false;
            }
        }

        require('../creeps/_die')(hostileOccupied, undefined, true, scope);
        bulk.update(creep, {
            x: hostileOccupied.x,
            y: hostileOccupied.y,
            spawning: false
        });
        return true;
    }

    return false;
};