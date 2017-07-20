/**
 * Created by linli on 2017/7/17.
 */

'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');

const Query = require('./mo.db.query.js');
const util = require('./util.js');

mongoose.Promise = global.Promise;

const internal = {};
internal.makeUri = function(config) {
    var uri = 'mongodb://';
    if (!_.isObject(config)) {
        return uri;
    }

    if (_.isString(config.user) && _.isString(config.passwd)) {
        uri = uri + config.user + ":" + config.passwd + "@";
    }

    uri = uri + config.host;

    if (!_.isUndefined(config.port)) {
        uri = uri + ":" + _.toString(config.port);
    }

    var option;
    if (_.isObject(config.option)) {
        option = _.map(config.option, function(value, key) {
            return key + "=" + value;
        }).join("&");
    }

    if (_.isString(option)) {
        option = "?" + option;
    } else {
        option = "";
    }

    return uri + "/" + config.name + option;
};

internal.makeOption = function(config) {
    return {
        autoReconnect: true,
        useMongoClient: true
    };
};

const MoDbDriver = module.exports = function() {
    this.conf = {};
    this.schemaHash = {};
    this.modelHash = {};
    this.schemaDataHash = {};
    this.paramDataHash = {};
    this.origSchemaHash = {};
};

MoDbDriver.prototype.init = function(conf, callback) {
    this.conf = _.cloneDeep(conf);
    const self = this;
    const uri = internal.makeUri(conf);
    const option = internal.makeOption(conf);
    mongoose.connect(uri, option, (err) => {
        if (err) {
            console.log('mo.db.driver.connect to mongoDB Fail! uri:', uri);
            if (_.isFunction(callback)) {
                callback(err);
            }
        } else {
            console.log('mo.db.driver.connect to mongoDB Ok uri:', uri);

            mongoose.connection.on('error', self.onError());
            mongoose.connection.on('reconnected', self.onReconnected());
            mongoose.connection.on('disconnected', self.onDisconnected());
            mongoose.connection.on('open', self.onOpen(callback));
        }
    });
};

MoDbDriver.prototype.onError = function() {
    return function(err) {
        console.log('mo.db.driver.onError err:', err);
    };
};

MoDbDriver.prototype.onReconnected = function() {
    return function() {
        console.log('mo.db.driver.onReconnected!');
    };
};

MoDbDriver.prototype.onDisconnected = function() {
    return function() {
        console.log('mo.db.driver.onDisconnected!');
    };
};

MoDbDriver.prototype.onOpen = function(callback) {
    return function() {
        console.log('mo.db.driver.onOpen!');
        callback();
    };
};

internal.typeHash = {
    'string': String,
    'number': Number,
    'array': Array,
    'date': Date
};

internal.convertJoiType = function(typeName) {
    return this.typeHash[typeName];
};

internal.convertSchema = function(data, timestamp) {
    var schemaData = {};
    var idType;
    var rangeKey = data.rangeKey;
    var hashKey = data.hashKey;
    if (_.isString(rangeKey)) {
        idType = {};
        idType[hashKey] = internal.convertJoiType(data.schema[data.hashKey]._type);
        idType[rangeKey] = internal.convertJoiType(data.schema[data.rangeKey]._type);
    } else {
        idType = internal.convertJoiType(data.schema[data.hashKey]._type);
    }

    if (_.isNull(idType)) {
        throw Error('hashKey is empty!!');
    }

    schemaData._id = {
        type: idType
    };

    _.forEach(data.schema, function(value, key) {
        if (key === rangeKey || key === hashKey) {
            return;
        }

        if (!_.isString(value._type)) {
            throw Error('Unknown type in Schema!!!' + key);
        }

        var type = internal.convertJoiType(value._type);
        if (type === undefined) {
            throw Error('Unknown type in Schema!!!' + key);
        }

        schemaData[key] = {type};
    });

    let paramData = {};
    if (!_.isEmpty(timestamp)) {
        paramData.timestamps = timestamp;
    }

    return {schemaData, paramData};
};

