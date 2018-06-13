'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (app) {
    app.get('/', function (req, res) {
        res.json({
            response: 'Hello index!'
        });
    });
    app.get('/404', function (req, res) {
        res.json({
            response: '404 error!'
        });
    });
};
//# sourceMappingURL=index.js.map