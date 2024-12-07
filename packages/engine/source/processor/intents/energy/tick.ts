import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {roomObjects, bulk}) => {

    if(!object || object.type != 'energy') return;

    const resourceType = object.resourceType || 'energy';

    object[resourceType] -= Math.ceil(object[resourceType] / C.ENERGY_DECAY);

    if (object[resourceType] <= 0 || !object[resourceType]) {
        if (_.isNaN(object[resourceType])) {
            console.log("Energy NaN: dropped");
        }
        bulk.remove(object._id);
        delete roomObjects[object._id];
    }
    else {
        bulk.update(object, {[resourceType]: object[resourceType]});
    }
};