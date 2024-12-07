import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
const strongholds = driver.strongholds;

export default (object, intent, scope) => {
    const { roomObjects, bulk, gameTime, eventLog } = scope;

    if(object.type != 'invaderCore') {
        return;
    }

    const target = roomObjects[intent.id];
    if(!target || target.type != 'controller') {
        return;
    }

    if(target.level == 0 || target.user != object.user) {
        return;
    }
    if(target.upgradeBlocked && target.upgradeBlocked > gameTime) {
        return;
    }

    const effect = _.find(target.effects, {effect: C.EFFECT_INVULNERABILITY});
    if(effect) {
        effect.endTime = gameTime + C.INVADER_CORE_CONTROLLER_DOWNGRADE;
    } else {
        target.effects = [{
            effect: C.EFFECT_INVULNERABILITY,
            endTime: gameTime + C.INVADER_CORE_CONTROLLER_DOWNGRADE,
            duration: C.INVADER_CORE_CONTROLLER_DOWNGRADE
        }];
    }

    const upgradePower = 1;
    target.downgradeTime = gameTime + C.INVADER_CORE_CONTROLLER_DOWNGRADE;

    target._upgraded += upgradePower;

    object.actionLog.upgradeController = {x: target.x, y: target.y};

    const effects = target.effects;
    bulk.update(target, { effects: null });
    bulk.update(target, {
        downgradeTime: target.downgradeTime,
        effects
    });

    eventLog.push({event: C.EVENT_UPGRADE_CONTROLLER, objectId: object._id, data: {
            amount: upgradePower, energySpent: 0
        }});
};
