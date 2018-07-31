


import { constants } from './libs/config'
import express from 'express'
import bodyParser from 'body-parser'
import request from 'request'
import passport from 'passport'
import { Strategy } from 'passport-facebook'
import session from 'express-session'
import uuid from 'uuid'

import wrluLib from './wrlu-lib/wrLuLib'
import init from './libs/init'
import settings from './libs/settings'

import router from './routes/index'

import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'





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
			}
		}
	}
});
