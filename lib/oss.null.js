'use strict';

const _ = require('lodash');

const OssNull = function(conf) {

};

OssNull.prototype.getObject = function(param, callback) {
    console.log('oss.null.getObject param:', JSON.stringify(param));
    callback(null, Buffer.from('', 'utf-8'));
};

OssNull.prototype.putObject = function(param, callback) {
    console.log('oss.null.putObject param:', JSON.stringify(param));
    callback(null);
};

module.exports = OssNull;
