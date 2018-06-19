import dialogflow from 'dialogflow'
import structjson from './structjson'

/**
 * 
 * 
 * @description Anonymus class to get the functions for using DialogFlow API.
 *              on version { 0.0.1 }. This class was created for using with Fb API,
 *              in next versions would be released for more platforms as Telegram.
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @argument {String} googleProjectId           Google ID Project for using as a key to 
 *                                              auth on DialogFlow API.
 * 
 * @argument {fbProvider Object} fbService      FbService Object to get access to Facebook 
 *                                              messenger APIs/ Declare on this lib as 
 *                                              "fbProvider" Module.
 * 
 * @argument {String} languageCode              Language Code for using on DialogFlow
 *                                              default "en-US"
 */

export default class {
    
    constructor(googleProjectId, fbService, languageCode = 'en-US'){
        
        this.googleProjectId = googleProjectId;
        this.languageCode = languageCode;
        this.sessionClient = new dialogflow.SessionsClient();

        this.fbService = fbService ? fbService : null;
    }

    /** Send a text query to DialogFlow API
     * 
     * 
     * @method sendTextQueryToApiAi()           
     * @param {String} sessionIds               Ids for actual session for send to API
     * @param {Function} handleApiAiResponse    CallBack for handle response
     * @param {*} sender                        Sender identifier
     * @param {String} text                     Simple text to send
     * @param {Object} params                   API params
     * 
     * @returns callback handleApiAiResponse()
     * 
     */
    async sendTextQueryToApiAi(sessionIds, handleApiAiResponse, sender, text, params = {}) {
        const sessionPath = sessionClient.sessionPath(this.googleProjectId, sessionIds.get(sender));
        this.fbService.sendTypingOn(sender);
 
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: text,
                    languageCode: this.languageCode,
                },
            },
            queryParams: {
                payload: {
                    data: params
                }
            }
        };
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        
        handleApiAiResponse(sender, result);
    }

    /** Send an event to DialogFlow API
     * 
     * 
     * @method sendEventToApiAi()
     * @param {String} sessionIds                   Ids for actual session for send to API
     * @param {Function} handleApiAiResponse        CallBack for handle response
     * @param {*} sender                            Sender identifier
     * @param {Event} event                         Event to send
     * @param {Object} params                       API params
     * 
     * @returns callback handleApiAiResponse()
     * 
     */
    async sendEventToApiAi(sessionIds, handleApiAiResponse, sender, event, params = {}) {
        const sessionPath = sessionClient.sessionPath(this.googleProjectId, sessionIds.get(sender));
        const request = {
            session: sessionPath,
            queryInput: {
                event: {
                    name: event,
                    parameters: this.structjson.jsonToStructProto(params), //Dialogflow's v2 API uses gRPC. You'll need a jsonToStructProto method to convert your JavaScript object to a proto struct.
                    languageCode: this.languageCode,
                },
            }
        };
 
 
        const responses = await sessionClient.detectIntent(request);
 
        const result = responses[0].queryResult;
        handleApiAiResponse(sender, result);
 
    }
}
