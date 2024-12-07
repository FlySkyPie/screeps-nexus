import _ from 'lodash';

export default ({ roomObjects, bulk }: any) => {
    _.forEach(roomObjects, (i) => {
        if (i.type == 'constructedWall' && i.decayTime && i.user) {
            bulk.remove(i._id);
            delete roomObjects[i._id];
        }
    });
};
