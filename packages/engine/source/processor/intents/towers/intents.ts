import heal from './heal';
import repair from './repair';
import attack from './attack';

export default (object: any, objectIntents: any, scope: any) => {

    if (objectIntents.heal)
        heal(object, objectIntents.heal, scope);
    else if (objectIntents.repair)
        repair(object, objectIntents.repair, scope);
    else if (objectIntents.attack)
        attack(object, objectIntents.attack, scope);
};
