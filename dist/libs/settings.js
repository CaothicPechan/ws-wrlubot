'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _fbProvider = require('../providers/facebook/fbProvider');

var _fbProvider2 = _interopRequireDefault(_fbProvider);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (app, constants) {
    var port = 3000;
    var fbService = new _fbProvider2.default(constants.fb.graphMsgURL, constants.fb.pageToken, constants.fb.appSecret);

    if (constants) {
        port = constants.env.port ? constants.env.port : port;
    }

    app.set('port', process.env.PORT || port);

    console.log(fbService);
    // Verifying Facebook Request
    app.use(_bodyParser2.default.json({
        verify: fbService.verifyRequestSignature
    }));

    // Process application/x-www-form-urlencoded
    app.use(_bodyParser2.default.urlencoded({
        extended: false
    }));

    // Process application/json
    app.use(_bodyParser2.default.json());
};
//# sourceMappingURL=settings.js.map