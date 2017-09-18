/**
 * Created by linli on 2017/7/19.
 */

import { DbQuery } from './db.query';

export interface DbCallback {
    (err: Error | string | null, result: any): void;
}

export type HashKey = string | number;
export type IndexName = string;

export interface DbModel {

    dirty(): void;
    load(id: any, fields: Array<string> | DbCallback, callback?: DbCallback): void;
    save(item: any, callback: DbCallback): void;
    loadBatch(idArray: Array<any>, fields: Array<string> | DbCallback, callback?: DbCallback): void;
    saveBatch(items: Array<any>, callback: DbCallback): void;
    remove(id: any, callback: DbCallback): void;
    create(data: any, callback: DbCallback): void;
    query(hashKey: HashKey, indexName?: IndexName): DbQuery;
    scan(): DbQuery;
}

