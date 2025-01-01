import q from 'q';
import net from 'net';
import _ from 'lodash';

export function findPort(port: any): any {
    const defer = q.defer();
    const server = net.createServer(socket => socket.end());
    server.listen(port, () => {
        server.once('close', () => {
            defer.resolve(port);
        });
        server.close();
    });
    server.on('error', (_err) => {
        defer.resolve(findPort(port + 1));
    });
    return defer.promise;
};
