import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default function dropResourcesWithoutSpace(object, scope) {
    for(let i=0; i<C.RESOURCES_ALL.length; i++) {
        const resourceType = C.RESOURCES_ALL[i];
        const totalAmount = utils.calcResources(object);
        if(totalAmount <= object.storeCapacity) {
            break;
        }
        if(object.store[resourceType]) {
            require('./drop')(object, {amount: Math.min(object.store[resourceType], totalAmount - object.storeCapacity), resourceType}, scope);
        }
    }
};
