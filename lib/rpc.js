"use strict";

var _ = require("lodash");
var net = require("net");
var dnode = require("dnode");

function defaultAuthFunc(d, user, pass, cb) {
    const result = ((this.user === undefined || this.user == user) &&
        (this.pass === undefined || this.pass == pass));

    cb(result);
}

var rpc = module.exports = function(conf) {
    this.handlerHash = conf.handlerHash || {};
    this.session = null;
    this.user = conf.user;
    this.pass = conf.pass;
    this.port = conf.port || 7004;
    this.host = conf.host || '127.0.0.1';
    this.authFunc = conf.authFunc || defaultAuthFunc;
    this.reconnectDelay = conf.reconnectDelay || 2000;
    return this;
};

rpc.prototype.registerHandler = function(name, func) {
    this.handlerHash[name] = func;
};

rpc.prototype.registerHandlerHash = function(handlerHash) {
    this.handlerHash = _.merge(this.handlerHash, handlerHash);
};

rpc.prototype.listen = function(port) {
    this.port = port || this.port;
    if (!_.isNumber(this.port)) {
        throw new Error("rpc.listen error! invalid port:", this.port);
    }

    let thisRpc = this;
    net.createServer(function(stream) {
        var d = dnode({auth: auth});
        d.pipe(stream).pipe(d);

        function auth(user, pass, cb) {
            if (typeof cb !== "function")
                return;

            thisRpc.authFunc(d, user, pass, function(isValid) {
                if (isValid) {
                    cb(null, thisRpc.handlerHash);
                    console.log("rpc.listen new client connected!");
                } else {
                    cb("authFailed");
                    console.log("rpc.listen client auth failed!");
                }
            });

            d.on("end", function() {
                console.log("rpc.listen emit end user:", user);
            });

            d.on("error", function(e) {
                console.log("rpc.listen emit error user:", user, "err:", e);
            });
        }
    }).listen(thisRpc.port);
};

rpc.prototype.connect = function(user, pass, port, host, cb) {
    if (_.isFunction(user)) {
        cb = user;
    } else if (!_.isFunction(cb)) {
        new Error('rpc.connect.invalidParam');
    } else {
        this.user = user;
        this.pass = pass;
        this.port = port || 7004;
        this.host = host || '127.0.0.1';
    }

    let thisRpc = this;
    var netClient = net.connect(thisRpc.port, thisRpc.host);
    var dnodeClient = dnode(thisRpc.handlerHash);
    dnodeClient.on("remote", function(remote) {
        remote.auth(thisRpc.user, thisRpc.pass, function(err, session) {
            if (err) {
                console.error("rpc.connect failed! err:", err);
                dnodeClient.end();
            } else {
                console.log("rpc.connect success! user:", thisRpc.user, "port:", thisRpc.port, "host:", thisRpc.host);
                thisRpc.session = session;
            }

            if (_.isFunction(cb)) {
                cb(err);
            }
        });
    });

    netClient.pipe(dnodeClient).pipe(netClient);
    netClient.on("error", thisRpc.onError.bind(thisRpc));
    netClient.on("end", thisRpc.onEnd.bind(thisRpc));
};

rpc.prototype.onError = function(err) {
    console.log('rpc.onError err:', err);
    let self = this;
    setTimeout(function () {
        self.reconnect();
    }, self.reconnectDelay);
};

rpc.prototype.onEnd = function() {
    console.log('rpc.onEnd');
    let self = this;
    setTimeout(function () {
        self.reconnect();
    }, self.reconnectDelay);
}

rpc.prototype.reconnect = function() {
    let thisRpc = this;
    thisRpc.session = null;
    console.log("rpc.reconnect disconnected...");
    setTimeout(function() {
        console.log("rpc.reconnect try reconnect..");
        thisRpc.connect(thisRpc.user, thisRpc.pass, thisRpc.port, thisRpc.host);
    }, thisRpc.reconnectDelay);
};

