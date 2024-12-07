import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, {bulk, gameTime, roomInfo}) => {

    if(!object.user || !object.level) {
        return;
    }
    if(!(object.safeModeAvailable > 0)) {
        return;
    }
    if(object.safeModeCooldown >= gameTime) {
        return;
    }
    if(object.upgradeBlocked > gameTime) {
        return;
    }
    if(object.downgradeTime < gameTime + C.CONTROLLER_DOWNGRADE[object.level]/2 - C.CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD) {
        return;
    }

    bulk.update(object, {
        safeModeAvailable: object.safeModeAvailable - 1,
        safeMode: gameTime + C.SAFE_MODE_DURATION,
        safeModeCooldown: roomInfo.novice > Date.now() ? null : gameTime + C.SAFE_MODE_COOLDOWN
    });
};
