'use strict';

var _config = require('./libs/config');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _wrLuLib = require('./wrlu-lib/wrLuLib');

var _wrLuLib2 = _interopRequireDefault(_wrLuLib);

var _init = require('./libs/init');

var _init2 = _interopRequireDefault(_init);

var _settings = require('./libs/settings');

var _settings2 = _interopRequireDefault(_settings);

var _index = require('./routes/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

(0, _settings2.default)(app, _config.constants);
(0, _index2.default)(app);

(0, _init2.default)(app);

var chatbot = new _wrLuLib2.default(app, _config.constants);

chatbot.start(app, function (res) {
	if (res.code === 200) {
		// console.log(`JSON RESPONSE ChatbotLib: \n ${JSON.stringify(res)}`);

		if (res.payload) {
			try {
				var data = res.payload;
				if (data.type == 'action' || data.type == 'messages' || data.type == 'quickReply') {
					// let defaultres = chatbot.handleDefault(res);
					var sender = chatbot.getSender();
					var buttons = [],
					    elements = [];

					if (data.type == 'action') {
						switch (data.action) {
							case 'order.status':
								{
									// console.log('Parametro de Orden: ');
									// console.log(data.params.fields.orderId[data.params.fields.orderId.kind]);
									if (data.params.fields.orderId[data.params.fields.orderId.kind]) {
										setTimeout(function () {
											chatbot.fbService.sendTextMessage(sender, 'Tu orden se encuentra en camino, con el número de orden puedes darle seguimiento :)');
										}, 3000);
									}
									break;
								}
						}
					}
					chatbot.handleDefault(res).then(function (dres) {
						if (dres) {
							chatbot.handleDefault(dres);
						}
					});

					// if(defaultres){
					// 	defaultres.then((x) => {
					// 		console.log('Default res');
					// 		console.log(JSON.stringify(defaultres));
					// 		console.log('Promise resolved');
					// 		console.log(JSON.stringify(x));
					// 		chatbot.handleDefault(x);
					// 	});
					// }

					var button = {
						type: 'web_url',
						title: 'See something great!',
						url: 'https://s3-eu-west-1.amazonaws.com/barkibu-blog/blog+images/diarrea-en-cachorros-recien-nacidos-causas-y-tratamiento/diarreacachorros2.jpg?'
					};
					buttons.push(button);

					var card = {
						title: 'Blue card',
						image_url: 'https://ucl.suzuki.co.uk/static/images/unity/suzukiucl/new/models/celerio.png',
						subtitle: 'Some card for you',
						buttons: buttons
					};

					elements.push(card);

					// setTimeout(() => {
					// 	// chatbot.fbService.sendTextMessage(sender,'Hi, i got a image for u');
					// 	// chatbot.fbService.sendFileMessage(sender,'https://ucl.suzuki.co.uk/static/images/unity/suzukiucl/new/models/celerio.png','image');
					// 	// chatbot.fbService.sendButtonMessage(sender,'Some cool Buttons',buttons);
					// 	// chatbot.fbService.sendGenericMessage(sender, elements);
					// },100);
				}
			} catch (err) {
				console.log('An error ocurred on chatbot process. Error: ' + err);
			}
		}
	}
});
//# sourceMappingURL=app.js.map