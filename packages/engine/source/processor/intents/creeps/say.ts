import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, {}) => {

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }
    if(!_.isString(intent.message)) {
        return;
    }

    object.actionLog.say = {
        message: intent.message.substring(0,10),
        isPublic: intent.isPublic
    };
};