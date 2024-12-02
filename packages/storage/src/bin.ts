import * as storage from './index';

storage.start();
process.on('disconnect', () => process.exit());
