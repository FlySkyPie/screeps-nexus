import _ from 'lodash';

import _createEnergy from '../creeps/_create-energy';

export default (userId: any, intent: any, scope: any) => {

    const { roomObjects, bulk, roomController } = scope;

    const object = roomObjects[intent.id];

    if (!object || object.type != 'constructionSite') return;

    if (object.user != userId && !(roomController && roomController.user == userId)) return;

    bulk.remove(object._id);
    if (object.progress > 1) {
        _createEnergy(object.x, object.y, object.room, Math.floor(object.progress / 2), 'energy', scope);
    }
};