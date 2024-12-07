import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, {roomObjects, bulk, stats, eventLog, gameTime}) => {

    if(!object || object.type != 'tower' || !object.store) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || !ScreepsConstants.CONSTRUCTION_COST[target.type] || target.hits >= target.hitsMax) {
        return;
    }
    if(object.store.energy < ScreepsConstants.TOWER_ENERGY_COST) {
        return;
    }

    let range = Math.max(Math.abs(target.x - object.x), Math.abs(target.y - object.y));
    let amount = ScreepsConstants.TOWER_POWER_REPAIR;
    if(range > ScreepsConstants.TOWER_OPTIMAL_RANGE) {
        if(range > ScreepsConstants.TOWER_FALLOFF_RANGE) {
            range = ScreepsConstants.TOWER_FALLOFF_RANGE;
        }
        amount -= amount * ScreepsConstants.TOWER_FALLOFF * (range - ScreepsConstants.TOWER_OPTIMAL_RANGE) / (ScreepsConstants.TOWER_FALLOFF_RANGE - ScreepsConstants.TOWER_OPTIMAL_RANGE);
    }
    [ScreepsConstants.PWR_OPERATE_TOWER, ScreepsConstants.PWR_DISRUPT_TOWER].forEach(power => {
        const effect = _.find(object.effects, {power});
        if(effect && effect.endTime > gameTime) {
            amount *= ScreepsConstants.POWER_INFO[power].effect[effect.level-1];
        }
    });
    amount = Math.floor(amount);

    if(!amount) {
        return;
    }

    target.hits += amount;
    if(target.hits > target.hitsMax) {
        target.hits = target.hitsMax;
    }
    bulk.update(target, {hits: target.hits});

    object.store.energy -= ScreepsConstants.TOWER_ENERGY_COST;
    object.actionLog.repair = {x: target.x, y: target.y};
    bulk.update(object, {store:{energy: object.store.energy}});

    stats.inc('energyConstruction', object.user, ScreepsConstants.TOWER_ENERGY_COST);

    eventLog.push({event: ScreepsConstants.EVENT_REPAIR, objectId: object._id, data: {
        targetId: target._id, amount: amount, energySpent: ScreepsConstants.TOWER_ENERGY_COST
    }});

};
