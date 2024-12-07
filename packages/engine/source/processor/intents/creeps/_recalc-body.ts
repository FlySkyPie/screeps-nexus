import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

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
        object.storeCapacity = utils.calcBodyEffectiveness(object.body, C.CARRY, 'capacity', C.CARRY_CAPACITY, true);
    }
};
