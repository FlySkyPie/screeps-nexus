import _ from 'lodash';

export default (object: any, intents: any, scope: any) => {
    const { gameTime } = scope;
    if (object.landTime == 1 + gameTime) {
        _.forEach(intents.users, userIntents => {
            _.forEach(userIntents.objects, i => {
                if (!!i.createCreep) { i.createCreep = null; }
            });
        });
    }
};
