import _ from 'lodash';

import * as driver from '@screeps/driver/src/index';
import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, _intent: any, { bulk, bulkUsers, gameTime, roomInfo, users }: any) => {

    if (object.type != 'controller') {
        return;
    }

    if (!object.user || !object.level) {
        return;
    }

    driver.removeRoomFromUser(object.room, users[object.user], bulkUsers);

    bulk.update(object, {
        user: null,
        level: 0,
        progress: 0,
        downgradeTime: null,
        safeMode: null,
        safeModeAvailable: 0,
        safeModeCooldown: roomInfo.novice > Date.now() ?
            null :
            gameTime + ScreepsConstants.SAFE_MODE_COOLDOWN,
        isPowerEnabled: false,
    });
};