'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _dialogflow = require('dialogflow');

var _dialogflow2 = _interopRequireDefault(_dialogflow);

var _structjson = require('./structjson');

var _structjson2 = _interopRequireDefault(_structjson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 
 * 
 * @description Anonymus class to get the functions for using DialogFlow API.
 *              on version { 0.0.1 }. This class was created for using with Fb API,
 *              in next versions would be released for more platforms as Telegram.
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @argument {String} googleProjectId           Google ID Project for using as a key to 
 *                                              auth on DialogFlow API.
 * 
 * @argument {String} clientEmail               Email using on google cloud (service account)
 *                          |                   for setting dialogflow project
 * 
 * @argument {String} privateKey                Private key from google credentials for the
 *                                              DialogFlow project
 * 
 * @argument {String} languageCode              Language Code for using on DialogFlow
 *                                              default "en-US"
 */

var _class = function () {
    function _class(googleProjectId, clientEmail, privateKey) {
        var languageCode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'en-US';

        _classCallCheck(this, _class);

        var credentials = {
            client_email: clientEmail,
            private_key: privateKey
        };

        this.googleProjectId = googleProjectId;
        this.clientEmail = clientEmail;
        this.privateKey = privateKey;
        this.languageCode = languageCode;
        this.sessionClient = new _dialogflow2.default.SessionsClient({
            projectId: googleProjectId,
            credentials: credentials
        });

        this.sendTextQueryToApiAi = this.sendTextQueryToApiAi.bind(this);
        this.sendEventToApiAi = this.sendEventToApiAi.bind(this);
    }

    /** Send a text query to DialogFlow API
     * 
     * 
     * @method sendTextQueryToApiAi()          
     *  
     * @param {String} sessionIds               Ids for actual session for send to API
     * @param {Function} handleApiAiResponse    CallBack for handle response
     * @param {*} sender                        Sender identifier
     * @param {String} text                     Simple text to send
     * @param {Function} callback               Function for returning callback on future life wrlu-ciclyng life
     * @param {Object} params                   API params
     * 
     * @returns callback handleApiAiResponse()
     * 
     */


    _class.prototype.sendTextQueryToApiAi = function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(sessionIds, handleApiAiResponse, sender, text, callback) {
            var params = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
            var sessionPath, request, responses, result;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            sessionPath = this.sessionClient.sessionPath(this.googleProjectId, sessionIds.get(sender));
                            request = {
                                session: sessionPath,
                                queryInput: {
                                    text: {
                                        text: text,
                                        languageCode: this.languageCode
                                    }
                                },
                                queryParams: {
                                    payload: {
                                        data: params
                                    }
                                }
                            };
                            _context.next = 4;
                            return this.sessionClient.detectIntent(request);

                        case 4:
                            responses = _context.sent;
                            result = responses[0].queryResult;

                            if (!callback) {
                                _context.next = 10;
                                break;
                            }

                            handleApiAiResponse(sender, result, callback);
                            _context.next = 11;
                            break;

                        case 10:
                            return _context.abrupt('return', handleApiAiResponse(sender, result));

                        case 11:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        function sendTextQueryToApiAi(_x2, _x3, _x4, _x5, _x6) {
            return _ref.apply(this, arguments);
        }

        return sendTextQueryToApiAi;
    }();

    /** Send an event to DialogFlow API
     * 
     * 
     * @method sendEventToApiAi()
     * 
     * @param {String} sessionIds                   Ids for actual session for send to API
     * @param {Function} handleApiAiResponse        CallBack for handle response
     * @param {*} sender                            Sender identifier
     * @param {Event} event                         Event to send
     * @param {Object} params                       API params
     * @param {Function} callback                   Callback for life-ciclyng
     * 
     * @returns callback handleApiAiResponse()
     * 
     */


    _class.prototype.sendEventToApiAi = function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(sessionIds, handleApiAiResponse, sender, event, callback) {
            var params = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
            var sessionPath, request, responses, result;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            sessionPath = this.sessionClient.sessionPath(this.googleProjectId, sessionIds.get(sender));
                            request = {
                                session: sessionPath,
                                queryInput: {
                                    event: {
                                        name: event,
                                        parameters: _structjson2.default.jsonToStructProto(params), //Dialogflow's v2 API uses gRPC. You'll need a jsonToStructProto method to convert your JavaScript object to a proto struct.
                                        languageCode: this.languageCode
                                    }
                                }
                            };
                            _context2.next = 4;
                            return this.sessionClient.detectIntent(request);

                        case 4:
                            responses = _context2.sent;
                            result = responses[0].queryResult;

                            handleApiAiResponse(sender, result, callback);

                        case 7:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        function sendEventToApiAi(_x8, _x9, _x10, _x11, _x12) {
            return _ref2.apply(this, arguments);
        }

        return sendEventToApiAi;
    }();

    return _class;
}();

exports.default = _class;
//# sourceMappingURL=dfProvider.js.map