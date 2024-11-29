import q from 'q';
import _ from 'lodash';
import common from '@screeps/common';
const config = common.configManager.config;
const env = common.storage.env;

export function saveTick(roomId, gameTime, data) {
    return env.hmset(env.keys.ROOM_HISTORY + roomId, {[gameTime]: data});
}

export function upload(roomId, baseTime) {
    return env.get(env.keys.ROOM_HISTORY + roomId)
        .then(data => {
        if(!data || !data[""+baseTime]) {
            return;
        }

        let curTick = baseTime;
        let curObjects = JSON.parse(data[""+baseTime]);

        const result = {
            timestamp: Date.now(),
            room: roomId,
            base: curTick,
            ticks: {
                [curTick]: curObjects
            }
        };

        curTick++;
        while(data[""+curTick]) {
            const objects = JSON.parse(data[""+curTick]);
            const diff = common.getDiff(curObjects, objects);
            result.ticks[curTick] = diff;
            curObjects = objects;
            curTick++;
        }

        config.engine.emit('saveRoomHistory',roomId, baseTime, result);

        return env.del(env.keys.ROOM_HISTORY + roomId);
    });
}
