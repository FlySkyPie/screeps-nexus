import _ from 'lodash';

export default (object: any, intent: any, { roomObjects, bulk, gameTime }: any) => {

    if (object.type != 'creep') {
        return;
    }
    if (object.spawning) {
        return;
    }

    const target = roomObjects[intent.id];
    if (!target || target.type != 'controller') {
        return;
    }
    if (Math.abs(target.x - object.x) > 1 || Math.abs(target.y - object.y) > 1) {
        return;
    }

    bulk.update(target, {
        sign: intent.sign ? {
            user: object.user,
            text: intent.sign,
            time: gameTime,
            datetime: Date.now()
        } : null
    });
};