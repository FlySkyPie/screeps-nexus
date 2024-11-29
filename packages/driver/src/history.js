const q = require('q');
const _ = require('lodash');
const common = require('@screeps/common');
const config = common.configManager.config;
const env = common.storage.env;

exports.saveTick = (roomId, gameTime, data) => {
    return env.hmset(env.keys.ROOM_HISTORY + roomId, {[gameTime]: data});
};

exports.upload = (roomId, baseTime) => {
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
};
