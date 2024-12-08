import transfer from "./transfer";

export default (object: any, objectIntents: any, scope: any) => {
    if (objectIntents.transfer)
        transfer(object, objectIntents.transfer, scope);
};
