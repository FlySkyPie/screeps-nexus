import _ from 'lodash';

let result = {};

try {
    result = require('./local-config');
}
catch(e) {}

_.merge(result, {
    redis: {
        port: 6379,
        host: '127.0.0.1',
        options: {}
    }
});


export default result;