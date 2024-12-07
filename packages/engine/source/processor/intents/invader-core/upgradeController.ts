import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

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

    const effect = _.find(target.effects, {effect: ScreepsConstants.EFFECT_INVULNERABILITY});
    if(effect) {
        effect.endTime = gameTime + ScreepsConstants.INVADER_CORE_CONTROLLER_DOWNGRADE;
    } else {
        target.effects = [{
            effect: ScreepsConstants.EFFECT_INVULNERABILITY,
            endTime: gameTime + ScreepsConstants.INVADER_CORE_CONTROLLER_DOWNGRADE,
            duration: ScreepsConstants.INVADER_CORE_CONTROLLER_DOWNGRADE
        }];
    }

    const upgradePower = 1;
    target.downgradeTime = gameTime + ScreepsConstants.INVADER_CORE_CONTROLLER_DOWNGRADE;

    target._upgraded += upgradePower;

    object.actionLog.upgradeController = {x: target.x, y: target.y};

    const effects = target.effects;
    bulk.update(target, { effects: null });
    bulk.update(target, {
        downgradeTime: target.downgradeTime,
        effects
    });

    eventLog.push({event: ScreepsConstants.EVENT_UPGRADE_CONTROLLER, objectId: object._id, data: {
            amount: upgradePower, energySpent: 0
        }});
};
