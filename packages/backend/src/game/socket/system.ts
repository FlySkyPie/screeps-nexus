import _ from 'lodash';

export default (listen: any, emit: any) => {

    listen(/^serverMessage$/, (e: any) => {
        emit('server-message', e);
    });

    return {
        onSubscribe(channel: any, _user: any, _conn: any) {

            if (channel == 'server-message') {
                return true;
            }

            return false;
        },

        onUnsubscribe(_channel: any, _user: any, _conn: any) {

        }
    };


};

