import _ from 'lodash';
import bulk from 'bulk-require';

const priorities: Record<string, any> = {
    rangedHeal: ['heal'],
    attackController: ['rangedHeal', 'heal'],
    dismantle: ['attackController', 'rangedHeal', 'heal'],
    repair: ['dismantle', 'attackController', 'rangedHeal', 'heal'],
    build: ['repair', 'dismantle', 'attackController', 'rangedHeal', 'heal'],
    attack: ['build', 'repair', 'dismantle', 'attackController', 'rangedHeal', 'heal'],
    harvest: ['attack', 'build', 'repair', 'dismantle', 'attackController', 'rangedHeal', 'heal'],
    rangedMassAttack: ['build', 'repair', 'rangedHeal'],
    rangedAttack: ['rangedMassAttack', 'build', 'repair', 'rangedHeal']
};

const creepActions = ['drop', 'transfer', 'withdraw', 'pickup', 'heal', 'rangedHeal', 'dismantle', 'attack', 'harvest', 'move', 'repair',
    'build', 'rangedMassAttack', 'rangedAttack', 'say', 'suicide', 'claimController', 'upgradeController', 'reserveController',
    'attackController', 'generateSafeMode', 'signController', 'pull'];

const modules = bulk(__dirname, ['*.js']);

function checkPriorities(intents: any, name: any) {
    return intents[name] && (!priorities[name] || !_.any(priorities[name], (i: any) => !!intents[i]));
}

export default (object: any, objectIntents: any, scope: any) => {
    creepActions.forEach(name => {
        if (checkPriorities(objectIntents, name)) {
            modules[name](object, objectIntents[name], scope);
        }
    });
};
