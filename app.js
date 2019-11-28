var connection = require("express-myconnection");
var mysql = require("mysql");
var restify = require("restify");
var restifyjwt = require("restify-jwt");
var versioning = require("restify-url-semver");
var fs = require("fs");
var dateTime = require("node-datetime");
var config = require("./config");
var api = restify.createServer();
var route = require("./routes/routes.js");
restify.CORS.EXPOSE_HEADERS.push("x-count");
restify.CORS.EXPOSE_HEADERS.push("x-items-per-page");
const Sentry = require('@sentry/node');
Sentry.init({
    dsn: 'https://ba9d644ca43d420e8ff68fe242ee36d8@sentry.io/1837587'
});
api.use(restify.CORS());
api.use(restify.fullResponse());
api.use(restify.acceptParser(api.acceptable));
api.use(restify.queryParser());
api.use(restify.bodyParser());
api.use(restify.CORS());
var secret = config.api.secret;
var version = config.api.version;
api.pre(versioning());
api.use(restifyjwt({
    secret: secret,
    getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
            return req.headers.authorization.split(" ")[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}).unless({
    path: ["/" + version + "/UserAuth/authenticate"]
}));
api.use(function exposeHeader(req, res, next) {
    if (req.method.toLowerCase() === "head") {
        var EXPOSE_HEADERS = [
            "Api-Version",
            "Request-Id",
            "Response-Time",
            "X-Count",
            "X-Items-Per-Page"
        ].join(", ");

        res.setHeader("Access-Control-Expose-Headers", EXPOSE_HEADERS);
        res.header("Access-Control-Allow-Origin", "*");
    }
    next();
});
route.routes(api);
function unknownMethodHandler(req, res) {
    if (req.method.toLowerCase() === "options") {
        var allowHeaders = ["Authorization", "Accept", "Accept-Version", "Content-Type", "Api-Version",
            "Origin", "X-Requested-With"
        ]; // added Origin & X-Requested-With
        if (res.methods.indexOf("OPTIONS") === -1) {
            res.methods.push("OPTIONS");
        }
        res.header("Access-Control-Allow-Credentials", true);
        res.header("Access-Control-Allow-Headers", allowHeaders.join(", "));
        res.header("Access-Control-Allow-Methods", res.methods.join(", "));
        res.header("Access-Control-Allow-Origin", "*");
        res.header("X-Frame-Options", "DENY");
        res.header("X-Content-Type-Options", "nosniff");
        res.header("X-XSS-Protection", "1");
        console.log("end userauth");
        return res.send(204);
    } else {
        return res.send(new restify.MethodNotAllowedError());
    }
}
api.on("MethodNotAllowed", unknownMethodHandler);
module.exports = {
    server: api
};
var servers = api.listen(process.env.PORT || 8010, function() {
    console.log("%s listening at %s", api.name, api.url);

});