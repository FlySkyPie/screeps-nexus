import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, scope) => {

    if(object.type != 'creep') {
        return;
    }
    if(object.spawning) {
        return;
    }

    require('./_die')(object, object.user == '2' ? 0 : undefined, false, scope);
};