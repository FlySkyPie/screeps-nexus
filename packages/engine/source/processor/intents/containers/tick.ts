import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import createEnergy from '../creeps/_create-energy';

export default (object: any, scope: any) => {
    const { roomObjects, bulk, roomController, gameTime, } = scope;

    if (!object.nextDecayTime || gameTime >= object.nextDecayTime - 1) {
        object.hits = object.hits || 0;
        object.hits -= ScreepsConstants.CONTAINER_DECAY;
        if (object.hits <= 0) {
            if (object.store) {
                _.forEach(object.store, (amount, resourceType) => {
                    if (amount > 0) {
                        createEnergy(object.x, object.y, object.room,
                            amount, resourceType, scope);
                    }
                });
            }

            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        else {
            object.nextDecayTime = gameTime + (roomController && roomController.level > 0 ?
                ScreepsConstants.CONTAINER_DECAY_TIME_OWNED :
                ScreepsConstants.CONTAINER_DECAY_TIME);
            bulk.update(object, {
                hits: object.hits,
                nextDecayTime: object.nextDecayTime
            });
        }
    }
};
