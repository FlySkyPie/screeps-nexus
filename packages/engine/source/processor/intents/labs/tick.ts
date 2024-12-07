import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

import movement from '../movement';

export default (object, {bulk}) => {
    if(!_.isEqual(object._actionLog, object.actionLog)) {
        bulk.update(object, {
            actionLog: object.actionLog
        });
    }
};
