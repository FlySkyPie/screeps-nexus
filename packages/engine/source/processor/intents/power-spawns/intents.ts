export default (object, objectIntents, scope) => {

    if(objectIntents.processPower)
        require('./process-power')(object, objectIntents.processPower, scope);

};