internal.getSchemaIndex = function(data) {
    var indexes = [];

    const indexContain = {
        field: {},
        param: {
            unique: true
        }
    };

    if (data.rangeKey) {
        indexContain.field['_id.' + data.rangeKey] = 1;
        indexContain.field['_id.' + data.hashKey] = 1;
    } else {
        indexContain.field['_id'] = 1;
    }

    indexes.push(indexContain);

    _.forEach(data.indexes, function(value) {
        var indexContain = {
            field: {},
            param: {
                unique: false
            }
        };

        indexContain.field[value.hashKey] = 1;
        if (value.rangeKey) {
            indexContain.field[value.rangeKey] = 1;
        }
        indexes.push(indexContain);
    });

    return indexes;
};

MoDbDriver.prototype.Model = function(tableName, param, projectName) {
    if (!_.isObject(param)) {
        console.error('mo.db.driver.Schema error! invalid param:', param);
        return;
    }

    const modelName = util.getModelName(tableName, projectName);
    if (this.modelHash[modelName]) {
        return this.modelHash[modelName];
    }

    const timestampInfo = _.pick(param, ['createdAt', 'updatedAt']);
    const result = internal.convertSchema(param, timestampInfo);
    this.origSchemaHash[tableName] = param;

    this.bUseDefaultTableName = !param.bMongooseTableName;
    if (this.bUseDefaultTableName) {
        result.paramData.collection = modelName;
    }

    this.paramDataHash[modelName] = result.paramData;
    this.schemaDataHash[modelName] = result.schemaData;
    const schema = mongoose.Schema(result.schemaData, result.paramData);

    //init compound indexes
    var indexes = internal.getSchemaIndex(param);
    _.forEach(indexes, function(value) {
        schema.index(value.field, value.param);
    });

    this.schemaHash[tableName] = schema;

    const model = mongoose.model(modelName, this.schemaHash[tableName]);
    model._originalSchema = param;
    model._originalSchemaName = tableName;
    this.modelHash[modelName] = model;
    return model;
};

MoDbDriver.prototype.getModel = function(tableName, projectName) {
    const modelName = util.getModelName(tableName, projectName);
    return this.modelHash[modelName];
};

MoDbDriver.prototype.convertFromModelDataBySchema = function(originalSchema, data) {
    if (!_.isObject(originalSchema)) {
        console.warn('mo.db.driver convertFromModelDataBySchema fail!!! unknown schema');
        return undefined;
    }

    var contentObj = _.omit(data, ['_id', '__v']);
    if (_.isObject(data._id)) {
        contentObj[originalSchema.hashKey] = data._id[originalSchema.hashKey];
        contentObj[originalSchema.rangeKey] = data._id[originalSchema.rangeKey];
    } else {
        contentObj[originalSchema.hashKey] = data._id;
    }

    return contentObj;
};

MoDbDriver.prototype.convertFromModelData = function(name, data) {
    data = data._doc;
    var originalSchema = this.origSchemaHash[name];
    if (!_.isObject(originalSchema)) {
        console.warn('mo.db.driver convertFromModelData fail!!! unknown schema:', name);
        return undefined;
    }

    return this.convertFromModelDataBySchema(originalSchema, data);
};

MoDbDriver.prototype.convertToModelData = function(name, data, withID) {

    var originalSchema = this.origSchemaHash[name];
    if (!_.isObject(originalSchema)) {
        console.warn('mo.db.driver convertModelData fail!!! unknown schema:', name);
        return undefined;
    }

    var pickKey = [];
    if (_.isString(originalSchema.hashKey)) {
        pickKey.push(originalSchema.hashKey);
    }

    var hashRangeKey = _.isString(originalSchema.rangeKey);
    if (hashRangeKey) {
        pickKey.push(originalSchema.rangeKey);
    }

    var idObj = _.pick(data, pickKey);
    var contentObj = _.omit(data, pickKey);

    if (!!withID) {
        if (hashRangeKey) {
            contentObj._id = idObj;
        } else {
            contentObj._id = data[originalSchema.hashKey];
        }
    }

    let setObj;
    // remove properties
    _.forEach(contentObj, (val, key) => {
        if (val === undefined) {
            delete contentObj[key];
            return;
        }

        if (val === null) {
            contentObj[key] = undefined;
            console.log(`mo.db.driver.convertToModelData remove properties! doc: ${name} key: ${key}`);
        }

        if (_.isObject(val) && val['$add'] !== undefined && val['$add'] !== null) {
            setObj = setObj || { '$addToSet': {} };
            if (_.isArray(val['$add'])) {
                setObj['$addToSet'][key] = {
                    '$each': val['$add']
                };
            } else {
                setObj['$addToSet'][key] = val['$add'];
            }
            delete contentObj[key];
        }
    });

    // deal with vogels's $add
    if (setObj) {
        _.assignIn(contentObj, setObj);
    }

    return contentObj;
};


