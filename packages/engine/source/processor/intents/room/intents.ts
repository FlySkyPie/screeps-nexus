import _ from 'lodash';

import removeFlag from './remove-flag';
import createFlag from './create-flag';
import createConstructionSite from './create-construction-site';
import removeConstructionSite from './remove-construction-site';
import destroyStructure from './destroy-structure';
import genEnergy from './gen-energy';

export default (userId: any, objectIntents: any, scope: any) => {

    const { flags, bulkFlags } = scope;

    flags.forEach((i: any) => {
        i._parsed = i.data.split("|");
        i._parsed = _.map(i._parsed, (j: any) => j.split("~"));
    });

    if (objectIntents.removeFlag) {
        _.forEach(objectIntents.removeFlag, (i) => {
            removeFlag(userId, i, scope);
        });
    }
    if (objectIntents.createFlag) {
        _.forEach(objectIntents.createFlag, (i) => {
            createFlag(userId, i, scope);
        });
    }
    if (objectIntents.createConstructionSite) {
        _.forEach(objectIntents.createConstructionSite, (i) => {
            createConstructionSite(userId, i, scope);
        });
    }
    if (objectIntents.removeConstructionSite) {
        _.forEach(objectIntents.removeConstructionSite, (i) => {
            removeConstructionSite(userId, i, scope);
        });
    }
    if (objectIntents.destroyStructure) {
        _.forEach(objectIntents.destroyStructure, (i) => {
            destroyStructure(userId, i, scope);
        });
    }

    if (objectIntents.genEnergy) {
        genEnergy(userId, objectIntents.genEnergy, scope);
    }

    flags.forEach((i: any) => {
        if (i._modified) {
            const data = _.map(i._parsed, (j: any) => j.join("~")).join("|");

            if (i._id) {
                bulkFlags.update(i._id, { data });
            }
            else {
                bulkFlags.insert({ data, user: i.user, room: i.room });
            }
        }
    });
};