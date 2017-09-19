'use strict';

const _ = require('lodash');
const aws = require('aws-sdk');

const OssAws = function(conf) {
    this.conf = conf || {};
    this.awsConf = this.conf.conf;
    this.s3 = new aws.S3(this.awsConf);
};

OssAws.prototype.getObject = function(param, callback) {
    this.s3.getObject(param, (err, res) => {
        if (!err) {
            callback(null, res.Body);
        } else {
            callback(err);
        }
    });
};

OssAws.prototype.putObject = function(param, callback) {
    let s3Param = _.omit(param, ['public']);
    if (!!param.public) {
        s3Param.ACL = 'public-read';
    }

    this.s3.putObject(s3Param, (err, res) => {
        err = !err ? null : err;
        callback(err);
    });
};

module.exports = OssAws;
