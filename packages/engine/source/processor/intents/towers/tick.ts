import _ from 'lodash';

export default (object: any, { bulk }: any) => {

    if (!object || object.type != 'tower') return;

    if (!_.isEqual(object._actionLog, object.actionLog)) {
        bulk.update(object, {
            actionLog: object.actionLog
        });
    }

};