import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, { bulk, roomController }: any) => {

    if (roomController) {
        const storeCapacity =
            roomController.level > 0 &&
                roomController.user == object.user &&
                ScreepsConstants.CONTROLLER_STRUCTURES.terminal[roomController.level] ?
                ScreepsConstants.TERMINAL_CAPACITY :
                0;
        if (storeCapacity != object.storeCapacity) {
            bulk.update(object, { storeCapacity });
        }
    }

};
