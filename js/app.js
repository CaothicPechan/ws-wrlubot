


import { constants } from './libs/config'
import express from 'express'
import bodyParser from 'body-parser'

import wrluLib from './wrlu-lib/wrLuLib'
// import wrluLib from './wrLuLib'

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
		if(res.payload){
			if(res.payload.type == 'action'){
				chatbot.handleDefault(res);
				let session = chatbot.sessionIds;
				console.log('Session: -->');
				console.log(session);
			}
		}
	}
});
