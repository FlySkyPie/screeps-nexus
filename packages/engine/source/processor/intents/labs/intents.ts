
export default (object: any, objectIntents: any, scope: any) => {

    if (objectIntents.runReaction)
        require('./run-reaction')(object, objectIntents.runReaction, scope);

    if (objectIntents.boostCreep)
        require('./boost-creep')(object, objectIntents.boostCreep, scope);

    if (objectIntents.unboostCreep)
        require('./unboost-creep')(object, objectIntents.unboostCreep, scope);
};
