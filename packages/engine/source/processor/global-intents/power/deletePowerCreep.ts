import q from 'q';
import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (intent, user, {userPowerCreeps, bulkObjects, bulkUsersPowerCreeps}) => {

    const powerCreep = _.find(userPowerCreeps, i => i.user == user._id && i._id == intent.id);

    if (!powerCreep || powerCreep.spawnCooldownTime === null) {
        return;
    }

    if(intent.cancel) {
        bulkUsersPowerCreeps.update(powerCreep._id, {deleteTime: null});
    }
    else {
        console.log(user.powerExperimentationTime);
        if(user.powerExperimentationTime > Date.now()) {
            bulkUsersPowerCreeps.remove(powerCreep._id);
            return;
        }
        if (powerCreep.deleteTime) {
            return;
        }
        bulkUsersPowerCreeps.update(powerCreep._id, {deleteTime: Date.now() + C.POWER_CREEP_DELETE_COOLDOWN});
    }
};