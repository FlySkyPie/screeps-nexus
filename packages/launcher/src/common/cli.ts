import net from 'net';
import q from 'q';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default function cli(host: any, port: any, rlInterface: any) {

    const defer = q.defer();

    const historyFile = path.join(os.homedir(), '.screeps-history');
    try {
        rlInterface.history = JSON.parse(fs.readFileSync(historyFile).toString());
    } catch (err) { }

    const socket = net.connect(port, host);

    socket.on('connect', () => {
        defer.resolve();
        rlInterface.output.write(`Screeps CLI connected on ${host}:${port}.\r\n-----------------------------------------\r\n`);
    });

    rlInterface.on('line', (line: any) => {
        socket.write(line + "\r\n");
    });

    rlInterface.on('close', () => {
        fs.writeFileSync(historyFile, JSON.stringify(rlInterface.history));
    });

    socket.on('data', _data => {
        const data = _data.toString('utf8');
        rlInterface.output.write(data.replace(/^< /, '').replace(/\n< /, ''));
        if (/^< /.test(data) || /\n< /.test(data)) {
            rlInterface.prompt();
        }
    });

    socket.on('error', error => {
        defer.reject(error);
    });

    return defer.promise;
};
