
import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'



export default class {

    constructor(app, config){
        this.app = app;
        this.fbService = new fbProvider(config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret);
        this.dfService = new dfProvider(config.googleProjectId, fbService);
        this.sessionIds = new Map();
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.setWebhook = this.setWebhook.bind(this);
    }

    setWebhook(){

        app.get(this.webhookUri, (req, res) => {
            if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.config.fb.verifyToken) {
                res.status(200).send(req.query['hub.challenge']);
            } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
            }
        });

        this.app.post(this.webhookUri,() => {

        })
    }
}