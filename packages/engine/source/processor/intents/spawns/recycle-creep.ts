import _ from 'lodash';

import _die from '../creeps/_die';

export default (object: any, intent: any, scope: any) => {

    const { roomObjects } = scope;

    if (object.type != 'spawn') {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'creep' || target.user != object.user || target.spawning) {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    _die(target, 1.0, false, scope);
};