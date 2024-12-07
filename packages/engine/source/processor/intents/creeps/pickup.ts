import _ from 'lodash';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, bulk }: any) => {

    object.store = object.store || {};
    const carry = utils.calcResources(object);

    if (object.spawning || carry >= object.storeCapacity) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'energy') {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    const resourceType = target.resourceType || 'energy';

    const amount = Math.min(object.storeCapacity - carry, target[resourceType]);

    target[resourceType] -= amount;
    object.store[resourceType] = (object.store[resourceType] || 0) + amount;

    if (!target[resourceType]) {
        bulk.remove(target._id);
        delete roomObjects[target._id];
    }
    else {
        bulk.update(target, { [resourceType]: target[resourceType] });
    }

    bulk.update(object, { store: { [resourceType]: object.store[resourceType] } });
};
