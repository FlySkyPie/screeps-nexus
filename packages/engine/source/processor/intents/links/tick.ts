import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import movement from '../movement';

export default (object, {bulk}) => {

    if(!object || object.type != 'link') return;

    if(object.cooldown > 0) {

        object.cooldown--;

        if(object.cooldown < 0)
            object.cooldown = 0;

        bulk.update(object, {
            cooldown: object.cooldown,
            actionLog: object.actionLog
        });
    }
    else {
        if(!_.isEqual(object._actionLog, object.actionLog)) {
            bulk.update(object, {
                actionLog: object.actionLog
            });
        }
    }

};