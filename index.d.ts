
import { DB } from './lib/db';

declare var db: DB;

export import Oss = require('./lib/oss');
export import Rpc = require('./lib/rpc');

export as namespace zns;

