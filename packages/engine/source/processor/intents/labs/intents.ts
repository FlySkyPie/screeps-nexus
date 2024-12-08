import runReaction from "./run-reaction";
import boostCreep from "./boost-creep";
import unboostCreep from "./unboost-creep";

export default (object: any, objectIntents: any, scope: any) => {

    if (objectIntents.runReaction)
        runReaction(object, objectIntents.runReaction, scope);

    if (objectIntents.boostCreep)
        boostCreep(object, objectIntents.boostCreep, scope);

    if (objectIntents.unboostCreep)
        unboostCreep(object, objectIntents.unboostCreep, scope);
};
