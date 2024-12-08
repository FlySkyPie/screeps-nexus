import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';

import * as utils from '../../../utils';

export default (object: any, intent: any, { roomObjects, roomController, bulk, gameTime }: any) => {

    const target = roomObjects[intent.id];
    if (!target || target.type != 'powerBank' && target.type != 'powerSpawn') {
        return;
    }
    if (utils.dist(object, target) > 1) {
        return;
    }

    if (target.type == 'powerSpawn' && !utils.checkStructureAgainstController(target, roomObjects, roomController)) {
        return;
    }

    bulk.update(object, { ageTime: gameTime + ScreepsConstants.POWER_CREEP_LIFE_TIME });

    object.actionLog.healed = { x: object.x, y: object.y };
};
