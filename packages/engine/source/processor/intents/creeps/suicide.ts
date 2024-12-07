import _ from 'lodash';

export default (object: any, _intent: any, scope: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    require('./_die')(object, object.user == '2' ? 0 : undefined, false, scope);
};