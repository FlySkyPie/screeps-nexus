import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';

export default (object: any, intent: any, scope: any) => {

    const { bulk } = scope;

    if (!_.contains(ListItems.RESOURCES_ALL, intent.resourceType)) {
        return;
    }
    if (object.spawning || !object.store || !(object.store[intent.resourceType] >= intent.amount)) {
        return;
    }

    if (intent.amount > 0) {
        object.store[intent.resourceType] -= intent.amount;
        require('./_create-energy')(object.x, object.y, object.room, intent.amount, intent.resourceType, scope);
    }

    bulk.update(object, { store: { [intent.resourceType]: object.store[intent.resourceType] } });
};
