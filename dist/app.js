'use strict';

var _config = require('./libs/config');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportFacebook = require('passport-facebook');

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _init = require('./libs/init');

var _init2 = _interopRequireDefault(_init);

var _settings = require('./libs/settings');

var _settings2 = _interopRequireDefault(_settings);

var _index = require('./routes/index');

var _index2 = _interopRequireDefault(_index);

var _facebookObjects = require('./models/facebookObjects');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

(0, _settings2.default)(app, _config.constants);
(0, _index2.default)(app);

var x = new _facebookObjects.Button();
console.log(x);
x.type = 'hello';
console.log(x);
(0, _init2.default)(app);
//# sourceMappingURL=app.js.map