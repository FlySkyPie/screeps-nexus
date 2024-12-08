import _ from 'lodash';
import bulk from 'bulk-require';

const modules = bulk(__dirname, ['*.js']);

const creepActions = [
    'move',
    'usePower',
    'withdraw',
    'transfer',
    'say',
    'drop',
    'pickup',
    'enableRoom',
    'renew'
];

export default (object: any, objectIntents: any, scope: any) => {
    creepActions.forEach(name => {
        if (objectIntents[name]) {
            modules[name](object, objectIntents[name], scope);
        }
    });
};
