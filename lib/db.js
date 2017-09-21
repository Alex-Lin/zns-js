/**
 * Created by linli on 2017/7/18.
 */

"use strict";

const _ = require('lodash');

const util = require('./util.js')
const DbModel = require('./db.model.js');

const DB = function() {
    this.driver = undefined;
    this.log = console;
    this.pendingModel = [];
    this.bInit = false;
    this.types = util.types;
    this.modelHash = {};
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
            self.initPendingModel();
        }

        callback(err);
    });
};

DB.prototype.Model = function(name, schema, prefix) {
    const key = name + '_' + prefix;
    let model = this.modelHash[key];
    if (!model) {
        model = new DbModel(this, name, schema, prefix);
        if (this.bInit) {
            model.initInterface();
        } else {
            this.pendingModel.push(model);
        }
    }

    return model;
};

DB.prototype.initPendingModel = function() {
    const self = this;
    _.forEach(this.pendingModel, (val) => {
        val.initInterface();
    });
};



const db = new DB();

module.exports = db;
