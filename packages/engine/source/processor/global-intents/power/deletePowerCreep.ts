import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import { logger } from '../../../logger';

export default (intent: any, user: any, { userPowerCreeps, bulkUsersPowerCreeps }: any) => {

    const powerCreep = _.find(userPowerCreeps, (i: any) => i.user == user._id && i._id == intent.id);

    if (!powerCreep || powerCreep.spawnCooldownTime === null) {
        return;
    }

    if (intent.cancel) {
        bulkUsersPowerCreeps.update(powerCreep._id, { deleteTime: null });
    }
    else {
        logger.info(user.powerExperimentationTime);
        if (user.powerExperimentationTime > Date.now()) {
            bulkUsersPowerCreeps.remove(powerCreep._id);
            return;
        }
        if (powerCreep.deleteTime) {
            return;
        }
        bulkUsersPowerCreeps.update(powerCreep._id, { deleteTime: Date.now() + ScreepsConstants.POWER_CREEP_DELETE_COOLDOWN });
    }
};