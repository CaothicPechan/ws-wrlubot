
import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'
import uuid from 'uuid'



export default class {

    constructor(app, config){
        this.app = app;
        this.fbService = new fbProvider(config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret, config.fb.verifyToken);
        this.dfService = new dfProvider(config.googleProjectId, this.fbService);
        this.sessionIds = new Map();
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.start = this.start.bind(this);
        this.setSession = this.setSession.bind(this);
    }

    start(app, callback){
        this.fbService.setWebhook(app, (res) => {
            callback(res);
        });        
    }

    setSession(senderID) {
        if (!this.sessionIds.has(senderID)) {
            this.sessionIds.set(senderID, uuid.v1());
        }
    }
}