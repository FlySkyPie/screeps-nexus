import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, scope, attackType) => {
    const {gameTime, bulk, roomObjects} = scope;

    if(object.type == 'spawn' && object.spawning) {
        const spawning = _.find(roomObjects, {user: object.user, name: object.spawning.name});
        if(spawning) {
            bulk.remove(spawning._id);
            delete roomObjects[spawning._id];
        }
    }

    if(object.type == 'invaderCore') {
        require('../invader-core/destroy')(object, scope);
    }

    if(!attackType || attackType != ScreepsConstants.EVENT_ATTACK_TYPE_NUKE) {
        const ruin = {
            type: 'ruin',
            room: object.room,
            x: object.x,
            y: object.y,
            structure: {
                id: object._id.toString(),
                type: object.type,
                hits: 0,
                hitsMax: object.hitsMax,
                user: object.user
            },
            destroyTime: gameTime,
            decayTime: gameTime + (ScreepsConstants.RUIN_DECAY_STRUCTURES[object.type] || ScreepsConstants.RUIN_DECAY)
        };
        if(object.user) {
            ruin.user = object.user
        }
        ruin.store = object.store || {};

        if(object.effects) {
            const collapseEffect = _.find(object.effects, {effect: ScreepsConstants.EFFECT_COLLAPSE_TIMER});
            if(collapseEffect) {
                ruin.decayTime = _.max([ruin.decayTime, collapseEffect.endTime]);
            }
        }

        bulk.insert(ruin);
    }

    bulk.remove(object._id);
    delete roomObjects[object._id];
};
