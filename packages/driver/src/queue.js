const q = require('q');
const _ = require('lodash');
const register = {};
const common = require('@screeps/common');
const queue = common.storage.queue;
const pubsub = common.storage.pubsub;

let terminated = false;

process.on('SIGTERM', () => {
    console.log('Got SIGTERM, disabling queue fetching');
    terminated = true;
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

exports.create = name => {

    if(name == 'users') {
        name = 'usersIvm';
    }

    if(!register[name]) {

        register[name] = {

            fetch() {
                if(terminated) {
                    return q.defer().promise;
                }
                return queue.fetch(name);
            },

            markDone(id) {
                return queue.markDone(name, id);
            },

            add(id) {
                return queue.add(name, id);
            },

            addMulti(array) {
                if (!array.length) {
                    return q.when();
                }
                return queue.addMulti(name, array);
            },

            whenAllDone() {
                return queue.whenAllDone(name);
            },

            reset() {
                return queue.reset(name);
            }
        };
    }

    return register[name];
};

exports.resetAll = () => {
    return q.all(Object.keys(register).map(i => queue.reset(i)));
};

exports.createDoneListener = (name, fn) => {
    pubsub.subscribe(pubsub.keys.QUEUE_DONE+name, fn);
};