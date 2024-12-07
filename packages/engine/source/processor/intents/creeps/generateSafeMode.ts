import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, bulk}) => {

    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(!object.store || !(object.store[C.RESOURCE_GHODIUM] >= C.SAFE_MODE_COST)) {
        return;
    }

    bulk.update(target, {safeModeAvailable: (target.safeModeAvailable || 0) + 1});
    bulk.update(object, {store: {[C.RESOURCE_GHODIUM]: object.store[C.RESOURCE_GHODIUM] - C.SAFE_MODE_COST}});
};
