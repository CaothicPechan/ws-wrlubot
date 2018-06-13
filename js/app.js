


import { constants } from './libs/config'
import express from 'express'
import bodyParser from 'body-parser'
import request from 'request'
import passport from 'passport'
import { Strategy } from 'passport-facebook'
import session from 'express-session'
import uuid from 'uuid'

import init from './libs/init'
import settings from './libs/settings'

import router from './routes/index'

import './models/facebookObjects'
import { Button } from './models/facebookObjects';




const app = express();

settings(app, constants);
router(app);


init(app);
