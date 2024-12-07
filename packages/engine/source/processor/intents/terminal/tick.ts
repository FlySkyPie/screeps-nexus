import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {bulk, roomController}) => {

    if(roomController) {
        const storeCapacity = roomController.level > 0 && roomController.user == object.user && ScreepsConstants.CONTROLLER_STRUCTURES.terminal[roomController.level] ? ScreepsConstants.TERMINAL_CAPACITY : 0;
        if(storeCapacity != object.storeCapacity) {
            bulk.update(object, {storeCapacity});
        }
    }

};
