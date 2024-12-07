import _ from 'lodash';
import utils from '../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (roomSpawns, roomExtensions, {roomController, bulk}) => {
    let spawns = roomSpawns;

    if(spawns.length > C.CONTROLLER_STRUCTURES.spawn[roomController.level|0]) {
        spawns.sort(utils.comparatorDistance(roomController));
        spawns = _.take(spawns, C.CONTROLLER_STRUCTURES.spawn[roomController.level|0]);
        roomSpawns.forEach(i => i._off = !_.contains(spawns, i));
    }
    else {
        roomSpawns.forEach(i => i._off = false);
    }

    roomSpawns.forEach(i => {
        if(i._off !== i.off) {
            bulk.update(i._id, {off: i._off});
        }
    });


    let extensions = roomExtensions;

    if(extensions.length > C.CONTROLLER_STRUCTURES.extension[roomController.level|0]) {
        extensions.sort(utils.comparatorDistance(roomController));
        extensions = _.take(extensions, C.CONTROLLER_STRUCTURES.extension[roomController.level|0]);
        roomExtensions.forEach(i => i._off = !_.contains(extensions, i));
    }
    else {
        roomExtensions.forEach(i => i._off = false);
    }

    roomExtensions.forEach(i => {
        if(i._off !== i.off) {
            bulk.update(i._id, {off: i._off});
        }
    });
};