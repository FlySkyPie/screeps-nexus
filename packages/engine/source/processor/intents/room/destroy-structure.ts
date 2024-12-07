import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (userId, intent, scope) => {

    const {roomObjects, roomController} = scope;

    const object = roomObjects[intent.id];

    if(!object || !C.CONSTRUCTION_COST[object.type]) return;

    if(!roomController || roomController.user != userId) return;

    if(object.type == C.STRUCTURE_WALL && object.decayTime && !object.user) return;

    if(_.any(roomObjects, i => (i.type == 'creep' || i.type == 'powerCreep') && i.user != userId)) return;

    require('../structures/_destroy')(object, scope);

    if(object.type == 'constructedWall' && object.decayTime && object.user) {
        require('../creeps/_clear-newbie-walls')(scope);
    }

};
