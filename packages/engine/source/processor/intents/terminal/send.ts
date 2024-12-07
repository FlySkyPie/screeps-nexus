import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {bulk, gameTime}) => {

    if(!/^(W|E)\d+(N|S)\d+$/.test(intent.targetRoomName)) {
        return;
    }

    if(!_.contains(C.RESOURCES_ALL, intent.resourceType)) {
        return;
    }
    if(!intent.amount || !object.store || !(object.store[intent.resourceType] >= intent.amount)) {
        return;
    }

    const range = utils.calcRoomsDistance(object.room, intent.targetRoomName, true);
    let cost = utils.calcTerminalEnergyCost(intent.amount, range);

    const effect = _.find(object.effects, {power: C.PWR_OPERATE_TERMINAL});
    if(effect && effect.endTime >= gameTime) {
        cost = Math.ceil(cost * C.POWER_INFO[C.PWR_OPERATE_TERMINAL].effect[effect.level-1]);
    }

    if(intent.resourceType != C.RESOURCE_ENERGY && object.store.energy < cost ||
        intent.resourceType == C.RESOURCE_ENERGY && object.store.energy < intent.amount + cost) {
        return;
    }

    bulk.update(object, {send: intent});
};
