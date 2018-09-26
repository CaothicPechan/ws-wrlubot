


import { constants } from './libs/config'
import express from 'express'

import wrluLib from './wrlu-lib/wrLuLib'

import init from './libs/init'
import settings from './libs/settings'
import router from './routes/index'




const app = express();

settings(app, constants);
router(app);


init(app);

let chatbot = new wrluLib(app, constants);

chatbot.start(app,(res) => {
	if(res.code === 200){
		console.log(`JSON RESPONSE ChatbotLib: ${JSON.stringify(res)}`);
		
		if(res.payload){
			try{
				let data = res.payload;
				if(data.type == 'action' || data.type == 'messages' || data.type == 'quickReply' || data.type == "postback"){
					// let defaultres = chatbot.handleDefault(res);
					let sender = chatbot.getSender();
					let buttons = [], elements = [];

					let userInfo;
					

					if(data.type == 'action'){

						

						switch(data.action){
							case 'order.status':{
								// console.log('Parametro de Orden: ');
								// console.log(data.params.fields.orderId[data.params.fields.orderId.kind]);
								if(data.params.fields.orderId[data.params.fields.orderId.kind]){
									setTimeout( () => 
									{
										chatbot.fbService.sendTextMessage(sender,'Tu orden se encuentra en camino, con el número de orden puedes darle seguimiento :)');
									}, 3000);
								}
								break;
							}
							case 'input.welcome':{
								chatbot.fbService.getUserInfo(sender,(u) => {
									userInfo = u;
									console.log(`User info ${JSON.stringify(userInfo)}`);
									chatbot.fbService.sendTextMessage(sender,`Oh! ${userInfo.payload.first_name} has vuelto. ¿Cómo te puedo ayudar?`);
									console.log('callbacking');
									console.log(u);
								});
							}
						}
					}
					chatbot.handleDefault(res).then((dres) => {
						if(dres){
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

					let button = {
						type: 'web_url',
						title: 'See something great!',
						url: 'https://s3-eu-west-1.amazonaws.com/barkibu-blog/blog+images/diarrea-en-cachorros-recien-nacidos-causas-y-tratamiento/diarreacachorros2.jpg?'
					};
					buttons.push(button);

					let card = {
						title: 'Blue card',
						image_url:'https://ucl.suzuki.co.uk/static/images/unity/suzukiucl/new/models/celerio.png',
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

			}catch(err){
				console.log(`An error ocurred on chatbot process. Error: ${err}`);
			}
		}
	}
});
