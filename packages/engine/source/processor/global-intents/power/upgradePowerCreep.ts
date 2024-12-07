import q from 'q';
import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (
    intent,
    user,
    {roomObjectsByType, userPowerCreeps, gameTime, bulkObjects, bulkUsersPowerCreeps}
) => {

    const thisUserPowerCreeps = _.filter(userPowerCreeps, i => i.user == user._id);

    const powerLevel = Math.floor(Math.pow((user.power || 0) / C.POWER_LEVEL_MULTIPLY, 1 / C.POWER_LEVEL_POW));
    const used = thisUserPowerCreeps.length + _.sum(thisUserPowerCreeps, 'level') + (user._usedPowerLevels||0);
    if(used >= powerLevel) {
        return;
    }

    const powerCreep = _.find(thisUserPowerCreeps, i => i._id == intent.id);
    if (!powerCreep) {
        return;
    }

    if(powerCreep.level >= C.POWER_CREEP_MAX_LEVEL) {
        return;
    }
    const powerInfo = C.POWER_INFO[intent.power];
    if(!powerInfo) {
        return;
    }
    if(powerInfo.className !== powerCreep.className) {
        return;
    }

    let level = powerCreep.level;
    if(!powerCreep.powers[intent.power]) {
        powerCreep.powers[intent.power] = {level: 0};
    }
    if(powerCreep.powers[intent.power].level == 5) {
        return;
    }

    if(level < powerInfo.level[powerCreep.powers[intent.power].level]) {
        return;
    }

    level++;
    let storeCapacity = powerCreep.storeCapacity + 100;
    let hitsMax = powerCreep.hitsMax + 1000;
    powerCreep.powers[intent.power].level++;

    let roomPowerCreep = _.find(roomObjectsByType.powerCreep, i => i._id == intent.id);
    if(roomPowerCreep) {
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
