'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _commonObjects = require('../../models/commonObjects');

var _utils = require('../../utils/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 
 * 
 * @description Anonymus class to get the functions for using Facebook API.
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @argument {String} graphMsgURL       URL from Facebook Graph API
 * @argument {String} pageToken         Facebook token page
 * @argument {String} appSecret         App key secret from facebook app
 * @argument {String} verifyToken       Verify Token from facebook app
 * @argument {String} webhookUri        URL for setting the webhook for verifying fb request
 *                                      default = '@/webhook/'
 */

var _class = function () {
    function _class(graphMsgURL, pageToken, appSecret, verifyToken) {
        var webhookUri = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '/webhook/';

        _classCallCheck(this, _class);

        this.constants = {};
        this.constants.graphMsgURL = graphMsgURL + 'messages';
        this.constants.graphMsAttURL = graphMsgURL + 'message_attachments';
        this.constants.pageToken = pageToken;
        this.constants.appSecret = appSecret;
        this.constants.verifyToken = verifyToken;
        this.constants.webhookUri = webhookUri;

        this.wrResponse = _commonObjects.wrResponse;

        this.handleMessage = this.handleMessage.bind(this);
        this.handleMessages = this.handleMessages.bind(this);
        this.handleCardMessages = this.handleCardMessages.bind(this);

        this.receivedMessageRead = this.receivedMessageRead.bind(this);
        this.receivedAccountLink = this.receivedAccountLink.bind(this);
        this.receivedAuthentication = this.receivedAuthentication.bind(this);
        this.receivedDeliveryConfirmation = this.receivedDeliveryConfirmation.bind(this);

        this.setWebhook = this.setWebhook.bind(this);
        this.callSendAPI = this.callSendAPI.bind(this);

        this.sendFileMessage = this.sendFileMessage.bind(this);
        this.sendButtonMessage = this.sendButtonMessage.bind(this);
        this.sendGenericMessage = this.sendGenericMessage.bind(this);
        this.sendTextMessage = this.sendTextMessage.bind(this);
        this.sendReceiptMessage = this.sendReceiptMessage.bind(this);
        this.sendQuickReply = this.sendQuickReply.bind(this);
        this.sendAccountLinking = this.sendAccountLinking.bind(this);

        this.verifyRequestSignature = this.verifyRequestSignature.bind(this);
    }

    /** Init methods **
     * 
     * 
     */
    /** Set Webhook
     * 
     * @description setting facebook webwook for 
     * catchin' fb events
     * 
     * @param {*} app actual app node module 
     * @param {Function} callback Function for callback when 
     *                            some event gets handled
     */


    _createClass(_class, [{
        key: 'setWebhook',
        value: function setWebhook(app, callback) {
            var _this = this;

            console.log('Setting webhook');

            /** Verifying Facebook Request **/
            app.use(_bodyParser2.default.json({
                verify: this.verifyRequestSignature
            }));

            app.get(this.constants.webhookUri, function (req, res) {
                if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === _this.constants.verifyToken) {
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    console.error("Failed validation. Make sure the validation tokens match.");
                    res.sendStatus(403);
                }
            });

            app.post(this.constants.webhookUri, function (req, res) {
                var data = req.body;

                // Make sure this is a page subscription                
                if (data.object == 'page') {

                    /**
                     * Iterate over each entry 
                     * There may be multiple if batched
                     * */

                    data.entry.forEach(function (pageEntry) {
                        var pageID = pageEntry.id;
                        var timeOfEvent = pageEntry.time;

                        pageEntry.messaging.forEach(function (messagingEvent) {
                            if (messagingEvent.optin) {
                                _this.receivedAuthentication(messagingEvent, callback);
                            } else if (messagingEvent.message) {
                                console.log('FbProvider: Message event received');
                                _this.wrResponse.payload = messagingEvent;
                                _this.wrResponse.eventType = 'message';
                                callback(_this.wrResponse);
                            } else if (messagingEvent.delivery) {
                                _this.receivedDeliveryConfirmation(messagingEvent, callback);
                            } else if (messagingEvent.postback) {
                                console.log('FbProvider: Message event postback received');
                                _this.wrResponse.payload = messagingEvent;
                                _this.wrResponse.eventType = 'postback';
                                callback(_this.wrResponse);
                            } else if (messagingEvent.read) {
                                _this.receivedMessageRead(messagingEvent, callback);
                            } else if (messagingEvent.account_linking) {
                                _this.receivedAccountLink(messagingEvent, callback);
                            } else {
                                console.log("FbProvier: Webhook received unknown messagingEvent: ", messagingEvent);
                            }
                        });
                    });

                    res.sendStatus(200);
                }
            });
        }

        /** Handle methods **
         * 
         */
        /** Handle message
         * 
         * @param {String} message 
         * @param {String} sender   Sender identifier
         */

    }, {
        key: 'handleMessage',
        value: function handleMessage(message, sender) {
            var _this2 = this;

            switch (message.message) {
                case "text":
                    message.text.text.map(function (text) {
                        if (text !== '') {
                            _this2.sendTextMessage(sender, text);
                        }
                    });
                    break;
                case "quickReplies":
                    var replies = [];
                    message.quickReplies.quickReplies.map(function (text) {
                        var reply = {
                            "content_type": "text",
                            "title": text,
                            "payload": text
                        };
                        replies.push(reply);
                    });
                    this.sendQuickReply(sender, message.quickReplies.title, replies);
                    break;
                case "image":
                    this.sendFileMessage(sender, message.image.imageUri, 'image');
                    break;
                case "video":
                    this.sendFileMessage(sender, message.image.imageUri, 'video');
                    break;
                case "audio":
                    this.sendFileMessage(sender, message.image.imageUri, 'audio');
                    break;
                case "file":
                    this.sendFileMessage(sender, message.image.imageUri, 'file');
                    break;
                default:
                    console.log('Can\'t handle message response, message: ' + message);
            }
        }

        /** Handle messages
         * 
         * @param {Array} messages 
         * @param {String} sender 
         */

    }, {
        key: 'handleMessages',
        value: function handleMessages(messages, sender) {
            var _this3 = this;

            var cardTypes = [];

            messages.map(function (messageObj) {
                if (messageObj.message == 'card') {
                    cardTypes.push(messageObj);
                }
            });

            messages.map(function (messageObj) {
                (0, _utils.sleep)(1000);
                if (messageObj.message != 'card') {
                    _this3.handleMessage(messageObj, sender);
                }
            });

            if (cardTypes.length > 0) {
                (0, _utils.sleep)(100);
                this.handleCardMessages(cardTypes, sender);
            }
        }

        /** Handle cards messages
         * 
         * @param {Array} messages 
         * @param {String} sender 
         */

    }, {
        key: 'handleCardMessages',
        value: function handleCardMessages(messages, sender) {
            var elements = [];
            for (var m = 0; m < messages.length; m++) {
                var message = messages[m];

                var buttons = [];
                for (var b = 0; b < message.card.buttons.length; b++) {
                    var isLink = message.card.buttons[b].postback.substring(0, 4) === 'http';
                    var button = void 0;
                    if (isLink) {
                        button = {
                            "type": "web_url",
                            "title": message.card.buttons[b].text,
                            "url": message.card.buttons[b].postback
                        };
                    } else {
                        button = {
                            "type": "postback",
                            "title": message.card.buttons[b].text,
                            "payload": message.card.buttons[b].postback
                        };
                    }
                    buttons.push(button);
                }

                var element = {
                    "title": message.card.title,
                    "image_url": message.card.imageUri,
                    "subtitle": message.card.subtitle,
                    "buttons": buttons
                };
                elements.push(element);
            }

            this.sendGenericMessage(sender, elements);
        }

        /** Events Section **
         *
         *  @description Events functions.
         */

        /** Message Read Event
         * 
         * @param {*} event
         * 
         * @description This event is called when a previously-sent message has been read.
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
         *
         */

    }, {
        key: 'receivedMessageRead',
        value: function receivedMessageRead(event, callback) {
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;

            // All messages before watermark (a timestamp) or sequence have been seen.
            var watermark = event.read.watermark;
            var sequenceNumber = event.read.seq;

            console.log("FbProvider: Received message read event for watermark %d and sequence " + "number %d", watermark, sequenceNumber);

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'recieved-message';
            callback(this.wrResponse);
        }

        /** Account Link Event
         * 
         *
         * @description This event is called when the Link Account or UnLink Account action has been
         * tapped.
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
         *
         */

    }, {
        key: 'receivedAccountLink',
        value: function receivedAccountLink(event) {
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;

            var status = event.account_linking.status;
            var authCode = event.account_linking.authorization_code;

            console.log("FbProvider: Received account link event with for user %d with status %s " + "and auth code %s ", senderID, status, authCode);

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'account-link';
            callback(this.wrResponse);
        }

        /** Delivery Confirmation Event
         * 
         *
         * @description This event is sent to confirm the delivery of a message. Read more about
         * these fields at @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
         *
         */

    }, {
        key: 'receivedDeliveryConfirmation',
        value: function receivedDeliveryConfirmation(event, callback) {
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;
            var delivery = event.delivery;
            var messageIDs = delivery.mids;
            var watermark = delivery.watermark;
            var sequenceNumber = delivery.seq;

            if (messageIDs) {
                messageIDs.forEach(function (messageID) {
                    console.log("FbProvider: Received delivery confirmation for message ID: %s", messageID);
                });
            }

            console.log("FbProvider: All message before %d were delivered.", watermark);

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'delivery-confirm';
            callback(this.wrResponse);
        }

        /** Authorization Event
         *
         * @description The value for 'optin.ref' is defined in the entry point. For the "Send to
         * Messenger" plugin, it is the 'data-ref' field. Read more at
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
         *
         * The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
         * The developer can set this to an arbitrary value to associate the
         * authentication callback with the 'Send to Messenger' click event. This is
         * a way to do account linking when the user clicks the 'Send to Messenger'
         * plugin.
         * 
         * 
         * When an authentication is received, we'll send a message back to the sender
         * to let them know it was successful.
         * 
         */

    }, {
        key: 'receivedAuthentication',
        value: function receivedAuthentication(event) {
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;
            var timeOfAuth = event.timestamp;
            var passThroughParam = event.optin.ref;

            console.log("FbProvider: Received authentication for user %d and page %d with pass " + "through param '%s' at %d", senderID, recipientID, passThroughParam, timeOfAuth);

            this.sendTextMessage(senderID, "Authentication successful");

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'delivery-confirm';
            callback(this.wrResponse);
        }

        /** Verify that the callback came from Facebook. 
         * @description Using the App Secret from
         * the App Dashboard, we can verify the signature that is sent with each
         * callback in the x-hub-signature field, located in the header.
         *
         * @link https://developers.facebook.com/docs/graph-api/webhooks#setup
         *
         */

    }, {
        key: 'verifyRequestSignature',
        value: function verifyRequestSignature(req, res, buf) {
            var signature = req.headers["x-hub-signature"];
            console.log('FbProvider: Verifying RequestSignature');
            if (!signature) {
                throw new Error('FbProvider: Couldn\'t validate the signature.');
            } else {
                var elements = signature.split('=');
                var method = elements[0];
                var signatureHash = elements[1];

                var expectedHash = _crypto2.default.createHmac('sha1', this.constants.appSecret).update(buf).digest('hex');

                if (signatureHash != expectedHash) {
                    throw new Error("FbProvider: Couldn't validate the request signature.");
                    console.log("FbProvider: Couldn't validate the request signature.");
                }
            }
        }

        /** Send Text Message
         * 
         * @param {String} recipientId 
         * @param {String} text 
         */

    }, {
        key: 'sendTextMessage',
        value: function sendTextMessage(recipientId, text) {
            (0, _utils.sleep)(1000);
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: text
                }
            };
            this.callSendAPI(messageData);
        }

        /** Send receipt message
         * 
         * @param {*} recipientId 
         * @param {*} recipient_name 
         * @param {*} currency 
         * @param {*} payment_method 
         * @param {*} timestamp 
         * @param {*} elements 
         * @param {*} address 
         * @param {*} summary 
         * @param {*} adjustments 
         */

    }, {
        key: 'sendReceiptMessage',
        value: function sendReceiptMessage(recipientId, recipient_name, currency, payment_method, timestamp, elements, address, summary, adjustments) {

            var receiptId = "order" + Math.floor(Math.random() * 1000);
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: recipient_name,
                            order_number: receiptId,
                            currency: currency,
                            payment_method: payment_method,
                            timestamp: timestamp,
                            elements: elements,
                            address: address,
                            summary: summary,
                            adjustments: adjustments
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /** Send quick reply
         * 
         * @param {*} recipientId 
         * @param {*} text 
         * @param {*} replies 
         * @param {*} metadata 
         */

    }, {
        key: 'sendQuickReply',
        value: function sendQuickReply(recipientId, text, replies, metadata) {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: text,
                    metadata: metadata ? metadata : '',
                    quick_replies: replies
                }
            };
            this.callSendAPI(messageData);
        }

        /** Send file message
         * 
         * @description Function for sending file/media mesasages
         * video/audio/gif/image/file
         * 
         * @template type Type of files using by facebook: image,video,file
         * check fb documentation.
         * 
         * @param {*} recipientId 
         * @param {String} url 
         * @param {String} type 
         */

    }, {
        key: 'sendFileMessage',
        value: function sendFileMessage(recipientId, url, type) {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: type,
                        payload: {
                            url: url
                        }
                    }
                }
            };
            this.callSendAPI(messageData, true);
        }

        /** Send button message
         * 
         * @param {*} recipientId 
         * @param {*} text 
         * @param {*} buttons 
         */

    }, {
        key: 'sendButtonMessage',
        value: function sendButtonMessage(recipientId, text, buttons) {

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: text,
                            buttons: buttons
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /** Send Generic Message
         * 
         * @param {*} recipientId 
         * @param {*} elements 
         */

    }, {
        key: 'sendGenericMessage',
        value: function sendGenericMessage(recipientId, elements) {

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: elements
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /**Send a read receipt to indicate the message has been read
         * 
         * @param {*} recipientId 
         */

    }, {
        key: 'sendReadReceipt',
        value: function sendReadReceipt(recipientId) {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "mark_seen"
            };

            this.callSendAPI(messageData);
        }

        /**Turn typing indicator on
         * 
         * @param {*} recipientId 
         */

    }, {
        key: 'sendTypingOn',
        value: function sendTypingOn(recipientId) {
            console.log("Turning typing indicator on");
            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "typing_on"
            };

            this.callSendAPI(messageData);
        }

        /**Turn typing indicator off
         * 
         * @param {*} recipientId 
         */

    }, {
        key: 'sendTypingOff',
        value: function sendTypingOff(recipientId) {
            console.log("Turning typing indicator off");
            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "typing_off"
            };

            this.callSendAPI(messageData);
        }

        /** Send a message with the account linking call-to-action
         * 
         * @param {*} recipientId 
         */

    }, {
        key: 'sendAccountLinking',
        value: function sendAccountLinking(recipientId, text, authUri) {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: text,
                            buttons: [{
                                type: "account_link",
                                url: authUri + "/authorize"
                            }]
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /** Call the Send API.
         * 
         * @description The message data goes in the body. If successful, we'll
         * get the message id in a response
         * 
         * @param {*} messageData 
         */

    }, {
        key: 'callSendAPI',
        value: function callSendAPI(messageData) {
            var attach = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


            var url = attach ? this.constants.graphMsAttURL : this.constants.graphMsgURL;

            (0, _request2.default)({
                uri: this.constants.graphMsgURL,
                qs: {
                    access_token: this.constants.pageToken
                },
                method: 'POST',
                json: messageData

            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var recipientId = body.recipient_id;
                    var messageId = body.message_id;

                    if (messageId) {
                        console.log("FbProvider: Successfully sent message with id %s to recipient %s", messageId, recipientId);
                    } else {
                        console.log("FbProvider: Successfully called Send API for recipient %s", recipientId);
                    }
                } else {
                    console.log("FbProvider: Failed calling Send API");
                    console.log(JSON.stringify(response.body));
                }
            });
        }
    }]);

    return _class;
}();

exports.default = _class;
//# sourceMappingURL=fbProvider.js.map