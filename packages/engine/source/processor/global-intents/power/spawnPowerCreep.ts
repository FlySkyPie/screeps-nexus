import q from 'q';
import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (
    intent,
    user,
    {roomObjectsByType, userPowerCreeps, bulkObjects,
        bulkUsersPowerCreeps, shardName, gameTime}
) => {

    const powerSpawn = _.find(roomObjectsByType.powerSpawn, i => i._id == intent.id);
    if(!powerSpawn || powerSpawn.user != user._id || powerSpawn._justSpawned)
        return;


    const powerCreep = _.find(userPowerCreeps, i => i.user == user._id && i.name == intent.name);
    if (!powerCreep || powerCreep.spawnCooldownTime === null || powerCreep.spawnCooldownTime > Date.now()) {
        return;
    }

    if(_.any(roomObjectsByType.powerCreep, {room: powerSpawn.room, x: powerSpawn.x, y: powerSpawn.y})) {
        return;
    }

    bulkUsersPowerCreeps.update(powerCreep, {
        shard: shardName,
        spawnCooldownTime: null,
        deleteTime: null
    });

    bulkObjects.insert(Object.assign({}, powerCreep, {
        type: 'powerCreep',
        room: powerSpawn.room,
        x: powerSpawn.x,
        y: powerSpawn.y,
        hits: powerCreep.hitsMax,
        ageTime: gameTime + C.POWER_CREEP_LIFE_TIME,
        actionLog: {spawned: true},
        notifyWhenAttacked: true
    }), powerCreep._id);

    powerSpawn._justSpawned = true;
};