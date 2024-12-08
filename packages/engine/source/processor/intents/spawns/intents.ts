export default (object: any, objectIntents: any, scope: any) => {

    if (objectIntents.createCreep)
        require('./create-creep')(object, objectIntents.createCreep, scope);

    if (objectIntents.renewCreep)
        require('./renew-creep')(object, objectIntents.renewCreep, scope);

    if (objectIntents.recycleCreep)
        require('./recycle-creep')(object, objectIntents.recycleCreep, scope);

    if (objectIntents.setSpawnDirections)
        require('./set-spawn-directions')(object, objectIntents.setSpawnDirections, scope);

    if (objectIntents.cancelSpawning)
        require('./cancel-spawning')(object, objectIntents.cancelSpawning, scope);
};
