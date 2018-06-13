'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
    function _class(app, constants) {
        var basePath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        _classCallCheck(this, _class);

        this.app = app;
        this.constants = constants;
        this.basePath = 'http://' + basePath;
    }

    _createClass(_class, [{
        key: 'handleMessageAttachments',
        value: function handleMessageAttachments(messageAttachments, senderID) {
            this.sendTextMessage(senderID, "Attachment received. Thank you.");
        }
    }, {
        key: 'handleEcho',
        value: function handleEcho(messageId, appId, metadata) {
            console.log('Received echo for message ' + messageId + ' and app ' + appId + ' with metadata ' + metadata);
        }
    }, {
        key: 'handleMessage',
        value: function handleMessage(message, sender) {

            switch (message.type) {
                case 0:
                    //text
                    this.sendTextMessage(sender, message.speech);
                    break;

                case 2:
                    //quick replies
                    var replies = [];
                    for (var b = 0; b < message.replies.length; b++) {
                        var reply = {
                            "content_type": "text",
                            "title": message.replies[b],
                            "payload": message.replies[b]
                        };
                        replies.push(reply);
                    }
                    this.sendQuickReply(sender, message.title, replies);
                    break;

                case 3:
                    //image
                    this.sendImageMessage(sender, message.imageUrl);

                    break;

                case 4:
                    // custom payload
                    var messageData = {
                        recipient: {
                            id: sender
                        },
                        message: message.payload.facebook

                    };

                    this.callSendAPI(messageData);

                    break;
            }
        }
    }, {
        key: 'handleCardMessages',
        value: function handleCardMessages(messages, sender) {
            var elements = [];

            if (messages) {
                messages.map(function (m) {
                    var buttons = [];

                    m.buttons.map(function (b) {
                        var isLink = b.postback.substring(0, 4) === 'http';
                        var button = void 0;
                        if (isLink) {
                            button = {
                                "type": "web_url",
                                "title": message.buttons[b].text,
                                "url": message.buttons[b].postback
                            };
                        } else {
                            button = {
                                "type": "postback",
                                "title": message.buttons[b].text,
                                "payload": message.buttons[b].postback
                            };
                        }
                        buttons.push(button);
                    });
                });
            }

            for (var m = 0; m < messages.length; m++) {
                var _message = messages[m];
                var buttons = [];

                for (var b = 0; b < _message.buttons.length; b++) {
                    var isLink = _message.buttons[b].postback.substring(0, 4) === 'http';
                    var button = void 0;
                    if (isLink) {
                        button = {
                            "type": "web_url",
                            "title": _message.buttons[b].text,
                            "url": _message.buttons[b].postback
                        };
                    } else {
                        button = {
                            "type": "postback",
                            "title": _message.buttons[b].text,
                            "payload": _message.buttons[b].postback
                        };
                    }
                    buttons.push(button);
                }

                var element = {
                    "title": _message.title,
                    "image_url": _message.imageUrl,
                    "subtitle": _message.subtitle,
                    "buttons": buttons
                };
                elements.push(element);
            }
            console.log('card message');
            console.log(elements);
            self.sendGenericMessage(sender, elements);
        }
    }]);

    return _class;
}();

exports.default = _class;
//# sourceMappingURL=fbProvider.js.map