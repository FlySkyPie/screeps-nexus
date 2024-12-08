import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';

export default (object: any, { roomObjects, bulk, roomController, gameTime }: any) => {

    if (!object || object.type != 'rampart') return;

    const effect: any = _.find(object.effects, { power: PWRCode.PWR_SHIELD });
    if (effect) {
        if (effect.endTime <= gameTime) {
            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        return;
    }

    if (roomController && object.user != '2') {
        const hitsMax = object.user == roomController.user ? ScreepsConstants.RAMPART_HITS_MAX[roomController.level] || 0 : 0;
        if (hitsMax != object.hitsMax) {
            bulk.update(object, { hitsMax });
        }
    }

    if (!object.nextDecayTime || gameTime >= object.nextDecayTime - 1) {
        object.hits = object.hits || 0;
        object.hits -= ScreepsConstants.RAMPART_DECAY_AMOUNT;
        if (object.hits <= 0) {
            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        else {
            object.nextDecayTime = gameTime + ScreepsConstants.RAMPART_DECAY_TIME;
            bulk.update(object, {
                hits: object.hits,
                nextDecayTime: object.nextDecayTime
            });
        }
    }
};
