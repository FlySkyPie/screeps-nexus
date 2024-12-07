import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {
    if(!object || object.spawning || object.type != 'invaderCore') return;

    if(!object.level || !ScreepsConstants.INVADER_CORE_CREEP_SPAWN_TIME[object.level]) return;

    const {bulk} = scope;

    intent.body = intent.body.slice(0, ScreepsConstants.MAX_CREEP_SIZE);

    const body = [];
    for(let i = 0; i < intent.body.length; i++) {
        const type = intent.body[i];
        if(!_.contains(ScreepsConstants.BODYPARTS_ALL, type)) {
            continue;
        }
        if(intent.boosts && (intent.boosts.length >= i) && ScreepsConstants.BOOSTS[type] && ScreepsConstants.BOOSTS[type][intent.boosts[i]]){
            body.push({
                type,
                hits: 100,
                boost: intent.boosts[i]
            });
        } else {
            body.push({
                type,
                hits: 100
            });
        }
    }

    const storeCapacity = utils.calcBodyEffectiveness(body, ScreepsConstants.CARRY, 'capacity', ScreepsConstants.CARRY_CAPACITY, true);

    const creep = {
        strongholdId: object.strongholdId,
        type: 'creep',
        name: intent.name,
        x: object.x,
        y: object.y,
        body,
        store: { energy: 0 },
        storeCapacity,
        room: object.room,
        user: object.user,
        hits: body.length * 100,
        hitsMax: body.length * 100,
        spawning: true,
        fatigue: 0,
        notifyWhenAttacked: false,
        ageTime: object.decayTime
    };

    bulk.insert(creep);

    bulk.update(object, {
        spawning: {
            name: intent.name,
            needTime: ScreepsConstants.INVADER_CORE_CREEP_SPAWN_TIME[object.level] * body.length,
            remainingTime: ScreepsConstants.INVADER_CORE_CREEP_SPAWN_TIME[object.level] * body.length
        }
    });
};
