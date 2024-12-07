import _ from 'lodash';
import config from '../../../config';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, {roomObjects, bulk, roomController, gameTime, roomInfo}) => {

    if(!utils.checkStructureAgainstController(object, roomObjects, roomController)) {
        return;
    }
    if(object.store.G < object.storeCapacityResource.G || object.store.energy < object.storeCapacityResource.energy) {
        return;
    }
    if(object.cooldownTime > gameTime) {
        return;
    }
    if(intent.x < 0 || intent.y < 0 || intent.x > 49 || intent.y > 49) {
        return;
    }
    if(roomInfo.novice && roomInfo.novice > Date.now() || roomInfo.respawnArea && roomInfo.respawnArea > Date.now()) {
        return;
    }

    if(!_.isString(intent.roomName) || !/^(W|E)\d+(S|N)\d+$/.test(intent.roomName)) {
        return;
    }

    const [tx,ty] = utils.roomNameToXY(intent.roomName);
    const [x,y] = utils.roomNameToXY(object.room);

    if(Math.abs(tx-x) > ScreepsConstants.NUKE_RANGE || Math.abs(ty-y) > ScreepsConstants.NUKE_RANGE) {
        return;
    }

    bulk.update(object, {
        store: {energy: 0, G: 0},
        cooldownTime: gameTime + (config.ptr ? 100 : ScreepsConstants.NUKER_COOLDOWN)
    });

    bulk.insert({
        type: 'nuke',
        room: intent.roomName,
        x: intent.x,
        y: intent.y,
        landTime: gameTime + (config.ptr ? 100 : ScreepsConstants.NUKE_LAND_TIME),
        launchRoomName: object.room
    });

};
