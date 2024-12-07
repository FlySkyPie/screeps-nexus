import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, {roomObjects, bulk, gameTime}) => {
    if(object._cooldown) {
        bulk.update(object, {
            cooldownTime: gameTime + object._cooldown
        });
    }

    if(object.decayTime && gameTime > object.decayTime) {
        bulk.remove(object._id);
        delete roomObjects[object._id];
    }
};
