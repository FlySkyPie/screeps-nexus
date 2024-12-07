import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (userId, intent, scope) => {

    const {roomObjects, roomController} = scope;

    const object = roomObjects[intent.id];

    if(!object || !ScreepsConstants.CONSTRUCTION_COST[object.type]) return;

    if(!roomController || roomController.user != userId) return;

    if(object.type == ScreepsConstants.STRUCTURE_WALL && object.decayTime && !object.user) return;

    if(_.any(roomObjects, i => (i.type == 'creep' || i.type == 'powerCreep') && i.user != userId)) return;

    require('../structures/_destroy')(object, scope);

    if(object.type == 'constructedWall' && object.decayTime && object.user) {
        require('../creeps/_clear-newbie-walls')(scope);
    }

};
