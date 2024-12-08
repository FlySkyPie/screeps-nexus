import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';

import * as utils from '../../../utils';

import drop from './drop';

export default function dropResourcesWithoutSpace(object: any, scope: any) {
    for (let i = 0; i < ListItems.RESOURCES_ALL.length; i++) {
        const resourceType = ListItems.RESOURCES_ALL[i];
        const totalAmount = utils.calcResources(object);
        if (totalAmount <= object.storeCapacity) {
            break;
        }
        if (object.store[resourceType]) {
            drop(object, { amount: Math.min(object.store[resourceType], totalAmount - object.storeCapacity), resourceType }, scope);
        }
    }
};
