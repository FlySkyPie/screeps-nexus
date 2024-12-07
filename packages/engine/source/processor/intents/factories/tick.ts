import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, { roomController, bulk }: any) => {
    if (roomController) {
        const storeCapacity =
            roomController.level > 0 &&
                roomController.user == object.user &&
                ScreepsConstants.CONTROLLER_STRUCTURES.factory[roomController.level] ?
                ScreepsConstants.FACTORY_CAPACITY :
                0;
        if (storeCapacity != object.storeCapacity) {
            bulk.update(object, { storeCapacity });
        }
    }

    if (!_.isEqual(object._actionLog, object.actionLog)) {
        bulk.update(object, {
            actionLog: object.actionLog
        });
    }
};
