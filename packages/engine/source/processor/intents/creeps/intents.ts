import _ from 'lodash';

import drop from './drop';
import transfer from './transfer';
import withdraw from './withdraw';
import pickup from './pickup';
import heal from './heal';
import rangedHeal from './rangedHeal';
import dismantle from './dismantle';
import attack from './attack';
import harvest from './harvest';
import move from './move';
import repair from './repair';
import build from './build';
import rangedMassAttack from './rangedMassAttack';
import rangedAttack from './rangedAttack';
import say from './say';
import suicide from './suicide';
import claimController from './claimController';
import upgradeController from './upgradeController';
import reserveController from './reserveController';
import attackController from './attackController';
import generateSafeMode from './generateSafeMode';
import signController from './signController';
import pull from './pull';

const priorities: Record<string, string[]> = {
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

const modules: Record<string, any> = {
    drop,
    transfer,
    withdraw,
    pickup,
    heal,
    rangedHeal,
    dismantle,
    attack,
    harvest,
    move,
    repair,
    build,
    rangedMassAttack,
    rangedAttack,
    say,
    suicide,
    claimController,
    upgradeController,
    reserveController,
    attackController,
    generateSafeMode,
    signController,
    pull,
}

const creepActions =Array.from(Object.keys(modules));

function checkPriorities(intents: any, name: string) {
    return intents[name] &&
        (!priorities[name] ||
            !_.any(priorities[name], (i: any) => !!intents[i]));
}

export default (object: any, objectIntents: any, scope: any) => {
    creepActions.forEach(name => {
        if (checkPriorities(objectIntents, name)) {
            modules[name](object, objectIntents[name], scope);
        }
    });
};
