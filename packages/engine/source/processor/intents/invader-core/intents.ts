import transfer from "./transfer";
import createCreep from "./create-creep";
import reserveController from "./reserveController";
import attackController from "./attackController";
import upgradeController from "./upgradeController";

export default (object: any, objectIntents: any, scope: any) => {
    if (objectIntents.transfer)
        transfer(object, objectIntents.transfer, scope);

    if (objectIntents.createCreep)
        createCreep(object, objectIntents.createCreep, scope);

    if (objectIntents.reserveController)
        reserveController(object, objectIntents.reserveController, scope);

    if (objectIntents.attackController)
        attackController(object, objectIntents.attackController, scope);

    if (objectIntents.upgradeController)
        upgradeController(object, objectIntents.upgradeController, scope);
};
