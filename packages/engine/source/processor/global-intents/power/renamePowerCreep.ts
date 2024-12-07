import q from 'q';
import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (intent, user, {userPowerCreeps, bulkObjects, bulkUsersPowerCreeps}) => {

    const thisUserPowerCreeps = _.filter(userPowerCreeps, i => i.user == user._id);
    const powerCreep = _.find(thisUserPowerCreeps, i => i._id == intent.id);

    if (!powerCreep || powerCreep.spawnCooldownTime === null) {
        return;
    }

    const name = intent.name.substring(0,50);

    if(_.any(thisUserPowerCreeps, {name})) {
        return;
    }

    bulkUsersPowerCreeps.update(powerCreep._id, {name});
};