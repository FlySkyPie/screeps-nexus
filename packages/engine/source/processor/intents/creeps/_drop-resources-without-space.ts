import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default function dropResourcesWithoutSpace(object, scope) {
    for(let i=0; i<ScreepsConstants.RESOURCES_ALL.length; i++) {
        const resourceType = ScreepsConstants.RESOURCES_ALL[i];
        const totalAmount = utils.calcResources(object);
        if(totalAmount <= object.storeCapacity) {
            break;
        }
        if(object.store[resourceType]) {
            require('./drop')(object, {amount: Math.min(object.store[resourceType], totalAmount - object.storeCapacity), resourceType}, scope);
        }
    }
};
