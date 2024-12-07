import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, {roomObjects, bulk, roomController, gameTime, eventLog}) => {

    if(!_.contains(ScreepsConstants.RESOURCES_ALL, intent.resourceType)) {
        return;
    }

    const emptySpace = object.storeCapacity - utils.calcResources(object);
    let amount = Math.min(intent.amount, emptySpace);

    if(!object || object.spawning || !object.storeCapacity || amount < 0) {
        return;
    }
    if(roomController && roomController.user != object.user && roomController.safeMode > gameTime) {
        return;
    }
    const target = roomObjects[intent.id];
    if(!target) {
        return;
    }
    if(object.user != target.user && _.any(roomObjects, i => i.type == ScreepsConstants.STRUCTURE_RAMPART && i.user != object.user && !i.isPublic && i.x == target.x && i.y == target.y)) {
        return;
    }
    if(Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    if(target.type == 'nuker') {
        return;
    }

    if(target.type == 'terminal') {
        const effect = _.find(target.effects, {power: ScreepsConstants.PWR_DISRUPT_TERMINAL});
        if(effect && effect.endTime > gameTime) {
            return;
        }
    }

    if(amount > target.store[intent.resourceType]) {
        amount = target.store[intent.resourceType];
    }

    object.store[intent.resourceType] = (object.store[intent.resourceType]||0) + amount;
    bulk.update(object, {store:{[intent.resourceType]: object.store[intent.resourceType]}});

    target.store[intent.resourceType] -= amount;
    bulk.update(target, {store:{[intent.resourceType]: target.store[intent.resourceType]}});
    if(target.type == 'lab' && intent.resourceType != 'energy' && !target.store[intent.resourceType]) {
        bulk.update(target, {
            storeCapacityResource: {[intent.resourceType]: null},
            storeCapacity: ScreepsConstants.LAB_ENERGY_CAPACITY + ScreepsConstants.LAB_MINERAL_CAPACITY
        });
    }

    eventLog.push({event: ScreepsConstants.EVENT_TRANSFER, objectId: target._id, data: {targetId: object._id, resourceType: intent.resourceType, amount}});

};
