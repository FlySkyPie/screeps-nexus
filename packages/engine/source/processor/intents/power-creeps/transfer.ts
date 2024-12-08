import _ from 'lodash';

export default (object: any, intent: any, scope: any) => {

    require('../creeps/transfer')(object, intent, scope);
};
