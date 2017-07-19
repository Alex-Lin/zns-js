/**
 * Created by linli on 2017/7/18.
 */

"use strict";

const _ = require('lodash');

exports.getModelName = function(tableName, prefix) {
    const modelName = _.isString(prefix) ? `${prefix}DB_${tableName}` : tableName;
    console.log('get modelName:', modelName);
    return modelName;
};