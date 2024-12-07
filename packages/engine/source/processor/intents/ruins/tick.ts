import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {roomObjects, bulk, gameTime}) => {
    if (!object.decayTime || gameTime >= object.decayTime - 1) {

        if(object.store) {
            _.forEach(object.store, (amount, resourceType)=>{
                if (amount > 0) {
                    const existingDrop = _.find(roomObjects, {type: 'energy', x: object.x, y: object.y, resourceType});
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
