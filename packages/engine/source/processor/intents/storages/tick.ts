import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {bulk, roomController, gameTime}) => {
    if (roomController) {
        let storeCapacity = roomController.level > 0 && roomController.user == object.user && C.CONTROLLER_STRUCTURES.storage[roomController.level] > 0 ? C.STORAGE_CAPACITY : 0;
        if(storeCapacity > 0) {
            const effect = _.find(object.effects, {power: C.PWR_OPERATE_STORAGE});
            if (effect && effect.endTime > gameTime) {
                storeCapacity += C.POWER_INFO[C.PWR_OPERATE_STORAGE].effect[effect.level-1];
            }
        }
        if (storeCapacity != object.storeCapacity) {
            bulk.update(object, {storeCapacity});
        }
    }
};
