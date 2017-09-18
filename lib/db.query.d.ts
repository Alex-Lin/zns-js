/**
 * Created by linli on 2017/7/19.
 */
export interface DbCallback {
    (err: Error | string | null, result: any): void;
}

export type CompareValue = string | number;
export type IndexName = string | undefined;

export interface DbQuery {
    attributes(param: Array<string>): DbQuery;
    where(param: string): DbQuery;
    lt(param: CompareValue): DbQuery;
    lte(param: CompareValue): DbQuery;
    gt(param: CompareValue): DbQuery;
    gte(param: CompareValue): DbQuery;
    eq(param: CompareValue): DbQuery;
    ne(param: CompareValue): DbQuery;
    in(param: Array<CompareValue>): DbQuery;
    notNull(param: any): DbQuery;
    loadAll(): DbQuery;
    limit(param: number): DbQuery;
    descending(): DbQuery;
    exec(callback: Function): void;
}
