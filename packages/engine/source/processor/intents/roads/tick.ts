import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as utils from '../../../utils';

export default (object: any, { roomObjects, roomTerrain, bulk, gameTime }: any) => {

    if (!object || object.type != 'road') return;

    if (!object.nextDecayTime || gameTime >= object.nextDecayTime - 1) {
        let decayAmount = ScreepsConstants.ROAD_DECAY_AMOUNT;
        if (_.any(roomObjects, (i: any) => i.x == object.x && i.y == object.y && i.type == 'swamp') ||
            utils.checkTerrain(roomTerrain, object.x, object.y, ScreepsConstants.TERRAIN_MASK_SWAMP)) {
            decayAmount *= ScreepsConstants.CONSTRUCTION_COST_ROAD_SWAMP_RATIO;
        }
        if (_.any(roomObjects, (i: any) => i.x == object.x && i.y == object.y && i.type == 'wall') ||
            utils.checkTerrain(roomTerrain, object.x, object.y, ScreepsConstants.TERRAIN_MASK_WALL)) {
            decayAmount *= ScreepsConstants.CONSTRUCTION_COST_ROAD_WALL_RATIO;
        }
        object.hits -= decayAmount;
        if (object.hits <= 0) {
            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        else {
            object.nextDecayTime = gameTime + ScreepsConstants.ROAD_DECAY_TIME;
            bulk.update(object, {
                hits: object.hits,
                nextDecayTime: object.nextDecayTime
            });
        }
    }


};