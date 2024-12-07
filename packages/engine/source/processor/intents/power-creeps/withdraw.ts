import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (object, intent, scope) => {
    require('../creeps/withdraw')(object, intent, scope);
};
