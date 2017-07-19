/**
 * Created by linli on 2017/7/18.
 */

"use strict";

const _ = require('lodash');
const joi = require('joi');
const vogels = require('dynogels');


const types = {
    string: joi.string,
    number: joi.number,
    date: joi.date,
    stringSet: vogels.types.stringSet
};

const DB = function() {
    this.driver = undefined;
    this.log = console;
    this.pendingSchemas = [];
    this.bInit = false;
    this.types = types;
};

DB.prototype.init = function(dbType, conf, callback) {
    if (this.bInit) {
        if (_.isFunction(callback)) {
            callback('inited');
        }

        return;
    }

    let Driver;
    let type = dbType;
    switch(dbType) {
        case 'dynamo':
            Driver = require('./dy.db.driver.js');
            break;

        case 'mongo':
            Driver = require('./mo.db.driver.js');
            break;

        default:
            type = 'dynamo';
            Driver = require('./dy.db.driver.js');
            break;
    }

    const self = this;

    this.log.log('zns.db.init type:', type);
    this.driver = new Driver();
    this.driver.init(conf, (err) => {
        if (!err) {
            self.bInit = true;
            self.initPendingSchemas();
        }

        callback(err);
    });
};

DB.prototype.Model = function(name, schema, prefix, callback) {
    if (this.bInit) {
        const model = this.driver.Model(name, schema, prefix);
        callback(model);
    } else {
        this.pendingSchemas.push({name, schema, prefix, callback});
    }
};

DB.prototype.initPendingSchemas = function() {
    const self = this;
    _.forEach(this.pendingSchemas, (val) => {
        const model = self.driver.Model(val.name, val.schema, val.prefix);
        if (_.isFunction(val.callback)) {
            val.callback(model);
        }
    });
};



const db = new DB();

module.exports = db;
