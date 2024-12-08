import _ from 'lodash';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, bulk, gameTime }: any) => {

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (target.user != object.user && target.safeMode > gameTime) {
        return;
    }
    if (utils.dist(object, target) > 1) {
        return;
    }

    bulk.update(target, { isPowerEnabled: true });

    object.actionLog.attack = { x: target.x, y: target.y };
};