import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (intent: any, user: any, { userPowerCreeps, bulkUsersPowerCreeps }: any) => {

    const thisUserPowerCreeps: any = _.filter(userPowerCreeps, (i: any) => i.user == user._id);

    const powerLevel = Math.floor(Math.pow((user.power || 0) / ScreepsConstants.POWER_LEVEL_MULTIPLY, 1 / ScreepsConstants.POWER_LEVEL_POW));
    const used = thisUserPowerCreeps.length + _.sum(thisUserPowerCreeps, 'level') + (user._usedPowerLevels || 0);
    if (used >= powerLevel) {
        return;
    }

    if (Object.values(ScreepsConstants.POWER_CLASS).indexOf(intent.className) === -1) {
        return;
    }

    const name = intent.name.substring(0, 50);

    if (_.any(thisUserPowerCreeps, _.matches({ name }))) {
        return;
    }

    bulkUsersPowerCreeps.insert({
        name,
        className: intent.className,
        user: "" + user._id,
        level: 0,
        hitsMax: 1000,
        store: {},
        storeCapacity: 100,
        spawnCooldownTime: 0,
        powers: {}
    });

    user._usedPowerLevels = (user._usedPowerLevels || 0) + 1;
};
