import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (
    object,
    intent,
    {roomObjects, bulk, bulkUsers, roomController, stats, gameTime}
) => {

    if(object.type != 'powerSpawn' || !object.store)
        return;

    if(!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }

    let amount = 1;
    const effect = _.find(object.effects, {power: ScreepsConstants.PWR_OPERATE_POWER});
    if(effect && effect.endTime >= gameTime) {
        amount = Math.min(object.store.power, amount + ScreepsConstants.POWER_INFO[ScreepsConstants.PWR_OPERATE_POWER].effect[effect.level-1]);
    }

    if(object.store.power < amount || object.store.energy < amount * ScreepsConstants.POWER_SPAWN_ENERGY_RATIO) {
        return;
    }

    object.store.power -= amount;
    object.store.energy -= amount * ScreepsConstants.POWER_SPAWN_ENERGY_RATIO;

    stats.inc('powerProcessed', object.user, amount);

    bulk.update(object, { store: {
        energy: object.store.energy,
        power: object.store.power
    }});

    if(bulkUsers.inc) {
        bulkUsers.inc(object.user, 'power', amount);
    }
};
