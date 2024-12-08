
import processPower from "./process-power";

export default (object:any, objectIntents:any, scope:any) => {

    if(objectIntents.processPower)
        processPower(object, objectIntents.processPower, scope);

};