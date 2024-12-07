import _ from 'lodash';

export default (object: any, { bulk }: any) => {

    if (object.cooldown > 0) {

        object.cooldown--;

        if (object.cooldown < 0)
            object.cooldown = 0;

        bulk.update(object, {
            cooldown: object.cooldown
        });
    }

    if (object._cooldown) {
        bulk.update(object, {
            cooldown: object._cooldown
        });
    }

};