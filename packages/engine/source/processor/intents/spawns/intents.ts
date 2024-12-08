import createCreep from './create-creep';
import renewCreep from './renew-creep';
import recycleCreep from './recycle-creep';
import setSpawnDirections from './set-spawn-directions';
import cancelSpawning from './cancel-spawning';

export default (object: any, objectIntents: any, scope: any) => {

    if (objectIntents.createCreep)
        createCreep(object, objectIntents.createCreep, scope);

    if (objectIntents.renewCreep)
        renewCreep(object, objectIntents.renewCreep, scope);

    if (objectIntents.recycleCreep)
        recycleCreep(object, objectIntents.recycleCreep, scope);

    if (objectIntents.setSpawnDirections)
        setSpawnDirections(object, objectIntents.setSpawnDirections, scope);

    if (objectIntents.cancelSpawning)
        cancelSpawning(object, objectIntents.cancelSpawning, scope);
};
