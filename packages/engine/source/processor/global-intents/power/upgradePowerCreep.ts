import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';

export default (intent: any,
    user: any, {
        roomObjectsByType,
        userPowerCreeps,
        bulkObjects,
        bulkUsersPowerCreeps }: any
) => {

    const thisUserPowerCreeps = _.filter(userPowerCreeps, (i: any) => i.user == user._id);

    const powerLevel = Math.floor(Math.pow((user.power || 0) / ScreepsConstants.POWER_LEVEL_MULTIPLY, 1 / ScreepsConstants.POWER_LEVEL_POW));
    const used = thisUserPowerCreeps.length + _.sum(thisUserPowerCreeps, 'level') + (user._usedPowerLevels || 0);
    if (used >= powerLevel) {
        return;
    }

    const powerCreep = _.find(thisUserPowerCreeps, i => i._id == intent.id);
    if (!powerCreep) {
        return;
    }

    if (powerCreep.level >= ScreepsConstants.POWER_CREEP_MAX_LEVEL) {
        return;
    }
    const powerInfo = POWER_INFO[intent.power];
    if (!powerInfo) {
        return;
    }
    if (powerInfo.className !== powerCreep.className) {
        return;
    }

    let level = powerCreep.level;
    if (!powerCreep.powers[intent.power]) {
        powerCreep.powers[intent.power] = { level: 0 };
    }
    if (powerCreep.powers[intent.power].level == 5) {
        return;
    }

    if (level < powerInfo.level[powerCreep.powers[intent.power].level]) {
        return;
    }

    level++;
    let storeCapacity = powerCreep.storeCapacity + 100;
    let hitsMax = powerCreep.hitsMax + 1000;
    powerCreep.powers[intent.power].level++;

    let roomPowerCreep = _.find(roomObjectsByType.powerCreep, (i: any) => i._id == intent.id);
    if (roomPowerCreep) {
        bulkObjects.update(roomPowerCreep, {
            level,
            hitsMax,
            storeCapacity,
            powers: powerCreep.powers
        });
    }

    bulkUsersPowerCreeps.update(powerCreep, {
        level,
        hitsMax,
        storeCapacity,
        powers: powerCreep.powers
    });
};
