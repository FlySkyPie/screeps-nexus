import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (spawn, intent, scope) => {
    const {roomObjects, bulk, roomController, stats, gameTime} = scope;

    if(spawn.spawning) {
        return;
    }
    if(spawn.type != 'spawn')
        return;

    if(!utils.checkStructureAgainstController(spawn, roomObjects, roomController)) {
        return;
    }

    let directions = intent.directions;
    if(directions !== undefined) {
        if(!_.isArray(directions)) {
            return;
        }
        // convert directions to numbers, eliminate duplicates
        directions = _.uniq(_.map(directions, e => +e));
        if(directions.length > 0) {
            // bail if any numbers are out of bounds or non-integers
            if(!_.all(directions, direction => direction >= 1 && direction <= 8 && direction === (direction | 0))) {
                return;
            }
        }
    }

    intent.body = intent.body.slice(0, ScreepsConstants.MAX_CREEP_SIZE);

    const cost = utils.calcCreepCost(intent.body);
    const result = require('./_charge-energy')(spawn, cost, intent.energyStructures, scope);

    if(!result) {
        return;
    }

    stats.inc('energyCreeps', spawn.user, cost);

    stats.inc('creepsProduced', spawn.user, intent.body.length);

    let needTime = ScreepsConstants.CREEP_SPAWN_TIME * intent.body.length;

    const effect = _.find(spawn.effects, {power: ScreepsConstants.PWR_OPERATE_SPAWN});
    if(effect && effect.endTime > gameTime) {
        needTime = Math.ceil(needTime * ScreepsConstants.POWER_INFO[ScreepsConstants.PWR_OPERATE_SPAWN].effect[effect.level-1]);
    }

    bulk.update(spawn, {
        spawning: {
            name: intent.name,
            needTime,
            remainingTime: needTime,
            directions
        }
    });

    const body = [];
    let storeCapacity = 0;

    intent.body.forEach((i) => {
        if(_.contains(ScreepsConstants.BODYPARTS_ALL, i)) {
            body.push({
                type: i,
                hits: 100
            });
        }

        if(i == ScreepsConstants.CARRY)
            storeCapacity += ScreepsConstants.CARRY_CAPACITY;
    });

    const creep = {
        name: intent.name,
        x: spawn.x,
        y: spawn.y,
        body,
        store: { energy: 0 },
        storeCapacity,
        type: 'creep',
        room: spawn.room,
        user: spawn.user,
        hits: body.length * 100,
        hitsMax: body.length * 100,
        spawning: true,
        fatigue: 0,
        notifyWhenAttacked: true
    };

    if(spawn.tutorial) {
        creep.tutorial = true;
    }

    bulk.insert(creep);
};
