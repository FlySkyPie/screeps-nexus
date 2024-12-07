import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default function recalcBody(object) {

    let hits = object.hits;

    for(let i = object.body.length-1; i>=0; i--) {
        object.body[i]._oldHits = object.body[i]._oldHits || object.body[i].hits;
        if(hits > 100)
            object.body[i].hits = 100;
        else
            object.body[i].hits = hits;
        hits -= 100;
        if(hits < 0) hits = 0;
    }

    if(!object.noCapacityRecalc) {
        object.storeCapacity = utils.calcBodyEffectiveness(object.body, ScreepsConstants.CARRY, 'capacity', ScreepsConstants.CARRY_CAPACITY, true);
    }
};
