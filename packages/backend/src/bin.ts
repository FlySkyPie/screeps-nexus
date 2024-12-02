import * as backend from './index';

backend.start();
process.on('disconnect', () => process.exit());