
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
            this.handleResponse(res);
            callback(200);
        });        
    }

    setSession(senderID) {
        if (!this.sessionIds.has(senderID)) {
            this.sessionIds.set(senderID, uuid.v1());
            console.log('SESSION --- >');
            console.log(this.sessionIds);
        }
    }

    handleResponse(res){
        try{
            switch(res.origin){
                case 'facebook':{
                    if(res.code === 200){
                        this.handleFbEvent(res.payload);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    }

    handleFbEvent(event) {
        
        console.log('Handling fb event...');

        try{
            let senderID = event.sender.id;
            this.setSession(senderID);
        }catch(err){
            console.log(`An error ocurred trying set session : ${err}`);
        }
        
        try{

            var recipientID = event.recipient.id;
            var timeOfMessage = event.timestamp;
            var message = event.message;

            var isEcho = message.is_echo;
            var messageId = message.mid;
            var appId = message.app_id;
            var metadata = message.metadata;

            /**
             * 
             * @description You can get text or attachments, not both
             */

            var messageText = message.text;
            var messageAttachments = message.attachments;
            var quickReply = message.quick_reply;

            if (isEcho) {
                fbService.handleEcho(messageId, appId, metadata);
                return;
            } else if (quickReply) {
                // handleQuickReply(senderID, quickReply, messageId);
                return;
            }


            if (messageText) {
                dfService.sendTextQueryToApiAi(sessionIds, handleApiAiResponse, senderID, messageText);
            } else if (messageAttachments) {
                fbService.handleMessageAttachments(messageAttachments, senderID);
            }
        
        }catch(err){
            console.log(`An error ocurred on handling facebook event; error: ${err}`);
        }

    }
}