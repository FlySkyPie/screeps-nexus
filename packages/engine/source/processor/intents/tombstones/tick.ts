import _ from 'lodash';

export default (object: any, { roomObjects, bulk, gameTime }: any) => {
    if (!object.decayTime || gameTime >= object.decayTime - 1) {

        if (object.store) {
            _.forEach(object.store, (amount: any, resourceType: any) => {
                if (amount > 0) {
                    const existingDrop: any = _.find(roomObjects, { type: 'energy', x: object.x, y: object.y, resourceType });
                    if (existingDrop) {
                        bulk.update(existingDrop, {
                            [resourceType]: existingDrop[resourceType] + amount
                        });
                    } else {
                        bulk.insert({
                            type: 'energy',
                            x: object.x,
                            y: object.y,
                            room: object.room,
                            [resourceType]: amount,
                            resourceType
                        })
                    }
                }
            });
        }

        bulk.remove(object._id);
        delete roomObjects[object._id];
    }
};
