import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { PWRCode } from '@screeps/common/src/constants/pwr-code';
import { POWER_INFO } from '@screeps/common/src/tables/power-info';

import * as utils from '../../../utils';

export default (
    object: any,
    _intent: any,
    { roomObjects, bulk, bulkUsers, roomController, stats, gameTime }: any,
) => {

    if (object.type != 'powerSpawn' || !object.store)
        return;

    if (!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }

    let amount = 1;
    const effect: any = _.find(object.effects, { power: PWRCode.PWR_OPERATE_POWER });
    if (effect && effect.endTime >= gameTime) {
        amount = Math.min(object.store.power, amount + POWER_INFO[PWRCode.PWR_OPERATE_POWER].effect[effect.level - 1]);
    }

    if (object.store.power < amount || object.store.energy < amount * ScreepsConstants.POWER_SPAWN_ENERGY_RATIO) {
        return;
    }

    object.store.power -= amount;
    object.store.energy -= amount * ScreepsConstants.POWER_SPAWN_ENERGY_RATIO;

    stats.inc('powerProcessed', object.user, amount);

    bulk.update(object, {
        store: {
            energy: object.store.energy,
            power: object.store.power
        }
    });

    if (bulkUsers.inc) {
        bulkUsers.inc(object.user, 'power', amount);
    }
};
