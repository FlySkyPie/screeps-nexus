import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { StructureEnum } from '@screeps/common/src/constants/structure-enum';

import _destroy from '../structures/_destroy';
import _clearNewbieWalls from '../creeps/_clear-newbie-walls';

export default (userId: any, intent: any, scope: any) => {

    const { roomObjects, roomController } = scope;

    const object = roomObjects[intent.id];

    if (!object || !ScreepsConstants.CONSTRUCTION_COST[object.type]) return;

    if (!roomController || roomController.user != userId) return;

    if (object.type == StructureEnum.STRUCTURE_WALL && object.decayTime && !object.user) return;

    if (_.any(roomObjects, (i: any) => (i.type == 'creep' || i.type == 'powerCreep') && i.user != userId)) return;

    _destroy(object, scope);

    if (object.type == 'constructedWall' && object.decayTime && object.user) {
        _clearNewbieWalls(scope);
    }

};
