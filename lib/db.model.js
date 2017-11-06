/**
 * Created by linli on 2017/7/28.
 */

"use strict";

const _ = require('lodash');

const bindFuncionArray = [
    'save',
    'load',
    'save',
    'loadBatch',
    'saveBatch',
    'remove',
    'create',
    'query',
    'scan',
    'fetchID'
];

const DbModel = module.exports = function(db, name, schema, prefix) {
    this.db = db;
    this.schema = schema;
    this.name = name;
    this.prefix = prefix;
    this.interface = undefined;
};

DbModel.prototype.initInterface = function() {
    this.interface = this.db.driver.Model(this.name, this.schema, this.prefix);
    for (let i = 0; i < bindFuncionArray.length; ++i) {
        const name = bindFuncionArray[i];
        this[name] = _.bind(this.db.driver[name], this.db.driver, this.name, this.prefix);
    }
};

