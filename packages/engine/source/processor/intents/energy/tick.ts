import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import { logger } from '../../../logger';

export default (object: any, { roomObjects, bulk }: any) => {

    if (!object || object.type != 'energy') return;

    const resourceType = object.resourceType || 'energy';

    object[resourceType] -= Math.ceil(object[resourceType] / ScreepsConstants.ENERGY_DECAY);

    if (object[resourceType] <= 0 || !object[resourceType]) {
        if (_.isNaN(object[resourceType])) {
            logger.info("Energy NaN: dropped");
        }
        bulk.remove(object._id);
        delete roomObjects[object._id];
    }
    else {
        bulk.update(object, { [resourceType]: object[resourceType] });
    }
};