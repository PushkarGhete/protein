import fs from 'fs';
import { initStore, storePath } from './store.js';

if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
initStore();
console.log('Shelf reset. Sample orders and stock are back.');
