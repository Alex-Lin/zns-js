
'use strict';

const _ = require('lodash');
const md5 = require('md5');
const Cos = require('cos-nodejs-sdk-v5');

const OssQQ = function(conf) {
    this.conf = conf || {};
    this.qqConf = this.conf.conf;
    this.cos = new Cos(this.qqConf);
};

OssQQ.prototype.getObject = function(param, callback) {
    const qqParam = _.cloneDeep(param);
    qqParam.Region = this.qqConf.region;

    this.cos.getObject(qqParam, (err, res) => {
        if (!err) {
            if (res.statusCode !== 200) {
                console.warn('oss.qq.getObject err statusCode:', res.statusCode);
                err = 'statusPutObjectError' + res.statusCode;
                callback(err);
            } else {
                callback(null, res.Body);
            }
        } else {
            console.warn('oss.qq.getObject err', err);
            callback(err);
        }
    });
};

OssQQ.prototype.putObject = function(param, callback) {
    const qqParam = _.omit(param, ['public']);

    qqParam.Region = this.qqConf.region;
    if (!!param.public) {
        qqParam.ACL = 'public-read';
    }

    this.cos.putObject(qqParam, (err, res) => {
        let error = !err ? null : err;
        if (!error) {
            if (res.statusCode !== 200) {
                error = 'statusPutObjectError' + res.statusCode;
            } else {
                const hash = '"' + md5(qqParam.Body) + '"';
                if (hash !== res.ETag) {
                    error = 'md5PutObjectError';
                    console.warn('oss.qq.ETag:', res.ETag, 'originalMd5:', hash);
                }
            }
        }

        callback(error);
    });
};

module.exports = OssQQ;
