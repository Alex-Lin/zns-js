'use strict';

const _ = require('lodash');

const ossTypes = [
    'null',
    'aws',
    'ali',
    'qq'
];

let isDriverInited = false;
const ossDriverHash = {};

function loadDrivers() {
    _.each(ossTypes, (val) => {
        const fileName = `./oss.${val}.js`;
        ossDriverHash[val] = require(fileName);
    });
}

const Oss = function(config) {
    if (!isDriverInited) {
        loadDrivers();
        isDriverInited = true;
    }

    this.type = config.type || 'null';
    const conf = _.chain(config).pick(['bucketName', 'folderName']).assignIn({
        conf: config[this.type]
    }).value();

    this.conf = conf;
    this.driver = new ossDriverHash[this.type](conf);
};

Oss.prototype.getBucketName = function() {
    return this.conf.bucketName;
};

Oss.prototype.setBucketName = function(bucketName) {
    this.conf.bucketName = bucketName;
};

Oss.prototype.parseParam = function(param, debugInfo) {
    let paramObj = {};
    if (_.isString(param)) {
        try {
            paramObj = JSON.parse(param);
        } catch (e) {
            console.error('oss.', debugInfo, 'invalid json:', param);
        }
    } else {
        paramObj = _.assignIn({}, param);
    }

    if (!_.isString(paramObj.Bucket)) {
        paramObj.Bucket = this.conf.bucketName;
    }

    if (_.isString(this.conf.folderName)) {
        paramObj.Key = this.conf.folderName + '/' + paramObj.Key;
    }

    return paramObj;
};

Oss.prototype.getObject = function(param, callback) {
    if (!this.driver) {
        callback('driverNotInit');
        return;
    }

    const paramObj = this.parseParam(param, `${this.type}.getObject`);
    if (!paramObj) {
        callback('invalidParam');
    } else {
        this.driver.getObject(paramObj, callback);
    }
};

Oss.prototype.putObject = function(param, callback) {
    if (!this.driver) {
        callback('driverNotInit');
        return;
    }

    const paramObj = this.parseParam(param, `${this.type}.getObject`);
    if (!paramObj) {
        callback('invalidParam');
    } else {
        if (_.isString(paramObj.Body)) {
            paramObj.Body = Buffer.from(paramObj.Body, 'utf-8');
        }
        this.driver.putObject(paramObj, callback);
    }
};

module.exports = Oss;
