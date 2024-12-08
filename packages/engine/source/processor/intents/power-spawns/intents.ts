export default (object:any, objectIntents:any, scope:any) => {

    if(objectIntents.processPower)
        require('./process-power')(object, objectIntents.processPower, scope);

};