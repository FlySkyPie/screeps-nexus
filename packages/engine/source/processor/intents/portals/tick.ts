import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, {roomObjects, bulk, gameTime}) => {

    if(object.unstableDate && Date.now() > object.unstableDate) {
        bulk.update(object, {
            decayTime: gameTime + C.PORTAL_DECAY,
            unstableDate: null
        });
    }

    if(object.decayTime && gameTime > object.decayTime) {
        bulk.remove(object._id);
        delete roomObjects[object._id];

        const wall = _.find(roomObjects, i => i.type == 'constructedWall' && i.x == object.x+1 && i.y == object.y+1);
        if(wall) {
            bulk.remove(wall._id);
            delete roomObjects[wall._id];
        }
    }

};