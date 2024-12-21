import _ from 'lodash';

import { addRoomToUser, removeRoomFromUser, sendNotification } from '@screeps/driver/src';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (object: any, { bulk, bulkUsers, gameTime, roomInfo, users }: any) => {

    if (!object || object.type != 'controller') return;

    if (object.reservation && (gameTime >= object.reservation.endTime - 1 || object.user)) {
        bulk.update(object, { reservation: null });
    }

    if (!object.user || object.user == "2") {
        return;
    }

    addRoomToUser(object.room, users[object.user], bulkUsers);

    if (object._upgradeBlocked) {
        bulk.update(object, { upgradeBlocked: object._upgradeBlocked });
        delete object._upgradeBlocked;
    }

    if (!object.downgradeTime || object.tutorial) {
        bulk.update(object, { downgradeTime: gameTime + ScreepsConstants.CONTROLLER_DOWNGRADE[object.level] + 1 });
        return;
    }

    if (object._upgraded) {
        bulk.update(object, {
            downgradeTime: Math.min(
                object.downgradeTime + ScreepsConstants.CONTROLLER_DOWNGRADE_RESTORE + 1,
                gameTime + ScreepsConstants.CONTROLLER_DOWNGRADE[object.level] + 1)
        });
        return;
    }

    if (gameTime == object.downgradeTime - 3000) {
        sendNotification(object.user, `Attention! Your Controller in room ${object.room} will be downgraded to level ${object.level - 1} in 3000 ticks (~2 hours)! Upgrade it to prevent losing of this room. <a href='http://support.screeps.com/hc/en-us/articles/203086021-Territory-control'>Learn more</a>`);
    }

    while ((gameTime >= object.downgradeTime - 1) && (object.level > 0)) {
        object.level--;
        sendNotification(object.user, `Your Controller in room ${object.room} has been downgraded to level ${object.level} due to absence of upgrading activity!`);
        if (object.level == 0) {
            removeRoomFromUser(object.room, users[object.user], bulkUsers);

            object.progress = 0;
            object.user = null;
            object.downgradeTime = null;
            object.upgradeBlocked = null;
            object.safeMode = null;
            object.safeModeAvailable = 0;
            object.safeModeCooldown = roomInfo.novice > Date.now() ? null : gameTime + ScreepsConstants.SAFE_MODE_COOLDOWN
            object.isPowerEnabled = false;
        }
        else {
            object.downgradeTime += ScreepsConstants.CONTROLLER_DOWNGRADE[object.level] / 2 + 1;
            object.progress += Math.round(ScreepsConstants.CONTROLLER_LEVELS[object.level] * 0.9);
            object.safeModeAvailable = 0;
            object.safeModeCooldown = roomInfo.novice > Date.now() ? null : gameTime + ScreepsConstants.SAFE_MODE_COOLDOWN
        }

        bulk.update(object, {
            downgradeTime: object.downgradeTime,
            level: object.level,
            progress: object.progress,
            user: object.user,
            upgradeBlocked: object.upgradeBlocked,
            safeMode: object.safeMode,
            safeModeCooldown: object.safeModeCooldown,
            safeModeAvailable: object.safeModeAvailable,
            isPowerEnabled: object.isPowerEnabled
        });
    }


};
