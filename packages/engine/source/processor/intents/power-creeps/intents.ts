import _ from 'lodash';

const creepActions = ['move','usePower','withdraw','transfer','say','drop','pickup','enableRoom','renew'];

const modules = require('bulk-require')(__dirname, ['*.js']);

export default (object, objectIntents, scope) => {
    creepActions.forEach(name => {
        if(objectIntents[name]) {
            modules[name](object, objectIntents[name], scope);
        }
    });
};
