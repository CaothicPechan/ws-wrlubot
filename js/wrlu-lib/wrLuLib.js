
import fbProvider from './providers/facebook/fbProvider'
import dfProvider from './providers/dialogflow/dfProvider'
import uuid from 'uuid'
import { globalResponse } from './models/commonObjects'

/** WrLu Chatbot lib
 * 
 * @name        WrLu Chatbot lib
 * 
 * @description Anonymus class to set and interact with a DialogFlow chatbot
 *              using API V2 & Facebook on version { 0.0.1 }.
 *              Future releases may expect another 3rth party chat platform
 *              up to Telegram or Slack.
 *              
 *              This lib is created to Node JS, you need to have you own
 *              DialogFlow bot prebuilded. Documentation is in process.
 * 
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @param {*} app 
 * @param {Object} config  This param is about the initial config for 
 *                         Facebook & DialogFlow service, the structure for the var
 *                         may be the following.
 * 
 *                          {
 *                              fb:{
 *                                  pageToken: '',
 *                                  verifyToken: '',
 *                                  appID: '',
 *                                  appSecret: '',
 *                                  graphGlobalURL: '', https://graph.facebook.com/v2.6/
 *                                  graphMsgURL: ' https://graph.facebook.com/v2.6/me/messages'
 *                              },
 *                              gcp:{
 *                                  projectId: '',
 *                                  clientEmail: '',
 *                                  privateKey: '',
 *                                  languageCode: ''
 *                              }
 *                              webhookUri:''
 *                          }
 *                        
 */

export default class {
    constructor(app, config){
        this.app = app;
        this.fbService = new fbProvider(config.fb.graphGlobalURL, config.fb.graphMsgURL, config.fb.pageToken, config.fb.appSecret, config.fb.verifyToken);
        this.dfService = new dfProvider(config.gcp.projectId, config.gcp.clientEmail, config.gcp.privateKey, config.gcp.languageCode);
        this.sessionIds = new Map();
        this.response = globalResponse;
        this.webhookUri = config.webhookUri ? config.webhookUri : '/webhook/';

        this.start = this.start.bind(this);
        this.setSession = this.setSession.bind(this);

        this.handleResponse = this.handleResponse.bind(this);
        this.handleFbEvent = this.handleFbEvent.bind(this);
        this.handleDfResponse = this.handleDfResponse.bind(this);
        this.handleDfAction = this.handleDfAction.bind(this);
        this.handleDefault = this.handleDefault.bind(this);
    }

