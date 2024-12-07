import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, { bulk, roomController }: any) => {

    if (!object || object.type != 'extension') return;

    if (roomController) {
        const storeCapacity = ScreepsConstants.EXTENSION_ENERGY_CAPACITY[roomController.level] || 0;
        if (!object.storeCapacityResource ||
            !object.storeCapacityResource.energy ||
            storeCapacity != object.storeCapacityResource.energy) {
            bulk.update(object, { storeCapacityResource: { energy: storeCapacity } });
        }
    }


};
