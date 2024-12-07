import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default ({roomObjects, bulk}) => {

    _.forEach(roomObjects, (i) => {
        if(i.type == 'constructedWall' && i.decayTime && i.user) {
            bulk.remove(i._id);
            delete roomObjects[i._id];
        }
    });
};