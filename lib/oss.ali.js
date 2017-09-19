'use strict';

const _ = require('lodash');
const co = require('co');
const aliOss = require('ali-oss');

const OssAli = function(conf) {
    this.conf = conf || {};
    this.aliConf = this.conf.conf;
    this.ali = aliOss(this.aliConf);
};

OssAli.prototype.getObject = function(param, callback) {
    const self = this;
    co(function*() {
        var userResult = self.ali.useBucket(param.Bucket);
        console.log("oss.ali.getObejct userResult:", userResult);

        var result = yield self.ali.get(param.Key);
        console.log("oss.ali.getObejct getResult:", result);
        callback(null, result.content);
    }).catch(function(err) {
        callback(err);
    });
};

OssAli.prototype.putObject = function(param, callback) {
    const self = this;
    co(function*() {
        self.ali.useBucket(param.Bucket);

        let error = null;
        const resultPut = yield self.ali.put(param.Key, param.Body);
        do {
            if (!resultPut.res) {
                error = 'aliPutObjectResErr';
                break;
            }

            if (resultPut.res.status !== 200) {
                error = 'statusPutObjectError' + resultPut.status;
                break;
            }

            if (!!param.public) {
                const resultAcl = yield self.ali.putACL(param.Key, 'public-read');
                if (resultAcl.res.status !== 200) {
                    error = 'statusPutAclError' + resultAcl.res.status;
                }
            }
        } while (false);

        callback(error);
    }).catch(function(err) {
        callback(err);
    });
};

module.exports = OssAli;
