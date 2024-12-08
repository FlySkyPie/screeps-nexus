import _ from 'lodash';

import move from './move';
import usePower from './usePower';
import withdraw from './withdraw';
import transfer from './transfer';
import say from './say';
import drop from './drop';
import pickup from './pickup';
import enableRoom from './enableRoom';
import renew from './renew';

const modules: Record<string, any> = {
    move,
    usePower,
    withdraw,
    transfer,
    say,
    drop,
    pickup,
    enableRoom,
    renew,
};

const creepActions = Array.from(Object.keys(modules));

export default (object: any, objectIntents: any, scope: any) => {
    creepActions.forEach(name => {
        if (objectIntents[name]) {
            modules[name](object, objectIntents[name], scope);
        }
    });
};
