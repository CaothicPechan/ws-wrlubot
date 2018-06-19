'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _config = require('../libs/config');

exports.default = function (app) {
    app.get('/', function (req, res) {
        res.json({
            response: 'Hello index deploy!'
        });
    });
    app.get('/webhook/', function (req, res) {
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === _config.constants.fb.verifyToken) {
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    });
    app.get('/404', function (req, res) {
        res.json({
            response: '404 error!'
        });
    });
};
//# sourceMappingURL=index.js.map