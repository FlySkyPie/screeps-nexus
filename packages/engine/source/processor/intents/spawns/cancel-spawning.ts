import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (spawn, intent, {roomObjects, bulk}) => {
    if(spawn.type != 'spawn' || !spawn.spawning)
        return;
    const spawningCreep = _.find(roomObjects, {type: 'creep', name: spawn.spawning.name, x: spawn.x, y: spawn.y});
    bulk.remove(spawningCreep._id);
    delete roomObjects[spawningCreep._id];
    bulk.update(spawn, {spawning: null});
};