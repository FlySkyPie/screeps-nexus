import _ from 'lodash';

export default (object: any, intent: any, { }: any) => {

    if (!_.isString(intent.message)) {
        return;
    }

    object.actionLog.say = {
        message: intent.message.substring(0, 10),
        isPublic: intent.isPublic
    };
};