/**
 * Created by linli on 2017/7/17.
 */

"use strict";

const _ = require('lodash');
const async = require('async');
const vogels = require('dynogels');

const Query = require('./dy.db.query.js');
const Scan = require('./dy.db.scan.js');

const util = require('./util.js');


const DyDbDriver = module.exports = function() {
    this.config = {};
    this.schemaHash = {};
    this.modelHash = {};
    this.log = console;
};

DyDbDriver.prototype.init = function(config, callback) {
    const log = this.log;
    log.log('dy.db.driver.init update config');
    this.config = _.cloneDeep(config);
    vogels.AWS.config.update(config);
    log.log('dy.db.driver.init finish update aws configuration: ', JSON.stringify(this.config));
    callback();
};

DyDbDriver.prototype.Model = function(name, schemaData, projectName) {
    const log = this.log;
    let schema = this.schemaHash[name];
    if (schema) {
        log.warn('dy.db.driver.Model error! duplicated schema name:', name);
    } else {
        let timestampInfo = _.pick(schemaData, ['createdAt', 'updatedAt']);
        if (timestampInfo.createdAt == timestampInfo.updatedAt) {
            schemaData.createdAt = 'createdAt';
            schemaData.schema = _.omit(schemaData.schema, [timestampInfo.createdAt]);
            schemaData.schema.createdAt = util.types.date();
        }
        schema = this.schemaHash[name] = schemaData;
    }

    const tableName = util.getModelName(name, projectName);
    let model = this.modelHash[tableName];
    if (model) {
        return model;
    }


    model = vogels.define(tableName, schema);
    model.config({tableName});
    this.modelHash[tableName] = model;
    return model;
};

DyDbDriver.prototype.getModel = function(tableName, projectName) {
    const modelName = util.getModelName(tableName, projectName);
    return this.modelHash[modelName];
};

DyDbDriver.prototype.loadBatch = function(tableName, projectName, idArray, fields, callback) {
    if (_.isFunction(fields)) {
        callback = fields;
        fields = undefined;
    }

    const param = {};
    if (_.isArray(fields)) {
        param.AttributesToGet = fields;
    }

    const log = this.log;

    this.getModel(tableName, projectName)
        .getItems(idArray, param, (err, userInfos) => {
            if (!err) {
                callback(null, _.map(userInfos, 'attrs'));
            } else {
                log.warn('dynamo.loadBatch err:', err);
                callback(err);
            }
        });
};

DyDbDriver.prototype.load = function(tableName, projectName, id, fields, callback) {
    if (_.isFunction(fields)) {
        callback = fields;
        fields = undefined;
    }

    this.loadBatch(tableName, projectName, [id], fields, (err, items) => {
        let item;
        if (_.isArray(items) && items.length > 0) {
            item = items[0];
        }

        callback(err, item);
    })
};

DyDbDriver.prototype.save = function(tableName, projectName, item, callback) {
    if (!_.isObject(item))
        return;

    const log = this.log;

    this.getModel(tableName, projectName)
        .update(item, (err, res) => {
            if (err) {
                log.warn('dy.db.driver.save err:', err);
            }
            callback(err, res);
        });
};

DyDbDriver.prototype.saveBatch = function(tableName, projectName, items, callback) {
    if (!_.isArray(items) || items.length <= 0)
        return;

    const log = this.log;

    this.getModel(tableName, projectName)
        .create(items, (err, res) => {
            if (err) {
                log.warn('dy.db.driver.SaveBatch err:', err);
            }
            callback(err, res);
        });
};

DyDbDriver.prototype.remove = function(tableName, projectName, id, callback) {
    this.getModel(tableName, projectName).destroy(id, callback);
};

DyDbDriver.prototype.create = function(tableName, projectName, data, callback) {
    this.getModel(tableName, projectName).create(data, (err) => {
        callback(err);
    });
};

DyDbDriver.prototype.query = function(tableName, projectName, hashKey, indexName) {
    const tableModel = this.getModel(tableName, projectName);
    const queryObj = tableModel.query(hashKey);
    const dyQuery = new Query(queryObj);
    if (_.isString(indexName)) {
        queryObj.usingIndex(indexName);
    }

    return dyQuery;
};

DyDbDriver.prototype.scan = function(tableName, projectName) {
    const tableModel = this.getModel(tableName, projectName);
    const scanObj = tableModel.scan();
    const dyScan = new Scan(scanObj);
    return dyScan;
};

