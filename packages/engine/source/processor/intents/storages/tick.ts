import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {bulk, roomController, gameTime}) => {
    if (roomController) {
        let storeCapacity = roomController.level > 0 && roomController.user == object.user && ScreepsConstants.CONTROLLER_STRUCTURES.storage[roomController.level] > 0 ? ScreepsConstants.STORAGE_CAPACITY : 0;
        if(storeCapacity > 0) {
            const effect = _.find(object.effects, {power: ScreepsConstants.PWR_OPERATE_STORAGE});
            if (effect && effect.endTime > gameTime) {
                storeCapacity += ScreepsConstants.POWER_INFO[ScreepsConstants.PWR_OPERATE_STORAGE].effect[effect.level-1];
            }
        }
        if (storeCapacity != object.storeCapacity) {
            bulk.update(object, {storeCapacity});
        }
    }
};