MoDbDriver.prototype.loadBatch = function(tableName, projectName, idArray, fields, callback) {
    if (_.isFunction(fields)) {
        callback = fields;
        fields = undefined;
    }

    if (idArray.length === 0) {
        callback(null, []);
        return;
    }

    idArray = _.map(idArray, (val) => this.convertToModelData(tableName, val, true)._id);
    const model = this.getModel(tableName, projectName);
    let query = model.find();
    query = query.where('_id').in(idArray);

    if (_.isArray(fields)) {
        query = query.select(fields.join(' '));
    }

    const self = this;
    query.exec((err, res) => {
        if (!err) {
            const items = _.map(res, (val) => self.convertFromModelData(tableName, val));
            callback(null, items);
        } else {
            console.warn('mongo.loadBatch failed! tableName:', tableName, 'idArray:', JSON.stringify(idArray), 'fields:', JSON.stringify(fields));
            callback(err);
        }
    });
};

MoDbDriver.prototype.load = function(tableName, projectName, id, fields, callback) {
    if (_.isFunction(fields)) {
        callback = fields;
        fields = undefined;
    }

    this.loadBatch(tableName, projectName, [id], fields, (err, items) => {
        if (!err) {
            let item;
            if (items.length > 0) {
                item = items[0];
            }

            callback(null, item);
        } else {
            callback(err);
        }
    });
};

MoDbDriver.prototype.save = function(tableName, projectName, data, callback) {
    const modelData = this.convertToModelData(tableName, data, true);
    const model = this.getModel(tableName, projectName);
    model.update(_.pick(modelData, '_id'), _.omit(modelData, '_id'), {upsert: true}, (err) => {
        if (err) {
            console.error('mongo.save err! obj:', JSON.stringify(data), 'err:', err);
        }

        callback(err);
    });
};

MoDbDriver.prototype.saveBatch = function(tableName, projectName, dataArray, callback) {
    if (dataArray.length === 0) {
        callback(null);
        return;
    }

    const self = this;

    let error = null;
    let modelDataArray = _.map(dataArray, (val) => self.convertToModelData(tableName, val, true));
    const model = self.getModel(tableName, projectName);
    _.forEach(modelDataArray, (val) => {
        model.update(_.pick(val, '_id'), _.omit(val, '_id'), {upsert: true}, (err) => {
            if (err) {
                error = err || error;
                console.error('mongo.saveBatch err! obj:', JSON.stringify(val), 'err:', err);
            }
        });
    });

    callback(error);
};

MoDbDriver.prototype.remove = function(tableName, projectName, id, callback) {
    const model = this.getModel(tableName, projectName);
    model.find({_id: id}).remove(callback);
};

MoDbDriver.prototype.create = function(tableName, projectName, data, callback) {
    const model = this.getModel(tableName, projectName);
    const modelData = this.convertToModelData(tableName, data, true);
    model.create(modelData, (err) => {
        callback(err);
    });
};

MoDbDriver.prototype.query = (tableName, projectName, hashKey, indexName) => {
    const model = this.getModel(tableName, projectName);
    return new Query(this, model, hashKey, indexName);
};

MoDbDriver.prototype.scan = (tableName, projectName) => {
    const model = this.getModel(tableName, projectName);
    return new Query(this, model);
};