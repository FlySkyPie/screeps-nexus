import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    require('../creeps/transfer')(object, intent, scope);
};
