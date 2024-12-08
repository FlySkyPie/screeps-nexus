import _ from 'lodash';

export default (spawn: any, _intent: any, { roomObjects, bulk }: any) => {
    if (spawn.type != 'spawn' || !spawn.spawning)
        return;
    const spawningCreep: any = _.find(roomObjects, { type: 'creep', name: spawn.spawning.name, x: spawn.x, y: spawn.y });
    bulk.remove(spawningCreep._id);
    delete roomObjects[spawningCreep._id];
    bulk.update(spawn, { spawning: null });
};
