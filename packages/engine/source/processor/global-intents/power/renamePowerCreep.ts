import _ from 'lodash';

export default (intent: any, user: any, { userPowerCreeps, bulkUsersPowerCreeps }: any) => {

    const thisUserPowerCreeps = _.filter(userPowerCreeps, (i: any) => i.user == user._id);
    const powerCreep = _.find(thisUserPowerCreeps, i => i._id == intent.id);

    if (!powerCreep || powerCreep.spawnCooldownTime === null) {
        return;
    }

    const name = intent.name.substring(0, 50);

    if (_.any(thisUserPowerCreeps, _.matches({ name }))) {
        return;
    }

    bulkUsersPowerCreeps.update(powerCreep._id, { name });
};
