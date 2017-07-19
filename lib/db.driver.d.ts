/**
 * Created by linli on 2017/7/19.
 */

import { DbQuery } from './db.query';

export interface DbCallback {
    (err: Error | string | null, result: any): void;
}

export type Prefix = string | undefined;
export type HashKey = string | number;
export type IndexName = string | undefined;

export interface DbDriver {

    Model(name: string, schema: any, prefix: Prefix): void;
    load(name: string, prefix: Prefix, id: any, fields: Array<string> | DbCallback, callback?: DbCallback): void;
    save(name: string, prefix: Prefix, item: any, callback: DbCallback): void;
    loadBatch(name: string, prefix: Prefix, idArray: Array<any>, fields: Array<string> | DbCallback, callback?: DbCallback): void;
    saveBatch(name: string, prefix: Prefix, items: Array<any>, callback: DbCallback): void;
    remove(name: string, prefix: Prefix, id: any, callback: DbCallback): void;
    create(name: string, prefix: Prefix, data: any, callback: DbCallback): void;
    query(name: string, prefix: Prefix, hashKey: HashKey, indexName: IndexName): DbQuery;
    scan(name: string, prefix: Prefix): DbQuery;


}

