import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (spawn, intent, {roomObjects, bulk}) => {
    if(spawn.type != 'spawn' || !spawn.spawning)
        return;
    const spawningCreep = _.find(roomObjects, {type: 'creep', name: spawn.spawning.name, x: spawn.x, y: spawn.y});
    bulk.remove(spawningCreep._id);
    delete roomObjects[spawningCreep._id];
    bulk.update(spawn, {spawning: null});
};