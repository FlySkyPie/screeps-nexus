import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { Resource } from '@screeps/common/src/constants/resource';

export default (object: any, intent: any, { roomObjects, bulk }: any) => {
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if (!object.store ||
        !(object.store[Resource.RESOURCE_GHODIUM] >= ScreepsConstants.SAFE_MODE_COST)) {
        return;
    }

    bulk.update(target, { safeModeAvailable: (target.safeModeAvailable || 0) + 1 });
    bulk.update(object, {
        store: {
            [Resource.RESOURCE_GHODIUM]:
                object.store[Resource.RESOURCE_GHODIUM] - ScreepsConstants.SAFE_MODE_COST
        }
    });
};
