'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fbProvider = require('./providers/facebook/fbProvider');

var _fbProvider2 = _interopRequireDefault(_fbProvider);

var _dfProvider = require('./providers/dialogflow/dfProvider');

var _dfProvider2 = _interopRequireDefault(_dfProvider);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _commonObjects = require('./models/commonObjects');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** WrLu Chatbot lib
 * 
 * @name        WrLu Chatbot lib
 * 
 * @description Anonymus class to set and interact with a DialogFlow chatbot
 *              using API V2 & Facebook on version { 0.0.1 }.
 *              Future releases may expect another 3rth party chat platform
 *              up to Telegram or Slack.
 *              
 *              This lib is created to Node JS, you need to have you own
 *              DialogFlow bot prebuilded. Documentation is in process.
 * 
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @param {*} app 
 * @param {Object} config  This param is about the initial config for 
 *                         Facebook & DialogFlow service, the structure for the var
 *                         may be the following.
 * 
 *                          {
 *                              fb:{
 *                                  pageToken: '',
 *                                  verifyToken: '',
 *                                  appID: '',
 *                                  appSecret: '',
 *                                  graphMsgURL: 'https://graph.facebook.com/v2.6/me/messages'
 *                              },
 *                              gcp:{
 *                                  projectId: '',
 *                                  clientEmail: '',
 *                                  privateKey: '',
 *                                  languageCode: ''
 *                              }
 *                              webhookUri:''
 *                          }
 *                        
 */

