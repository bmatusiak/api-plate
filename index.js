var qs = require('querystring');
var restler = require('restler');
var url = require("url");
var APIplate = function(options) {

    var self = this;

    this.options = options || {};
    this.app_id = this.options.app_id;
    this.secret = this.options.secret;
    this.protocal = this.options.protocal || "http://";
    this.domain = this.options.domain || this.options.api;
    this.cookiePrefix = this.options.cookiePrefix || "apisr_";


    this.middleware = function() {
        return function apiplate(req, res, next) {
            if (req.query.code) {
                var Url = url.parse(req.url);
                var query = qs.parse(Url.query);
                delete Url.href;
                delete Url.path;
                delete Url.search;
                delete query.code;
                Url.query = qs.stringify(query);
                
                self.getToken(req.query.code, function(err, token) {
                    if(!err){
                        req.session.token = token;
                        res.redirect(url.format(Url), 303);
                        next();
                    }else{
                        console.log(err)
                        res.redirect(url.format(Url), 303);
                        //next();
                    }
                });
            }
            else {
                req.apiplate = new APIplateSession(self, req.session.token || null);
                next();
            }
        };
    };

    this.getToken = function(code, cb) {
        
        var params = {
            client_id: self.app_id,
            client_secret: self.secret,
            redirect_uri: '',
            code: code
        };

        var request = restler.post(self.protocal+self.domain+'/oauth/access_token', {
            data: params
        });

        request.on('fail', function(data) {
            cb(data);
        });
        request.on('success', function(data) {
            cb(null, data);
        });
    };
};

var APIplateSession = function(plate, token) {

    var self = this;

    this.plate = plate;
    this.token = token;

    this.get = function(path, params, cb) {
        if (cb === undefined) {
            cb = params;
            params = {};
        }

        if (self.token) params.access_token = self.token;

        try {
            var request = restler.get(self.plate.protocal+self.plate.domain + path, {
                query: params
            });
            request.on('fail', function(data) {
                cb(data);
            });
            request.on('success', function(data) {
                cb(null, data);
            });
        }
        catch (err) {
            cb(err);
        }
    };

    this.post = function(path, params, cb) {
        var request = restler.post(self.plate.protocal+self.plate.domain + path, {
            query: {
                access_token: self.token
            },
            data: params
        });
        request.on('fail', function(data) {
            cb(data);
        });
        request.on('success', function(data) {
            cb(null, data);
        });
    };
};
module.expprts.APIplateSession = APIplateSession;
module.exports.middleware = function(options) {
    return new APIplate(options).middleware();
};
