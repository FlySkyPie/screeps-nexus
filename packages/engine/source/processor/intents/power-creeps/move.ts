import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import movement from '../movement';

export default (object, intent, scope) => {

    require('../creeps/move')(object, intent, scope);
};
