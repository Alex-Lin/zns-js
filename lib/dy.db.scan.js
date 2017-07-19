/**
 * Created by linli on 2017/6/29.
 */

"use strict";

const _ = require('lodash');

const Scan = module.exports = function(queryObj) {
    this.queryObj = queryObj;
    return this;
};

Scan.prototype.attributes = function(param) {
    this.queryObj = this.queryObj.attributes(param);
    return this;
};

Scan.prototype.where = function(param) {
    this.queryObj = this.queryObj.where(param);
    return this;
};

Scan.prototype.lt = function(param) {
    this.queryObj = this.queryObj.lt(param);
    return this;
};

Scan.prototype.lte = function(param) {
    this.queryObj = this.queryObj.lte(param);
    return this;
};

Scan.prototype.gt = function(param) {
    this.queryObj = this.queryObj.gt(param);
    return this;
};

Scan.prototype.gte = function(param) {
    this.queryObj = this.queryObj.gte(param);
    return this;
};

Scan.prototype.eq = function(param) {
    this.queryObj = this.queryObj.eq(param);
    return this;
};

Scan.prototype.ne = function(param) {
    this.queryObj = this.queryObj.ne(param);
    return this;
};

Scan.prototype.in = function(param) {
    this.queryObj = this.queryObj.in(param);
    return this;
};

Scan.prototype.notNull = function(param) {
    this.queryObj = this.queryObj.notNull(param);
    return this;
};

Scan.prototype.loadAll = function() {
    this.queryObj = this.queryObj.loadAll();
    return this;
};

Scan.prototype.limit = function(num) {
    this.queryObj = this.queryObj.limit(num);
    return this;
};

Scan.prototype.descending = function() {
    this.queryObj = this.queryObj.descending();
    return this;
};

Scan.prototype.exec = function(callback) {
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