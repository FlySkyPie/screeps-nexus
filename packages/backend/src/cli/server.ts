import _ from 'lodash';
import net from 'net';
import readline from 'readline';

import { ConfigManager } from '@screeps/common/src/config-manager';

import { ProjectConfig } from '../constansts/project-config';
import { logger } from '../logger';

import * as  cliSandbox from './sandbox';

const config = ConfigManager.config;

Object.assign(config.cli, {
    greeting: 'Screeps server {build} running on port 21025.\r\nThis CLI interface contains a virtual JavaScript machine which you can use to invoke internal server commands. Any valid JavaScript code is allowed. Type "help()" to learn more about commands.\r\n',
    connectionListener(socket: net.Socket) {

        const connectionDesc = `${socket.remoteAddress}:${socket.remotePort}`;

        logger.info(`[${connectionDesc}] Incoming CLI connection`);

        socket.on('error', (_error: any) => logger.info(`[${connectionDesc}] CLI connection reset`));
        socket.on('end', () => logger.info(`[${connectionDesc}] CLI connection closed`));

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
            buildString = `v${ProjectConfig.SCREEPS_VERSION} `;
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

    if (!ProjectConfig.CLI_PORT) {
        throw new Error('CLI_PORT environment variable is not set!');
    }
    if (!ProjectConfig.CLI_HOST) {
        throw new Error('CLI_HOST environment variable is not set!');
    }

    logger.info(`Starting CLI server`);

    const server = net.createServer(config.cli.connectionListener);

    server.on('listening', () => logger.info(`CLI listening on ${ProjectConfig.CLI_HOST}:${ProjectConfig.CLI_PORT}`));

    server.listen(parseInt(ProjectConfig.CLI_PORT), ProjectConfig.CLI_HOST);

    return server;
}

export { startServer };
