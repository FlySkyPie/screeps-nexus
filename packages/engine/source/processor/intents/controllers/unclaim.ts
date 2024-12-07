import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as utils from '../../../utils';

const driver = utils.getDriver();


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