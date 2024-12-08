import _ from 'lodash';

export default (object: any, intent: any, scope: any) => {

    require('../creeps/move')(object, intent, scope);
};
