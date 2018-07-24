
import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'
import uuid from 'uuid'
import { globalResponse } from './models/commonObjects'



export default class {

    constructor(app, config){
        this.app = app;
        this.fbService = new fbProvider(config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret, config.fb.verifyToken);
        this.dfService = new dfProvider(config.googleProjectId);
        this.sessionIds = new Map();
        this.response = globalResponse;
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.start = this.start.bind(this);
        this.setSession = this.setSession.bind(this);

        this.handleResponse = this.handleResponse.bind(this);
        this.handleFbEvent = this.handleFbEvent.bind(this);
        this.handleDfResponse = this.handleDfResponse.bind(this);
        this.handleDfAction = this.handleDfAction.bind(this);
    }

    start(app, callback){
        try{
            this.fbService.setWebhook(app, (res) => {
                this.handleResponse(res, callback);
                
            });    
        }catch(err){
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred on setting fb service function: start() --- Error: ${err}`;
            callback(this.response);
        }    
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
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred on function: handleResponse() --- Error: ${err}`;
            callback(this.response);
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
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred trying set session function: handleFBEvent() --- Error: ${err}`;
            callback(this.response);
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
            /** --------  */

            setTimeout(() => {
                
                if (isEcho) {
                    this.fbService.handleEcho(messageId, appId, metadata);
                    return;
                } else if (quickReply) {
                    // this.handleQuickReply(senderID, quickReply, messageId);
                    return;
                }
    
    
                if (messageText) {
                    console.log("Sending Text To DF -->");
                    this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, senderID, messageText, callback);
                } else if (messageAttachments) {
                    this.fbService.handleMessageAttachments(messageAttachments, senderID);
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
        console.log("Response ---->");
        console.log(JSON.stringify(response));
        console.log('Callback -->');
        console.log(callback);
        console.log(typeof(callback));

        let payload = {
            sender: sender,
            messages: messages,
            contexts: contexts,
            params: parameters,
            type: ''
        };
        try{
            if (action) {
                this.response.code = 200;
                this.response.status = 'success';
                this.response.default = this.fbService.handleMessages;
                payload.type = 'action';
                payload.action = action;
    
                // this.handleDfAction(sender, action, messages, contexts, parameters);
                console.log('<--- Action -->')
                // callback(200);
            } else if (messages) {
    
                this.response.code = 200;
                this.response.status = 'success';
                this.response.default = this.fbService.handleMessages;
                payload.type = 'messages';
    
                console.log('<--- Messages -->')
    
                this.fbService.handleMessages(messages,sender);
               
            } else if (responseText == '' && !action) {
                /**
                 * @description On this case, DialogFlow coudn't evaluate the input, showing the unsolved query.
                 */
                console.log('Unknown query' + response.result.resolvedQuery);
                this.fbService.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
                
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'Unknown query' + response.result.resolvedQuery;
    
            } else if (responseText) {
                
                this.response.code = 200;
                this.response.status = 'success';
                this.response.default = this.fbService.sendTextMessage;
                payload.type = 'responseText';
                
                this.fbService.sendTextMessage(sender, responseText);
            }
    
            this.response.payload = payload;
            callback(this.response);

        }catch(err){
            console.log(`An error ocurred : ${err}, method: handleDfResponse`);
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred function: handleDfResponse() --- Error: ${err}`;
            callback(this.response);
        }
    }

    handleDfAction(sender, action, messages, contexts, parameters) {
        console.log('Action description:');
        console.log(action);
        switch (action) {
            default:
                //unhandled action, just send back the text
                this.fbService.handleMessages(messages, sender);
        }
    }
}