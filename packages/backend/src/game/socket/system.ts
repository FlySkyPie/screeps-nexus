import q from 'q';
import _ from 'lodash';
import utils from '../../utils';

export default (listen, emit) => {

    listen(/^serverMessage$/, (e) => {
        emit('server-message', e);
    });

    return {
        onSubscribe(channel, user, conn) {

            if(channel == 'server-message') {
                return true;
            }

            return false;
        },

        onUnsubscribe(channel, user, conn) {

        }
    };


};

