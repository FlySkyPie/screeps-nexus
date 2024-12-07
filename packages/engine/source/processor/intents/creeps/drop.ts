import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    const {bulk} = scope;

    if(!_.contains(ScreepsConstants.RESOURCES_ALL, intent.resourceType)) {
        return;
    }
    if(object.spawning || !object.store || !(object.store[intent.resourceType] >= intent.amount) ) {
        return;
    }

    if(intent.amount > 0) {
        object.store[intent.resourceType] -= intent.amount;
        require('./_create-energy')(object.x, object.y, object.room, intent.amount, intent.resourceType, scope);
    }

    bulk.update(object, {store:{[intent.resourceType]: object.store[intent.resourceType]}});
};
