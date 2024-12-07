import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();

import * as movement from '../movement';

export default (object, {bulk}) => {

    if(object.cooldown > 0) {

        object.cooldown--;

        if(object.cooldown < 0)
            object.cooldown = 0;

        bulk.update(object, {
            cooldown: object.cooldown
        });
    }

    if(object._cooldown) {
        bulk.update(object, {
            cooldown: object._cooldown
        });
    }

};