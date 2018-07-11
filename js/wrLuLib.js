
import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'
import uuid from 'uuid'



export default class {

    constructor(app, config){
        this.app = app;
        this.fbService = new fbProvider(config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret, config.fb.verifyToken);
        this.dfService = new dfProvider(config.googleProjectId);
        this.sessionIds = new Map();
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.start = this.start.bind(this);
        this.setSession = this.setSession.bind(this);
        
        this.handleResponse = this.handleResponse.bind(this);
        this.handleFbEvent = this.handleFbEvent.bind(this);
        this.handleDfResponse = this.handleDfResponse.bind(this);
        this.handleDfAction = this.handleDfAction.bind(this);
    }

    start(app, callback){
        this.fbService.setWebhook(app, (res) => {
            this.handleResponse(res, callback);
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

    handleResponse(res, callback){
        try{
            switch(res.origin){
                case 'facebook':{
                    if(res.code === 200){
                        this.handleFbEvent(res.payload, callback);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    }

    handleFbEvent(event, callback) {
        
        console.log('Handling fb event...');

        let senderID = {};

        try{
            senderID = event.sender.id;
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

            this.fbService.sendTypingOn(senderID);

            setTimeout(() => {
                
                if (isEcho) {
                    this.fbService.handleEcho(messageId, appId, metadata);
                    return;
                } else if (quickReply) {
                    // handleQuickReply(senderID, quickReply, messageId);
                    return;
                }
    
    
                if (messageText) {
                    this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, senderID, messageText);
                    callback(200);
                } else if (messageAttachments) {
                    this.fbService.handleMessageAttachments(messageAttachments, senderID);
                    callback(200);
                }

            }, 300);
        
        }catch(err){
            console.log(`An error ocurred on handling facebook event; error: ${err}`);
        }

    }

    handleDfResponse(sender, response, callback) {
        let responseText = response.fulfillmentText;
      
        let messages = response.fulfillmentMessages;
        let action = response.action;
        let contexts = response.outputContexts;
        let parameters = response.parameters;
      
        this.fbService.sendTypingOff(sender);
      
         if (action) {
            this.handleDfAction(sender, action, messages, contexts, parameters);
            console.log('<--- Action -->')
            callback(200);
         } else if (messages) {
           this.fbService.handleMessages(messages);
           callback(200);
        } else if (responseText == '' && !action) {
            /**
             * @description On this case, DialogFlow coudn't evaluate the input, showing the unsolved query.
             */
           console.log('Unknown query' + response.result.resolvedQuery);
           this.fbService.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
           callback(200);
        } else if (responseText) {
           this.fbService.sendTextMessage(sender, responseText);
           callback(200);
        }
    }

    handleDfAction(sender, action, messages, contexts, parameters) {
        switch (action) {
            default:
                //unhandled action, just send back the text
                this.fbService.handleMessages(messages, sender);
        }
    }
}