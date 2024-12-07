import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (x, y, room, amount, resourceType, scope) => {

    const {roomObjects, bulk} = scope;



    resourceType = resourceType || 'energy';

    amount = Math.round(amount);

    if(amount <= 0) {
        return;
    }

    const container = _.find(roomObjects, {type: 'container', x, y});

    if(container && container.hits > 0) {
        container.store = container.store || {};
        const targetTotal = utils.calcResources(container);
        const toContainerAmount = Math.min(amount, container.storeCapacity - targetTotal);
        if(toContainerAmount > 0) {
            container.store[resourceType] = (container.store[resourceType] || 0) + toContainerAmount;
            bulk.update(container, {store: {[resourceType]: container.store[resourceType]}});
            amount -= toContainerAmount;
        }
    }

    if(amount > 0) {

        const existingDrop = _.find(roomObjects, {type: 'energy', x, y, resourceType});
        if (existingDrop) {
            bulk.update(existingDrop, {
                [resourceType]: existingDrop[resourceType] + amount
            });
        }
        else {
            bulk.insert({
                type: 'energy',
                x, y,
                room: room,
                [resourceType]: amount,
                resourceType
            })
        }
    }
};
