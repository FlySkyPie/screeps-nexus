import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, roomController, bulk, gameTime}) => {

    const target = roomObjects[intent.id];
    if(!target || target.type != 'powerBank' && target.type != 'powerSpawn') {
        return;
    }
    if(utils.dist(object, target) > 1) {
        return;
    }

    if(target.type == 'powerSpawn' && !utils.checkStructureAgainstController(target, roomObjects, roomController)) {
        return;
    }

    bulk.update(object, {ageTime: gameTime + C.POWER_CREEP_LIFE_TIME});

    object.actionLog.healed = {x: object.x, y: object.y};
};
