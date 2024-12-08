import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';

export default (object: any, { bulk, roomController, gameTime }: any) => {
    if (roomController) {
        let storeCapacity =
            roomController.level > 0 &&
                roomController.user == object.user &&
                ScreepsConstants.CONTROLLER_STRUCTURES.storage[roomController.level] > 0 ?
                ScreepsConstants.STORAGE_CAPACITY :
                0;
        if (storeCapacity > 0) {
            const effect: any = _.find(object.effects, { power: PWRCode.PWR_OPERATE_STORAGE });
            if (effect && effect.endTime > gameTime) {
                storeCapacity += POWER_INFO[PWRCode.PWR_OPERATE_STORAGE].effect[effect.level - 1];
            }
        }
        if (storeCapacity != object.storeCapacity) {
            bulk.update(object, { storeCapacity });
        }
    }
};
