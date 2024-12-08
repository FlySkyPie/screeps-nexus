
export default (object: any, objectIntents: any, scope: any) => {


    if (objectIntents.transfer)
        require('./transfer')(object, objectIntents.transfer, scope);

};