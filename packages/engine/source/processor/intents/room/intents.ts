import _ from 'lodash';

export default (userId: any, objectIntents: any, scope: any) => {

    const { flags, bulkFlags } = scope;

    flags.forEach((i: any) => {
        i._parsed = i.data.split("|");
        i._parsed = _.map(i._parsed, (j: any) => j.split("~"));
    });

    if (objectIntents.removeFlag) {
        _.forEach(objectIntents.removeFlag, (i) => {
            require('./remove-flag')(userId, i, scope);
        });
    }
    if (objectIntents.createFlag) {
        _.forEach(objectIntents.createFlag, (i) => {
            require('./create-flag')(userId, i, scope);
        });
    }
    if (objectIntents.createConstructionSite) {
        _.forEach(objectIntents.createConstructionSite, (i) => {
            require('./create-construction-site')(userId, i, scope);
        });
    }
    if (objectIntents.removeConstructionSite) {
        _.forEach(objectIntents.removeConstructionSite, (i) => {
            require('./remove-construction-site')(userId, i, scope);
        });
    }
    if (objectIntents.destroyStructure) {
        _.forEach(objectIntents.destroyStructure, (i) => {
            require('./destroy-structure')(userId, i, scope);
        });
    }

    if (objectIntents.genEnergy) {
        require('./gen-energy')(userId, objectIntents.genEnergy, scope);
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