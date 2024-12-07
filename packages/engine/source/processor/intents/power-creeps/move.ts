import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

import movement from '../movement';

export default (object, intent, scope) => {

    require('../creeps/move')(object, intent, scope);
};
