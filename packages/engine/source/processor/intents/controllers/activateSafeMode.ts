import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, _intent: any, { bulk, gameTime, roomInfo }: any) => {

    if (!object.user || !object.level) {
        return;
    }
    if (!(object.safeModeAvailable > 0)) {
        return;
    }
    if (object.safeModeCooldown >= gameTime) {
        return;
    }
    if (object.upgradeBlocked > gameTime) {
        return;
    }
    if (object.downgradeTime < gameTime + ScreepsConstants.CONTROLLER_DOWNGRADE[object.level] / 2 - ScreepsConstants.CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD) {
        return;
    }

    bulk.update(object, {
        safeModeAvailable: object.safeModeAvailable - 1,
        safeMode: gameTime + ScreepsConstants.SAFE_MODE_DURATION,
        safeModeCooldown: roomInfo.novice > Date.now() ? null : gameTime + ScreepsConstants.SAFE_MODE_COOLDOWN
    });
};
