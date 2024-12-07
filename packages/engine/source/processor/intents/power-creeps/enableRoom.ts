import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, bulk, gameTime}) => {

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(target.user != object.user && target.safeMode > gameTime) {
        return;
    }
    if(utils.dist(object, target) > 1) {
        return;
    }

    bulk.update(target, {isPowerEnabled: true});

    object.actionLog.attack = {x: target.x, y: target.y};
};