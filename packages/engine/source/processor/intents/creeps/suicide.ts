import _ from 'lodash';

import _die from './_die';

export default (object: any, _intent: any, scope: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    _die(object, object.user == '2' ? 0 : undefined, false, scope);
};