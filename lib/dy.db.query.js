/**
 * Created by linli on 2017/6/29.
 */

"use strict";

const _ = require('lodash');

const Query = module.exports = function(queryObj) {
    this.queryObj = queryObj;
    return this;
};

Query.prototype.attributes = function(param) {
    this.queryObj = this.queryObj.attributes(param);
    return this;
};

Query.prototype.where = function(param) {
    this.queryObj = this.queryObj.where(param);
    return this;
};

Query.prototype.lt = function(param) {
    this.queryObj = this.queryObj.lt(param);
    return this;
};

Query.prototype.lte = function(param) {
    this.queryObj = this.queryObj.lte(param);
    return this;
};

Query.prototype.gt = function(param) {
    this.queryObj = this.queryObj.gt(param);
    return this;
};

Query.prototype.gte = function(param) {
    this.queryObj = this.queryObj.gte(param);
    return this;
};

Query.prototype.eq = function(param) {
    this.queryObj = this.queryObj.eq(param);
    return this;
};

Query.prototype.ne = function(param) {
    this.queryObj = this.queryObj.ne(param);
    return this;
};

Query.prototype.in = function(param) {
    this.queryObj = this.queryObj.in(param);
    return this;
};

Query.prototype.notNull = function(param) {
    this.queryObj = this.queryObj.notNull(param);
    return this;
};

Query.prototype.loadAll = function() {
    this.queryObj = this.queryObj.loadAll();
    return this;
};

Query.prototype.limit = function(num) {
    this.queryObj = this.queryObj.limit(num);
    return this;
};

Query.prototype.descending = function() {
    this.queryObj = this.queryObj.descending();
    return this;
};

Query.prototype.exec = function(callback) {
    this.queryObj.exec((err, res) => {
        if (!err) {
            if (!res || !res.Items) {
                callback(null, []);
            } else {
                callback(null, _.map(res.Items, (val) => val.get()));
            }
        } else {
            callback(err);
        }
    });
};

