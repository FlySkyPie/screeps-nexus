import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    const {roomObjects} = scope;

    if(object.type != 'spawn') {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'creep' || target.user != object.user || target.spawning) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    require('../creeps/_die')(target, 1.0, false, scope);
};