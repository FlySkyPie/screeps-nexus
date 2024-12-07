import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, scope) => {

    const {roomObjects, bulk, roomController, gameTime, eventLog} = scope;

    if(!object.nextDecayTime || gameTime >= object.nextDecayTime-1) {
        object.hits = object.hits || 0;
        object.hits -= C.CONTAINER_DECAY;
        if(object.hits <= 0) {
            if(object.store) {
                _.forEach(object.store, (amount, resourceType) => {
                    if (amount > 0) {
                        require('../creeps/_create-energy')(object.x, object.y, object.room,
                            amount, resourceType, scope);
                    }
                });
            }

            bulk.remove(object._id);
            delete roomObjects[object._id];
        }
        else {
            object.nextDecayTime = gameTime + (roomController && roomController.level > 0 ? C.CONTAINER_DECAY_TIME_OWNED : C.CONTAINER_DECAY_TIME);
            bulk.update(object, {
                hits: object.hits,
                nextDecayTime: object.nextDecayTime
            });
        }
    }


};
