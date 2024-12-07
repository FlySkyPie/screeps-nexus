import _ from 'lodash';

export default (object: any, { roomObjects, bulk, gameTime }: any) => {
    if (object._cooldown) {
        bulk.update(object, {
            cooldownTime: gameTime + object._cooldown
        });
    }

    if (object.decayTime && gameTime > object.decayTime) {
        bulk.remove(object._id);
        delete roomObjects[object._id];
    }
};