var _class = function () {
    function _class(app, config) {
        _classCallCheck(this, _class);

        this.app = app;
        this.fbService = new _fbProvider2.default(config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret, config.fb.verifyToken);
        this.dfService = new _dfProvider2.default(config.gcp.projectId, config.gcp.clientEmail, config.gcp.privateKey, config.gcp.languageCode);
        this.sessionIds = new Map();
        this.response = _commonObjects.globalResponse;
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.start = this.start.bind(this);
        this.setSession = this.setSession.bind(this);

        this.handleResponse = this.handleResponse.bind(this);
        this.handleFbEvent = this.handleFbEvent.bind(this);
        this.handleDfResponse = this.handleDfResponse.bind(this);
        this.handleDfAction = this.handleDfAction.bind(this);
        this.handleDefault = this.handleDefault.bind(this);
    }

    /** Start bot
     * 
     * @param {*} app 
     * @param {Function} callback Function that will return on exec and init the bot
     */


    _createClass(_class, [{
        key: 'start',
        value: function start(app, callback) {
            var _this = this;

            try {
                this.fbService.setWebhook(app, function (res) {
                    _this.handleResponse(res, callback);
                });
            } catch (err) {
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'An error ocurred on setting fb service function: start() --- Error: ' + err;
                callback(this.response);
                return;
            }
        }

        /** Set session
         * 
         * @description Get the sender for setting a session for the live transactions
         * 
         * @param {*} senderID 
         * 
         * 
         */

    }, {
        key: 'setSession',
        value: function setSession(senderID) {
            if (!this.sessionIds.has(senderID)) {
                this.sessionIds.set(senderID, _uuid2.default.v1());
            }
        }

        /** Get Sender
         * 
         * @description Getting & validate sender for public use
         * 
         */

    }, {
        key: 'getSender',
        value: function getSender() {
            try {
                var it = this.sessionIds.keys();
                var sender = it.next().value;

                if (this.sessionIds.has(sender)) {
                    return sender;
                } else {
                    throw 'Sorry!, Invalid sender.';
                }
            } catch (err) {
                console.log('Something was wrong of getting sender. Error: ' + err);
            }
        }

        /** Handle Response
         * 
         * @param {*} res 
         * @param {Function} callback 
         * 
         * @description Using for handle the response from the 3rd party chat
         *              provider, in this case: Facebook. Just facebook is used
         *              on version { 0.0.1 }.
         * 
         * 
         */

    }, {
        key: 'handleResponse',
        value: function handleResponse(res, callback) {
            try {
                switch (res.origin) {
                    case 'facebook':
                        {
                            if (res.code === 200) {
                                this.handleFbEvent(res.payload, callback);
                            }
                        }
                }
            } catch (err) {
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'An error ocurred on function: handleResponse() --- Error: ' + err;
                callback(this.response);
                return;
            }
        }

        /** HandleFbEvent
         * 
         * @description function for using handle the facebook event
         *              comming from Fb API
         * 
         * @param {*} event 
         * @param {Function} callback 
         * 
         */

    }, {
        key: 'handleFbEvent',
        value: function handleFbEvent(event, callback) {

            // console.log(`Handling FB event, event: \n ${JSON.stringify(event)}`);
            // console.log(JSON.stringify(event));

            var senderID = {};

            try {
                senderID = event.sender.id;
                this.setSession(senderID);
            } catch (err) {
                console.log('An error ocurred trying set session : ' + err);
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'An error ocurred trying set session function: handleFBEvent() --- Error: ' + err;
                callback(this.response);
                return;
            }

            try {
                var payload = {};

                if (event.read) {
                    payload = {
                        type: 'read',
                        senderID: senderID,
                        read: event.read
                    };
                    this.response.payload = payload;
                    callback(this.response);
                    return;
                }

                var recipientID = event.recipient.id;
                var timeOfMessage = event.timestamp;
                var message = event.message;

                var isEcho = "";
                var messageId = "";
                var appId = "";
                var metadata = "";

                var messageText = "";
                var messageAttachments = "";
                var quickReply = "";

                if (message) {

                    isEcho = message.is_echo;
                    messageId = message.mid;
                    appId = message.app_id;
                    metadata = message.metadata;

                    /**
                     * 
                     * @description You can get text or attachments, not both
                     */

                    messageText = message.text;
                    messageAttachments = message.attachments;
                    quickReply = message.quick_reply;

                    payload = {
                        type: '',
                        senderID: senderID,
                        messageId: messageId,
                        appId: appId,
                        metadata: metadata
                    };
                }

                this.response.code = 200;
                this.response.status = 'success';
                this.response.origin = 'fbEvent';

                if (isEcho) {
                    payload.type = 'echo';
                    this.response.payload = payload;
                    callback(this.response);
                    return;
                } else if (quickReply) {
                    this.fbService.sendTypingOn(senderID);
                    payload.type = 'quickReply';
                    payload.quickReply = quickReply;
                    this.response.payload = payload;
                    callback(this.response);
                    return;
                }

                this.fbService.sendTypingOn(senderID);

                if (messageText) {
                    this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, senderID, messageText, callback);
                    return;
                } else if (messageAttachments) {
                    payload.type = 'attachments';
                    payload.attachments = messageAttachments;
                    this.response.payload = payload;
                    callback(this.response);
                    return;
                }
            } catch (err) {
                console.log('An error ocurred on handling facebook event; error: ' + err);
            }
        }

        /** HandleDfResponse
         * 
         * @description handle dialog flow response from the API (Df API V2)
         * 
         * @param {*} sender 
         * @param {*} response 
         * @param {Function} callback 
         */

    }, {
        key: 'handleDfResponse',
        value: function handleDfResponse(sender, response, callback) {

            console.log('Handling dialog flow response');
            // console.log(JSON.stringify(response));

            var responseText = response.fulfillmentText;

            var messages = response.fulfillmentMessages;
            var action = response.action;
            var contexts = response.outputContexts;
            var parameters = response.parameters;

            var payload = {
                sender: sender,
                messages: messages,
                contexts: contexts,
                params: parameters,
                type: ''
            };

            try {
                if (action) {
                    this.response.code = 200;
                    this.response.status = 'success';
                    payload.type = 'action';
                    payload.action = action;
                } else if (messages) {

                    this.response.code = 200;
                    this.response.status = 'success';
                    payload.type = 'messages';

                    this.fbService.handleMessages(messages, sender);
                } else if (responseText) {

                    this.response.code = 200;
                    this.response.status = 'success';
                    payload.type = 'responseText';

                    this.fbService.sendTextMessage(sender, responseText);
                } else if (responseText == '' && !action) {
                    /**
                     * @description On this case, DialogFlow coudn't evaluate the input, showing the unsolved query.
                     */
                    console.log('Unknown query' + response.result.resolvedQuery);
                    this.fbService.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");

                    this.response.code = 500;
                    this.response.status = 'error';
                    this.response.payload = 'Unknown query' + response.result.resolvedQuery;
                }

                this.response.payload = payload;
                this.response.origin = 'dfResponse';

                if (callback) {
                    callback(this.response);
                    return;
                } else {
                    console.log('Callback undefined');
                    return this.response;
                }
            } catch (err) {
                console.log('An error ocurred : ' + err + ', method: handleDfResponse');
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'An error ocurred function: handleDfResponse() --- Error: ' + err;
                if (callback) {
                    callback(this.response);
                    return;
                } else {
                    return;
                }
            }
        }

        /** HandleDfAction
         * 
         * 
         * @param {*} sender 
         * @param {*} action 
         * @param {Array} messages 
         * @param {*} contexts 
         * @param {*} parameters 
         * 
         */

    }, {
        key: 'handleDfAction',
        value: function handleDfAction(sender, action, messages, contexts, parameters) {

            switch (action) {
                default:
                    //unhandled action, just send back the text
                    this.fbService.handleMessages(messages, sender);
            }
        }

        /** HandleDefault
         * 
         * 
         * @param {*} response 
         */

    }, {
        key: 'handleDefault',
        value: function handleDefault(response) {
            try {
                console.log('Handling response by default option');
                // console.log(JSON.stringify(response));
                switch (response.payload.type) {
                    case 'action':
                        {
                            this.fbService.handleMessages(response.payload.messages, response.payload.sender);
                            break;
                        }
                    case 'messages':
                        {
                            this.fbService.handleMessages(response.payload.messages, response.payload.sender);
                            break;
                        }
                    case 'quickReply':
                        {
                            return this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, response.payload.senderID, response.payload.quickReply.payload);
                            break;
                        }
                    case 'echo':
                        {
                            console.log('Echo recieved');
                            /* PENDING */
                            // this.fbService.handleEcho(response.payload.messageId, response.payload.appId, response.payload.metadata);
                            break;
                        }
                }
            } catch (err) {
                // console.log(`An error ocurred : ${err}, method: handleDefault. Response: ${JSON.stringify(response)} `);
            }
        }
    }]);

    return _class;
}();

exports.default = _class;
//# sourceMappingURL=wrLuLib.js.map