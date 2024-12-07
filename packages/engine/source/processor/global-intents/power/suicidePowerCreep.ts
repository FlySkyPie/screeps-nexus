import _ from 'lodash';

export default (intent: any, user: any, scope: any) => {
    const { roomObjectsByType } = scope;

    const powerCreep = _.find(roomObjectsByType.powerCreep, (i: any) => i.user == user._id && i._id == intent.id);
    if (!powerCreep) {
        return;
    }

    require('./_diePowerCreep')(powerCreep, scope);
};
