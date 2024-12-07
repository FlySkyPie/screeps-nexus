import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {roomController,bulk}) => {
    if(roomController) {
        const storeCapacity = roomController.level > 0 && roomController.user == object.user && C.CONTROLLER_STRUCTURES.factory[roomController.level] ? C.FACTORY_CAPACITY : 0;
        if(storeCapacity != object.storeCapacity) {
            bulk.update(object, {storeCapacity});
        }
    }

    if(!_.isEqual(object._actionLog, object.actionLog)) {
        bulk.update(object, {
            actionLog: object.actionLog
        });
    }
};
