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

var _fbProvider = require('./providers/facebook/fbProvider');

var _fbProvider2 = _interopRequireDefault(_fbProvider);

var _dfProvider = require('./providers/dialogflow/dfProvider');

var _dfProvider2 = _interopRequireDefault(_dfProvider);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

(0, _settings2.default)(app, _config.constants);
(0, _index2.default)(app);

(0, _init2.default)(app);

var fbService = new _fbProvider2.default(_config.constants.fb.graphMsgURL, _config.constants.fb.pageToken);
var dfService = new _dfProvider2.default(_config.constants.googleProjectId, fbService);

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));

	// Make sure this is a page subscription
	if (data.object == 'page') {

		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;
			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					fbService.receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					fbService.receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					fbService.receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					fbService.receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});

function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	setSessionAndUser(senderID);

	//console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	//console.log(JSON.stringify(message));


	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		fbService.handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}

	if (messageText) {
		//send message to api.ai
		dfService.sendTextQueryToApiAi(sessionIds, handleApiAiResponse, senderID, messageText);
	} else if (messageAttachments) {
		fbService.handleMessageAttachments(messageAttachments, senderID);
	}
}

function handleApiAiResponse(sender, response) {

	var responseText = response.result.fulfillment.speech;
	var responseData = response.result.fulfillment.data;
	var messages = response.result.fulfillment.messages;
	var action = response.result.action;
	var contexts = response.result.contexts;
	var parameters = response.result.parameters;

	fbService.sendTypingOff(sender);

	if (isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {
		var timeoutInterval = 1100;
		var previousType = void 0;
		var cardTypes = [];
		var timeout = 0;
		for (var i = 0; i < messages.length; i++) {

			if (previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {

				timeout = (i - 1) * timeoutInterval;
				setTimeout(fbService.handleCardMessages.bind(null, cardTypes, sender), timeout);
				cardTypes = [];
				timeout = i * timeoutInterval;
				setTimeout(fbService.handleMessage.bind(null, messages[i], sender), timeout);
			} else if (messages[i].type == 1 && i == messages.length - 1) {
				cardTypes.push(messages[i]);
				timeout = (i - 1) * timeoutInterval;
				setTimeout(fbService.handleCardMessages.bind(null, cardTypes, sender), timeout);
				cardTypes = [];
			} else if (messages[i].type == 1) {
				cardTypes.push(messages[i]);
			} else {
				timeout = i * timeoutInterval;
				setTimeout(fbService.handleMessage.bind(null, messages[i], sender), timeout);
			}

			previousType = messages[i].type;
		}
	} else if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input.
		//console.log('Unknown query' + response.result.resolvedQuery);
		fbService.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			fbService.sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			fbService.sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {
		fbService.sendTextMessage(sender, responseText);
	}
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
	switch (action) {
		case "unsubscribe":
			userService.newsletterSettings(function (updated) {
				if (updated) {
					fbService.sendTextMessage(sender, "You're unsubscribed. You can always subscribe back!");
				} else {
					fbService.sendTextMessage(sender, "Newsletter is not available at this moment." + "Try again later!");
				}
			}, 0, sender);
			break;
		case "buy.iphone":
			colors.readUserColor(function (color) {
				var reply = void 0;
				if (color === '') {
					reply = 'In what color would you like to have it?';
				} else {
					reply = 'Would you like to order it in your favourite color ' + color + '?';
				}
				fbService.sendTextMessage(sender, reply);
			}, sender);
			break;
		case "iphone_colors.favourite":
			colors.updateUserColor(parameters['color'], sender);
			var reply = 'Oh, I like it, too. I\'ll remember that.';
			fbService.sendTextMessage(sender, reply);

			break;
		case "iphone-colors":
			colors.readAllColors(function (allColors) {
				var allColorsString = allColors.join(', ');
				var reply = 'IPhone 8 is available in ' + allColorsString + '. What is your favourite color?';
				fbService.sendTextMessage(sender, reply);
			});

			break;
		case "faq-delivery":
			fbService.sendTextMessage(sender, responseText);
			fbService.sendTypingOn(sender);

			//ask what user wants to do next
			setTimeout(function () {
				var buttons = [{
					type: "web_url",
					url: "https://www.myapple.com/track_order",
					title: "Track my order"
				}, {
					type: "phone_number",
					title: "Call us",
					payload: "+16505551234"
				}, {
					type: "postback",
					title: "Keep on Chatting",
					payload: "CHAT"
				}];

				fbService.sendButtonMessage(sender, "What would you like to do next?", buttons);
			}, 3000);

			break;
		case "detailed-application":
			if (isDefined(contexts[0]) && (contexts[0].name == 'job_application' || contexts[0].name == 'job-application-details_dialog_context') && contexts[0].parameters) {
				var phone_number = isDefined(contexts[0].parameters['phone-number']) && contexts[0].parameters['phone-number'] != '' ? contexts[0].parameters['phone-number'] : '';
				var user_name = isDefined(contexts[0].parameters['user-name']) && contexts[0].parameters['user-name'] != '' ? contexts[0].parameters['user-name'] : '';
				var previous_job = isDefined(contexts[0].parameters['previous-job']) && contexts[0].parameters['previous-job'] != '' ? contexts[0].parameters['previous-job'] : '';
				var years_of_experience = isDefined(contexts[0].parameters['years-of-experience']) && contexts[0].parameters['years-of-experience'] != '' ? contexts[0].parameters['years-of-experience'] : '';
				var job_vacancy = isDefined(contexts[0].parameters['job-vacancy']) && contexts[0].parameters['job-vacancy'] != '' ? contexts[0].parameters['job-vacancy'] : '';

				if (phone_number == '' && user_name != '' && previous_job != '' && years_of_experience == '') {

					var _replies = [{
						"content_type": "text",
						"title": "Less than 1 year",
						"payload": "Less than 1 year"
					}, {
						"content_type": "text",
						"title": "Less than 10 years",
						"payload": "Less than 10 years"
					}, {
						"content_type": "text",
						"title": "More than 10 years",
						"payload": "More than 10 years"
					}];
					fbService.sendQuickReply(sender, responseText, _replies);
				} else if (phone_number != '' && user_name != '' && previous_job != '' && years_of_experience != '' && job_vacancy != '') {
					jobApplicationCreate(phone_number, user_name, previous_job, years_of_experience, job_vacancy);
					fbService.sendTextMessage(sender, responseText);
				} else {
					fbService.sendTextMessage(sender, responseText);
				}
			}
			break;
		case "job-enquiry":
			var replies = [{
				"content_type": "text",
				"title": "Accountant",
				"payload": "Accountant"
			}, {
				"content_type": "text",
				"title": "Sales",
				"payload": "Sales"
			}, {
				"content_type": "text",
				"title": "Not interested",
				"payload": "Not interested"
			}];
			fbService.sendQuickReply(sender, responseText, replies);
			break;
		default:
			//unhandled action, just send back the text
			//console.log("send responce in handle actiongit: " + responseText);
			fbService.sendTextMessage(sender, responseText);
	}
}
//# sourceMappingURL=app.js.map