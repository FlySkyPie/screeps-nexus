import type { Socket } from 'node:net';
import { Writable } from 'node:stream';

class JSONFrameStream extends Writable {
    public frame: any;

    constructor(
        public readonly handler: (obj: any) => any,
        options?: any) {
        super(options);
        this.frame = null;
    }

    _write(chunk: any, _encoding: any, callback: any) {
        this._parse(chunk);
        callback();
    }

    _parse(buffer: any): any {
        if (!buffer.length) {
            return;
        }
        if (!this.frame) {
            this.frame = {
                data: Buffer.alloc(4),
                pointer: 0
            };
        }
        if (!this.frame.size) {
            const length = Math.min(buffer.length, 4 - this.frame.pointer);
            buffer.copy(this.frame.data, this.frame.pointer, 0, length);
            this.frame.pointer += length;
            if (this.frame.pointer === 4) {
                this.frame.size = this.frame.data.readUInt32BE();
                this.frame.data = Buffer.alloc(this.frame.size);
                this.frame.pointer = 0;
            }
            return this._parse(buffer.slice(length));
        }
        else {
            const length = Math.min(buffer.length, this.frame.size - this.frame.pointer);
            buffer.copy(this.frame.data, this.frame.pointer, 0, length);
            this.frame.pointer += length;
            if (this.frame.pointer == this.frame.size) {
                this.handler(JSON.parse(this.frame.data.toString('utf8')));
                this.frame = null;
            }
            return this._parse(buffer.slice(length));
        }
    }

    static makeFrame(obj: any) {
        const data = Buffer.from(JSON.stringify(obj), 'utf8');
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length);
        return Buffer.concat([length, data]);
    }
}

interface IMethodPayload {
    publish: (channel: any, data: any, cb?: any) => void;

    subscribe(channel: any, listener: any): () => void;

    queueFetch(name: any, cb: any): void;
    queueMarkDone(name: any, id: any, cb: any): void;
    queueAdd(name: any, id: any, cb: any): void;
    queueAddMulti(name: any, array: any, cb: any): void;
    queueWhenAllDone(name: any, cb: any): void;
    queueReset(name: any, cb: any): void;

    dbRequest: (collectionName: any, method: any, argsArray: any, cb: any) => void;
    dbUpdate: (collectionName: any, query: any, update: any, params: any, cb: any) => void;

    dbBulk: any;
    dbFindEx: any;
    dbEnvGet: any;
    dbEnvMget: any;
    dbEnvSet: any;
    dbEnvExpire: any;
    dbEnvSetex: any;
    dbEnvTtl: any;
    dbEnvDel: any;
    dbEnvHget: any;
    dbEnvHset: any;
    dbEnvHmget: any;
    dbEnvHmset: any;
    dbResetAllData: any;


    [key: string]: (...args: any[]) => any;
};

export class RpcServer {
    public channelUnsubscribe = new Map();

    constructor(
        public readonly socket: Socket,
        public readonly methods: IMethodPayload) {
        this.socket.pipe(new JSONFrameStream(this._processFrame));

        this.socket.on('close', () => {
            this.channelUnsubscribe.forEach((unsubscribe: any) => unsubscribe());
            this.channelUnsubscribe.clear();
        });
    }

    private _processFrame = (obj: any) => {
        let args = obj.args || [];
        if (obj.method == 'subscribe') {
            if (this.channelUnsubscribe.has('*')) {
                return;
            }
            if (obj.channel === '*') {
                this.channelUnsubscribe.forEach((unsubscribe: any) => unsubscribe());
                this.channelUnsubscribe.clear();
            }
            if (!this.channelUnsubscribe.has(obj.channel)) {
                let unsubscribe = this.methods.subscribe(obj.channel, (pubsub: any) => {
                    this.socket.write(JSONFrameStream.makeFrame({ pubsub }));
                });
                this.channelUnsubscribe.set(obj.channel, unsubscribe);
            }
            return;
        }

        this.methods[obj.method].apply(null, args.concat([(error: any, result: any) => {
            let response: any = { id: obj.id };
            if (error) {
                response.error = error;
            }
            else {
                response.result = result;
            }
            this.socket.write(JSONFrameStream.makeFrame(response));
        }]));
    }
}
