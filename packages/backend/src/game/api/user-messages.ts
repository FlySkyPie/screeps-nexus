import express from 'express';
import q from 'q';
import _ from 'lodash';
import jsonResponse from 'q-json-response';

import StorageInstance from '@screeps/common/src/storage';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import * as  auth from './auth';

const router = express.Router();

const db = StorageInstance.db;
const pubsub = StorageInstance.pubsub;

function sendMessageNotification(userId: any, message: any) {
    return db.users.findOne({ _id: userId })
        .then((user: any) => {
            if (user.notifyPrefs && user.notifyPrefs.disabledOnMessages) {
                return q.reject();
            }
            if (!user.notifyPrefs || !user.notifyPrefs.sendOnline) {
                return StorageInstance.env.get(StorageEnvKey.USER_ONLINE + userId).then((data: any) => parseInt(data) > Date.now() - 10 * 60 * 1000 ? q.reject() : true);
            }
        })
        .then((_data: any) => db['users.notifications'].update({
            $and: [
                { user: userId },
                { message },
                { date: { $lte: Date.now() } },
                { type: 'msg' }
            ]
        }, {
            $set: {
                user: userId,
                message,
                date: Date.now(),
                type: 'msg'
            },
            $inc: { count: 1 }
        }, { upsert: true }));
}

router.post('/send', auth.tokenAuth, jsonResponse((request: any) => {

    if (!_.isString(request.body.text) || request.body.text.length > 100 * 1024) {
        return q.reject('text too long');
    }

    let outMessage: any = {
        user: request.user._id,
        respondent: request.body.respondent,
        date: new Date(),
        type: 'out',
        text: request.body.text,
        unread: true
    };

    let inMessage = {
        respondent: request.user._id,
        user: request.body.respondent,
        date: new Date(),
        type: 'in',
        text: request.body.text,
        unread: true
    };

    return db.users.findOne({ _id: request.body.respondent })
        .then((respondent: any) => {
            if (!respondent) {
                return q.reject('invalid respondent');
            }
            return db['users.messages'].insert(outMessage);
        })
        .then((data: any) => {
            outMessage = data;
            return db['users.messages'].insert(_.extend(inMessage, { outMessage: outMessage._id }))
        })
        .then((data: any) => {
            inMessage = data;
            sendMessageNotification(request.body.respondent, '<a href="https://screeps.com/a/#!/messages">New message</a> from user ' + request.user.username),
                pubsub.publish(`user:${request.user._id}/message:${request.body.respondent}`, JSON.stringify({ message: outMessage }));
            pubsub.publish(`user:${request.body.respondent}/message:${request.user._id}`, JSON.stringify({ message: inMessage }));
            pubsub.publish(`user:${request.body.respondent}/newMessage`, JSON.stringify({ message: inMessage }));
        });
}));

router.get('/list', auth.tokenAuth, jsonResponse((request: any) => {

    return db['users.messages'].findEx({ $and: [{ user: request.user._id }, { respondent: request.query.respondent }] }, { sort: { date: -1 }, limit: 100 })
        .then((messages: any) => ({ messages: messages.reverse() }));
}));

router.get('/index', auth.tokenAuth, jsonResponse((request: any) => {

    return db['users.messages'].findEx({ user: request.user._id }, { sort: { date: -1 } })
        .then((data: any) => {
            const messages: any[] = [];
            data.forEach((message: any) => {
                if (!_.any(messages, i => i._id == message.user)) {
                    messages.push({ _id: message.user, message });
                }
            });
            return db.users.find({ _id: { $in: _.pluck(messages, '_id') } })
                .then((users: any) => {
                    users = users.map((i: any) => _.pick(i, ['_id', 'username', 'badge']));
                    return { messages, users: _.indexBy(users, '_id') };
                });
        });
}));

router.post('/mark-read', auth.tokenAuth, jsonResponse((request: any) => {
    const _id = request.body.id;
    let message: any;
    return db['users.messages'].findOne({ $and: [{ _id }, { user: request.user._id }, { type: 'in' }] })
        .then((_message: any) => {
            if (!_message) {
                return q.reject('invalid id');
            }
            message = _message;
            return db['users.messages'].update({ _id }, { $set: { unread: false } });
        })
        .then((_data: any) => {
            return q.all([
                pubsub.publish(`user:${message.user}/message:${message.respondent}`, JSON.stringify({
                    message: {
                        _id: request.body.id,
                        unread: false
                    }
                })),
                pubsub.publish(`user:${message.respondent}/message:${message.user}`, JSON.stringify({
                    message: {
                        _id: message.outMessage,
                        unread: false
                    }
                })),
                db['users.messages'].update({ _id: message.outMessage }, { $set: { unread: false } })
            ]);
        });
}));

router.get('/unread-count', auth.tokenAuth, jsonResponse((request: any) => {
    return db['users.messages'].count({ $and: [{ user: request.user._id }, { type: 'in' }, { unread: true }] })
        .then((count: any) => new Object({ count }));
}));


export default router;