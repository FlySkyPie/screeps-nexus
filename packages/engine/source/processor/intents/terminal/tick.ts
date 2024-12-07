import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {bulk, roomController}) => {

    if(roomController) {
        const storeCapacity = roomController.level > 0 && roomController.user == object.user && C.CONTROLLER_STRUCTURES.terminal[roomController.level] ? C.TERMINAL_CAPACITY : 0;
        if(storeCapacity != object.storeCapacity) {
            bulk.update(object, {storeCapacity});
        }
    }

};
