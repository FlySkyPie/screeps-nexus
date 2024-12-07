import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import config from '../../../config';

export default (object, intent, {roomObjects, bulk, bulkUsers, stats, gameTime, eventLog}) => {
    if(object.type != 'creep' || object.spawning || !object.store || object.store.energy <= 0) {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }
    if(Math.abs(target.x - object.x) > 3 || Math.abs(target.y - object.y) > 3) {
        return;
    }
    if(target.level == 0 || target.user != object.user) {
        return;
    }
    if(target.upgradeBlocked && target.upgradeBlocked > gameTime) {
        return;
    }

    target._upgraded = target._upgraded || 0;

    const buildPower = _.filter(object.body, (i) => (i.hits > 0 || i._oldHits > 0) && i.type == C.WORK).length * C.UPGRADE_CONTROLLER_POWER || 0;
    let buildEffect = Math.min(buildPower, object.store.energy);

    let boostedParts = _.map(object.body, i => {
        if(i.type == C.WORK && i.boost && C.BOOSTS[C.WORK][i.boost].upgradeController > 0) {
            return C.BOOSTS[C.WORK][i.boost].upgradeController-1;
        }
        return 0;
    });

    if(target.level == 8) {
        let limit = C.CONTROLLER_MAX_UPGRADE_PER_TICK;
        const effect = _.find(target.effects, {power: C.PWR_OPERATE_CONTROLLER});
        if(effect && effect.endTime >= gameTime) {
            limit += C.POWER_INFO[C.PWR_OPERATE_CONTROLLER].effect[effect.level-1];
        }
        if(target._upgraded >= limit) {
            return;
        }
        buildEffect = Math.min(buildEffect, limit - target._upgraded);
    }

    boostedParts.sort((a,b) => b-a);
    boostedParts = boostedParts.slice(0,buildEffect);

    const boostedEffect = Math.floor(buildEffect + _.sum(boostedParts));

    if(target.level < 8) {
        let nextLevelProgress = C.CONTROLLER_LEVELS[target.level];
        if(config.ptr) {
            nextLevelProgress = 1000;
        }
        if(target.tutorial && target.level == 1) {
            nextLevelProgress = 4;
        }
        if (target.progress + boostedEffect >= nextLevelProgress &&
            target.downgradeTime >= gameTime + C.CONTROLLER_DOWNGRADE[target.level]) {

            target.progress = target.progress + boostedEffect - nextLevelProgress;
            target.level++;
            target.downgradeTime = gameTime + C.CONTROLLER_DOWNGRADE[target.level]/2;
            driver.sendNotification(target.user, `Your Controller in room ${target.room} has been upgraded to level ${target.level}.`);
            if(target.level == 8) {
                target.progress = 0;
            }
            target.safeModeAvailable = (target.safeModeAvailable || 0) + 1;
        }
        else {
            target.progress += boostedEffect;
        }
    }

    if(bulkUsers.inc) {
        bulkUsers.inc(target.user, 'gcl', boostedEffect);
    }

    target._upgraded += buildEffect;

    stats.inc('energyControl', object.user, boostedEffect);

    object.store.energy -= buildEffect;

    object.actionLog.upgradeController = {x: target.x, y: target.y};

    bulk.update(object, {store: {energy: object.store.energy}});

    bulk.update(target, {
        level: target.level,
        progress: target.progress,
        safeModeAvailable: target.safeModeAvailable,
        downgradeTime: target.downgradeTime
    });

    eventLog.push({event: C.EVENT_UPGRADE_CONTROLLER, objectId: object._id, data: {
        amount: boostedEffect, energySpent: buildEffect
    }});
};
