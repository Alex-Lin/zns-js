/**
 * Created by linli on 2017/7/19.
 */

import {DbDriver, Prefix} from './db.driver';

export interface DbTypes {
    string: any;
    number: any;
    date: any;
    stringSet: any;
}

export interface DB {
    driver: DbDriver;
    types: DbTypes;

    init(dbType: string, conf: any, callback?: Function): void;
    Model(name: string, schema: any, prefix: Prefix, callback?: Function): void;
}

export declare var db: DB;


