import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {roomController,bulk}) => {
    if(roomController) {
        const storeCapacity = roomController.level > 0 && roomController.user == object.user && ScreepsConstants.CONTROLLER_STRUCTURES.factory[roomController.level] ? ScreepsConstants.FACTORY_CAPACITY : 0;
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
