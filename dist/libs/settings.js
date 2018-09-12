'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (app, constants) {
    var port = 3000;

    if (constants) {
        port = constants.env.port ? constants.env.port : port;
    }

    app.set('port', process.env.PORT || port);

    // Process application/x-www-form-urlencoded
    app.use(_bodyParser2.default.urlencoded({
        extended: false
    }));

    // Process application/json
    app.use(_bodyParser2.default.json());
};
//# sourceMappingURL=settings.js.map