    /** Start bot
     * 
     * @param {*} app 
     * @param {Function} callback Function that will return on exec and init the bot
     */
    start(app, callback){
        try{
            this.fbService.setWebhook(app, (res) => {
                this.handleResponse(res, callback); 
            });

            let grets = {
                greeting:[
                    {
                      locale:"default",
                      text:"¡Hola {{user_first_name}}! Soy wrLu, bienvenido"
                    }
                ]
            };

            let getStart = { 
                get_started:{
                  payload:"Comenzar"
                }
            };

            let persistent_menu = 
            {
                persistent_menu:[
                  {
                    locale:"default",
                    call_to_actions:[
                      {
                        title:"Comunes",
                        type:"nested",
                        call_to_actions:[
                          {
                            title:"Productos",
                            type:"postback",
                            payload:"Productos"
                          },
                          {
                            type:"web_url",
                            title:"Latest News",
                            url:"https://www.messenger.com/",
                            webview_height_ratio:"full"
                          }
                        ]
                      }
                    ]
                  }
                ]
            };
  
            // this.fbService.setProfileConfig(persistent_menu,(res) => {
            //     console.log(`Response profile: ${JSON.stringify(res)}`);
            // });   

        }catch(err){
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred on setting fb service function: start() --- Error: ${err}`;
            callback(this.response);
            return;
        }    
    }

    /** Set session
     * 
     * @description Get the sender for setting a session for the live transactions
     * 
     * @param {*} senderID 
     * 
     * 
     */
    setSession(senderID) {
        if (!this.sessionIds.has(senderID)) {
            this.sessionIds.set(senderID, uuid.v1());
        }
    }

    /** Get Sender
     * 
     * @description Getting & validate sender for public use
     * 
     */
    getSender(){
        try{
            let it = this.sessionIds.keys();
            let sender = it.next().value;

            if(this.sessionIds.has(sender)){
                return sender;
            }else{
                throw 'Sorry!, Invalid sender.';
            }
        }catch(err){
            console.log(`Something was wrong of getting sender. Error: ${err}`);
        }   
    }

    /** Handle Response
     * 
     * @param {*} res 
     * @param {Function} callback 
     * 
     * @description Using for handle the response from the 3rd party chat
     *              provider, in this case: Facebook. Just facebook is used
     *              on version { 0.0.1 }.
     * 
     * 
     */
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
            return;
        }
    }

    /** HandleFbEvent
     * 
     * @description function for using handle the facebook event
     *              comming from Fb API
     * 
     * @param {*} event 
     * @param {Function} callback 
     * 
     */
    handleFbEvent(event, callback) {
        
        console.log(`Handling FB event, event: ${JSON.stringify(event)}`);
        // console.log(JSON.stringify(event));

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
            return;
        }
        
        try{
            let payload = {};
            
            this.response.code = 200;
            this.response.status = 'success';
            this.response.origin = 'fbEvent';

            if(event.read){
                payload = {
                    type: 'read',
                    senderID: senderID,
                    read: event.read
                };                
                this.response.payload = payload;
                callback(this.response);
                return;
            }else if(event.postback){
                payload = {
                    type: 'postback',
                    senderID: senderID,
                    data: event.postback.payload
                };                
                this.response.payload = payload;
                callback(this.response);
                return;
            }

            var recipientID = event.recipient.id;
            var timeOfMessage = event.timestamp;
            var message = event.message;

            var isEcho = "";
            var messageId = "";
            var appId = "";
            var metadata = "";
            
            var messageText = "";
            var messageAttachments = "";
            var quickReply = "";
            

            if(message){

                isEcho = message.is_echo;
                messageId = message.mid;
                appId = message.app_id;
                metadata = message.metadata;


                /**
                 * 
                 * @description You can get text or attachments, not both
                 */

                messageText = message.text;
                messageAttachments = message.attachments;
                quickReply = message.quick_reply;

                payload = {
                    type: '',
                    senderID: senderID,
                    messageId: messageId,
                    appId: appId,
                    metadata: metadata
                };                
            }

            if (isEcho) {
                payload.type = 'echo';
                this.response.payload = payload;
                callback(this.response);
                return;
            } else if (quickReply) {
                this.fbService.sendTypingOn(senderID);
                payload.type = 'quickReply';
                payload.quickReply = quickReply;
                this.response.payload = payload;
                callback(this.response);
                return;
            }

            this.fbService.sendTypingOn(senderID);

            if (messageText) {
                this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, senderID, messageText, callback);
                return;
            } else if (messageAttachments) {
                payload.type = 'attachments';
                payload.attachments = messageAttachments;
                this.response.payload = payload;
                callback(this.response);
                return;
            }            
        
        }catch(err){
            console.log(`An error ocurred on handling facebook event; error: ${err}`);
        }

    }

    /** HandleDfResponse
     * 
     * @description handle dialog flow response from the API (Df API V2)
     * 
     * @param {*} sender 
     * @param {*} response 
     * @param {Function} callback 
     */
    handleDfResponse(sender, response, callback) {
        
        console.log(`Handling dialog flow response: ${JSON.stringify(response)}`);
        // console.log(JSON.stringify(response));

        let responseText = response.fulfillmentText;
      
        let messages = response.fulfillmentMessages;
        let action = response.action;
        let contexts = response.outputContexts;
        let parameters = response.parameters;
      

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
                payload.type = 'action';
                payload.action = action;

            } else if (messages) {
    
                this.response.code = 200;
                this.response.status = 'success';
                payload.type = 'messages';
    
    
            } else if (responseText) {
                
                this.response.code = 200;
                this.response.status = 'success';
                payload.type = 'responseText';
                
                this.fbService.sendTextMessage(sender, responseText);
            } else if (responseText == '' && !action) {
                /**
                 * @description On this case, DialogFlow coudn't evaluate the input, showing the unsolved query.
                 */
                console.log('Unknown query' + response.result.resolvedQuery);
                this.fbService.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
                
                this.response.code = 500;
                this.response.status = 'error';
                this.response.payload = 'Unknown query' + response.result.resolvedQuery;
            }
    
            this.response.payload = payload;
            this.response.origin = 'dfResponse';

            if(callback){
                callback(this.response);
                return;
            }else{
                console.log('Callback undefined');
                return this.response;
            }

        }catch(err){
            console.log(`An error ocurred : ${err}, method: handleDfResponse`);
            this.response.code = 500;
            this.response.status = 'error';
            this.response.payload = `An error ocurred function: handleDfResponse() --- Error: ${err}`;
            if(callback){
                callback(this.response);
                return;
            }else{
                return;
            }
        }
    }

    /** HandleDfAction
     * 
     * 
     * @param {*} sender 
     * @param {*} action 
     * @param {Array} messages 
     * @param {*} contexts 
     * @param {*} parameters 
     * 
     */
    handleDfAction(sender, action, messages, contexts, parameters) {

        switch (action) {
            default:
                //unhandled action, just send back the text
                this.fbService.handleMessages(messages, sender);
        }
    }

    /** HandleDefault
     * 
     * 
     * @param {*} response 
     */
    handleDefault(response){
        try{
            console.log(`Handling response by default option: ${JSON.stringify(response)}`);
            // console.log(JSON.stringify(response));
            switch(response.payload.type)
            {
                case 'action':{
                    this.fbService.handleMessages(response.payload.messages, response.payload.sender);
                    return;
                    break;
                }
                case 'messages':{
                    this.fbService.handleMessages(response.payload.messages, response.payload.sender);
                    return;
                    break;
                }
                case 'postback':{
                    console.log(`Handling postbak: ${JSON.stringify(response)}`);
                    this.fbService.sendTypingOn(response.payload.senderID);
                    return this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, response.payload.senderID, response.payload.data);
                    break;
                }
                case 'quickReply':{
                    return this.dfService.sendTextQueryToApiAi(this.sessionIds, this.handleDfResponse, response.payload.senderID, response.payload.quickReply.payload);
                    break;
                }
                case 'echo':{
                    console.log('Echo recieved');
                    return;
                    /* PENDING */
                    // this.fbService.handleEcho(response.payload.messageId, response.payload.appId, response.payload.metadata);
                    break;
                }
            }
            return;
        }catch(err){
            console.log(`An error ocurred : ${err}, method: handleDefault. Response: ${JSON.stringify(response)} `);
        }
    }
}