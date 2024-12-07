import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {roomObjects, bulk, gameTime, eventLog}) => {

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }
    if(target.user || target.reservation && target.reservation.user != object.user) {
        return;
    }

    const effect =  _.filter(object.body, (i) => i.hits > 0 && i.type == C.CLAIM).length * C.CONTROLLER_RESERVE;
    if(!effect) {
        return;
    }

    if(!target.reservation) {
        target.reservation = {
            user: object.user,
            endTime: gameTime+1
        };
    }


    if(target.reservation.endTime + effect > gameTime + C.CONTROLLER_RESERVE_MAX) {
        return;
    }

    object.actionLog.reserveController = {x: target.x, y: target.y};

    target.reservation.endTime += effect;
    bulk.update(target, {reservation: target.reservation});

    eventLog.push({event: C.EVENT_RESERVE_CONTROLLER, objectId: object._id, data: {amount: effect}});
};
