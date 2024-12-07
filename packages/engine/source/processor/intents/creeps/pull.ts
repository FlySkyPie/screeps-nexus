import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

import movement from '../movement';

export default (object, intent, {roomObjects}) => {
    if(object.type != 'creep' || object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'creep' || target.spawning) {
        return;
    }

    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    movement.addPulling(object, target);
};
