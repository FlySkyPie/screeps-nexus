import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

export default (intent: any,
    user: any, {
        roomObjectsByType,
        userPowerCreeps,
        bulkObjects,
        bulkUsersPowerCreeps,
        shardName,
        gameTime }: any
) => {

    const powerSpawn = _.find(roomObjectsByType.powerSpawn, (i: any) => i._id == intent.id);
    if (!powerSpawn || powerSpawn.user != user._id || powerSpawn._justSpawned)
        return;


    const powerCreep = _.find(userPowerCreeps, (i: any) => i.user == user._id && i.name == intent.name);
    if (!powerCreep || powerCreep.spawnCooldownTime === null || powerCreep.spawnCooldownTime > Date.now()) {
        return;
    }

    if (_.any(roomObjectsByType.powerCreep, _.matches({ room: powerSpawn.room, x: powerSpawn.x, y: powerSpawn.y }))) {
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
        ageTime: gameTime + ScreepsConstants.POWER_CREEP_LIFE_TIME,
        actionLog: { spawned: true },
        notifyWhenAttacked: true
    }), powerCreep._id);

    powerSpawn._justSpawned = true;
};