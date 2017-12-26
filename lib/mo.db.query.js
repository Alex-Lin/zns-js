/**
 * Created by linli on 2017/7/18.
 */


"use strict";

const _ = require('lodash');


const internal = {};
internal.generateParam = function (schema, hashKey, indexName) {
    const param = {
        find: {},
        keyArray: []
    };

    if (_.isString(indexName)) {
        // use secondary index hashKey
        if (!_.isArray(schema.indexes)) {
            throw new Error('moQuery.internal.generateFindParam failed!! schema error! schema:', schema);
        }

        for (let i = 0; i < schema.indexes.length; ++i) {
            let val = schema.indexes[i];
            if (val.name == indexName && _.isString(val.hashKey)) {
                let path;
                if (val.hashKey == schema.hashKey || val.hashKey == schema.rangeKey) {
                    if (!val.rangeKey) {
                        path = '_id';
                    } else {
                        path = '_id.' + val.hashKey;
                    }
                } else {
                    path = val.hashKey;
                }

                if (hashKey !== undefined) {
                    param.find[path] = hashKey;
                }
                param.keyArray.push(val.hashKey);
                if (_.isString(val.rangeKey)) {
                    if (val.rangeKey == schema.rangeKey || val.rangeKey == schema.hashKey) {
                        if (schema.rangeKey) {
                            param.keyArray.push('_id.' + val.rangeKey);
                        } else {
                            param.keyArray.push('_id');
                        }
                    } else {
                        param.keyArray.push(val.rangeKey);
                    }
                }

                break;
            }
        }
    } else {
        if (_.isString(schema.rangeKey)) {
            let key = '_id.' + schema.hashKey;
            if (hashKey !== undefined) {
                param.find[key] = hashKey;
            }

            param.keyArray.push(key);
            param.keyArray.push('_id.' + schema.rangeKey);
        } else {
            if (hashKey !== undefined) {
                param.find['_id'] = hashKey;
            }
            param.keyArray.push('_id');
        }
    }

    return param;
};

const Query = module.exports = function (driver, model, hashKey, indexName) {
    this.driver = driver;
    this.model = model;
    this.schema = model._originalSchema;
    this.queryParam = internal.generateParam(this.schema, hashKey, indexName);
    this.queryObj = this.model.find(this.queryParam.find);
    return this;
};

Query.prototype.attributes = function (param) {
    if (!_.isArray(param)) {
        console.warn('moQuery.attributes param err! param:', param);
        return this;
    }

    this.queryObj = this.queryObj.select(param.join(' '));
    return this;
};

internal.convertPath = function(path, schema) {
    if (path == schema.hashKey || path == schema.rangeKey) {
        if (schema.rangeKey) {
            path = '_id.' + path;
        } else {
            path = '_id';
        }
    }
    return path;
};

Query.prototype.where = function (param) {
    const path = internal.convertPath(param, this.schema);
    this.queryObj = this.queryObj.where(path);
    return this;
};

Query.prototype.lt = function (param) {
    this.queryObj = this.queryObj.lt(param);
    return this;
};

Query.prototype.lte = function (param) {
    this.queryObj = this.queryObj.lte(param);
    return this;
};

Query.prototype.gt = function (param) {
    this.queryObj = this.queryObj.gt(param);
    return this;
};

Query.prototype.gte = function (param) {
    this.queryObj = this.queryObj.gte(param);
    return this;
};

Query.prototype.eq = function (param) {
    this.queryObj = this.queryObj.equals(param);
    return this;
};

Query.prototype.ne = function (param) {
    this.queryObj = this.queryObj.ne(param);
    return this;
};

Query.prototype.in = function (param) {
    this.queryObj = this.queryObj.in(param);
    return this;
};

Query.prototype.notNull = function (param) {
    this.queryObj = this.queryObj.exists(true);
    return this;
};

Query.prototype.loadAll = function () {
    return this;
};

Query.prototype.limit = function (num) {
    this.queryObj = this.queryObj.limit(num);
    return this;
};

Query.prototype.descending = function () {
    if (this.queryParam.keyArray.length > 0) {
        let sortParam = _.map(this.queryParam.keyArray, (val) => '-' + val).join(' ');
        this.queryObj = this.queryObj.sort(sortParam);
    }
    return this;
};

Query.prototype.exec = function(callback) {
    this.queryObj.exec((err, res) => {
        if (!err) {
            const items = _.map(res, (val) => this.driver.convertFromModelDataBySchema(this.schema, val._doc));
            callback(null, items);
        } else {
            console.warn('moQuery.exec failed! tableName:', this.model.schema.get('collection'), 'err:', err);
            callback(err);
        }
    });
};