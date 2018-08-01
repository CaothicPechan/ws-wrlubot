


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
		console.log('JSON RESPONSE ChatbotLib');
		console.log(JSON.stringify(res));
		if(res.payload){
			try{

				if(res.payload.type == 'action'){
					chatbot.handleDefault(res);
					let sender = chatbot.getSender();
					console.log('Sender id catched -->');
					console.log(sender);
					setTimeout(() => {
						chatbot.fbService.sendTextMessage(sender,'Hi, i got a image for u');
						chatbot.fbService.sendFileMessage(sender,'https://ucl.suzuki.co.uk/static/images/unity/suzukiucl/new/models/celerio.png','image');
					},1100);
					
				}

			}catch(err){
				console.log(`An error ocurred on chatbot process. Error: ${err}`);
			}
		}
	}
});
