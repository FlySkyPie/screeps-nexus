var q = require('q');
var _ = require('lodash');
var common = require('@screeps/common');
var config = common.configManager.config;
var env = common.storage.env;

exports.saveTick = (roomId, gameTime, data) => {
    return env.hmset(env.keys.ROOM_HISTORY + roomId, {[gameTime]: data});
};

exports.upload = (roomId, baseTime) => {
    return env.get(env.keys.ROOM_HISTORY + roomId)
        .then(data => {
        if(!data || !data[""+baseTime]) {
            return;
        }

        var curTick = baseTime;
        var curObjects = JSON.parse(data[""+baseTime]);

        var result = {
            timestamp: Date.now(),
            room: roomId,
            base: curTick,
            ticks: {
                [curTick]: curObjects
            }
        };

        curTick++;
        while(data[""+curTick]) {
            var objects = JSON.parse(data[""+curTick]);
            var diff = common.getDiff(curObjects, objects);
            result.ticks[curTick] = diff;
            curObjects = objects;
            curTick++;
        }

        config.engine.emit('saveRoomHistory',roomId, baseTime, result);

        return env.del(env.keys.ROOM_HISTORY + roomId);
    });
};
