import _ from 'lodash';
import net from 'net';
import readline from 'readline';

import * as common from '@screeps/common/src';

import * as  cliSandbox from './sandbox';

const config = common.configManager.config;

Object.assign(config.cli, {
    greeting: 'Screeps server {build} running on port 21025.\r\nThis CLI interface contains a virtual JavaScript machine which you can use to invoke internal server commands. Any valid JavaScript code is allowed. Type "help()" to learn more about commands.\r\n',
    connectionListener(socket: any) {

        const connectionDesc = `${socket.remoteAddress}:${socket.remotePort}`;

        console.log(`[${connectionDesc}] Incoming CLI connection`);

        socket.on('error', (_error: any) => console.log(`[${connectionDesc}] CLI connection reset`));
        socket.on('end', () => console.log(`[${connectionDesc}] CLI connection closed`));

        const runCliCommand = cliSandbox.create((data: any, isResult: any) => {
            if (data === 'undefined') {
                if (isResult) {
                    socket.write("< ", 'utf8');
                }
                return;
            }
            socket.write((isResult ? "< " : "") + data + "\r\n", 'utf8');
        });

        let buildString = '';
        try {
            buildString = `v${require('screeps').version} `;
        }
        catch (e) { }

        socket.write(config.cli.greeting.replace('{build} ', buildString) + '< \r\n');

        const rl = readline.createInterface({
            input: socket,
            output: socket
        });

        rl.on('line', line => runCliCommand(line));
    }
});


function startServer() {

    if (!process.env.CLI_PORT) {
        throw new Error('CLI_PORT environment variable is not set!');
    }
    if (!process.env.CLI_HOST) {
        throw new Error('CLI_HOST environment variable is not set!');
    }

    console.log(`Starting CLI server`);

    const server = net.createServer(config.cli.connectionListener);

    server.on('listening', () => console.log(`CLI listening on ${process.env.CLI_HOST}:${process.env.CLI_PORT}`));

    server.listen(parseInt(process.env.CLI_PORT), process.env.CLI_HOST);

    return server;
}

export { startServer };
