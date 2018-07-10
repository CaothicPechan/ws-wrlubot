import request from 'request'
import crypto from 'crypto'
import { wrResponse } from '../../models/commonObjects';


/**
 * 
 * 
 * @description Anonymus class to get the functions for using Facebook API.
 * 
 * @version 0.0.1
 * 
 */

/** @constructor
 * 
 * @argument {String} graphMsgURL       URL from Facebook Graph API
 * @argument {String} pageToken         Facebook token page
 */

export default class {

    constructor(graphMsgURL, pageToken, appSecret, verifyToken, webhookUri = '/webhook/'){
        this.constants = {};
        this.constants.graphMsgURL = graphMsgURL;
        this.constants.pageToken = pageToken;
        this.constants.appSecret = appSecret;
        this.constants.verifyToken = verifyToken;
        this.constants.webhookUri = webhookUri;
        
        this.wrResponse = wrResponse;

        this.handleMessage = this.handleMessage.bind(this);
        this.handleMessageAttachments = this.handleMessageAttachments.bind(this);
        this.handleEcho = this.handleEcho.bind(this);
        this.handleCardMessages = this.handleCardMessages.bind(this);

        this.receivedMessageRead = this.receivedMessageRead.bind(this);
        this.receivedAccountLink = this.receivedAccountLink.bind(this);
        this.receivedAuthentication = this. receivedAuthentication.bind(this);
        this.receivedDeliveryConfirmation = this.receivedDeliveryConfirmation.bind(this);
        
        this.setWebhook = this.setWebhook.bind(this);
        this.callSendAPI = this.callSendAPI.bind(this);
        this.sendButtonMessage = this.sendButtonMessage.bind(this);
        this.sendGenericMessage = this.sendGenericMessage.bind(this);
        this.verifyRequestSignature = this.verifyRequestSignature.bind(this);

    }

    /**
     * 
     * 
     */
        /**
         * 
         */
        setWebhook(app, callback){

            console.log('Setting webhook...')

            app.get(this.constants.webhookUri, (req, res) => {
                if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.constants.verifyToken) {
                    res.status(200).send(req.query['hub.challenge']);
                } else {
                    console.error("Failed validation. Make sure the validation tokens match.");
                    res.sendStatus(403);
                }
            });

            app.post(this.constants.webhookUri,(req, res) => {
                var data = req.body;
                console.log(JSON.stringify(data));


                // Make sure this is a page subscription                
                if (data.object == 'page') {

                    /**
                     * Iterate over each entry 
                     * There may be multiple if batched
                     * */
                     
                    data.entry.forEach((pageEntry) => {
                        var pageID = pageEntry.id;
                        var timeOfEvent = pageEntry.time;
                        
                        pageEntry.messaging.forEach((messagingEvent) => {
                            if (messagingEvent.optin) {
                                this.receivedAuthentication(messagingEvent,callback);
                            } else if (messagingEvent.message) {
                                this.wrResponse.payload = messagingEvent;
                                this.wrResponse.eventType = 'message';
                                callback(this.wrResponse);
                            } else if (messagingEvent.delivery) {
                                this.receivedDeliveryConfirmation(messagingEvent,callback);
                            } else if (messagingEvent.postback) {
                                this.wrResponse.payload = messagingEvent;
                                this.wrResponse.eventType = 'postback';
                                callback(this.wrResponse);
                            } else if (messagingEvent.read) {
                                this.receivedMessageRead(messagingEvent,callback);
                            } else if (messagingEvent.account_linking) {
                                this.receivedAccountLink(messagingEvent,callback);
                            } else {
                                console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                            }
                        });
                    });

                    res.sendStatus(200);
                }
            });
        }
    
    /** Handle methods **
     * 
     */

        /** Handle Message attachments
         * 
         * @param {*} messageAttachments 
         * @param {*} senderID 
         */
        handleMessageAttachments(messageAttachments, senderID){
            this.sendTextMessage(senderID, "Attachment received. Thank you.");
        }

        /** Handle echo
         * 
         * @param {String} messageId 
         * @param {String} appId 
         * @param {String} metadata 
         */
        handleEcho(messageId,appId, metadata){
            console.log(`Received echo for message ${messageId} and app ${appId} with metadata ${metadata}`);
        }

        /** Handle message
         * 
         * @param {String} message 
         * @param {String} sender 
         */
        handleMessage(message, sender){

            switch (message.message) {
                case "text": //text
                    message.text.text.forEach((text) => {
                        if (text !== '') {
                            this.sendTextMessage(sender, text);
                        }
                    });
                    break;
                case "quickReplies": //quick replies
                    let replies = [];
                    message.quickReplies.quickReplies.forEach((text) => {
                        let reply =
                            {
                                "content_type": "text",
                                "title": text,
                                "payload": text
                            }
                        replies.push(reply);
                    });
                    this.sendQuickReply(sender, message.quickReplies.title, replies);
                    break;
                case "image": //image
                    this.sendImageMessage(sender, message.image.imageUri);
                    break;
            }
        }

        /** Handle messages
         * 
         * @param {*} messages 
         * @param {*} sender 
         */
        handleMessages(messages, sender){
            let timeoutInterval = 1100;
            let previousType ;
            let cardTypes = [];
            let timeout = 0;
            for (var i = 0; i < messages.length; i++) {
         
                if ( previousType == "card" && (messages[i].message != "card" || i == messages.length - 1)) {
                    timeout = (i - 1) * timeoutInterval;
                    setTimeout(this.handleCardMessages.bind(null, cardTypes, sender), timeout);
                    cardTypes = [];
                    timeout = i * timeoutInterval;
                    setTimeout(this.handleMessage.bind(null, messages[i], sender), timeout);
                } else if ( messages[i].message == "card" && i == messages.length - 1) {
                    cardTypes.push(messages[i]);
                    timeout = (i - 1) * timeoutInterval;
                    setTimeout(this.handleCardMessages.bind(null, cardTypes, sender), timeout);
                    cardTypes = [];
                } else if ( messages[i].message == "card") {
                    cardTypes.push(messages[i]);
                } else {
                    timeout = i * timeoutInterval;
                    setTimeout(this.handleMessage.bind(null, messages[i], sender), timeout);
                }
         
                previousType = messages[i].message;
         
            }
        }
        
        /** Handle cards messages
         * 
         * @param {Array} messages 
         * @param {String} sender 
         */
        handleCardMessages(messages, sender){
            let elements = [];
            for (var m = 0; m < messages.length; m++) {
                let message = messages[m];
        
                let buttons = [];
                for (var b = 0; b < message.card.buttons.length; b++) {
                    let isLink = (message.card.buttons[b].postback.substring(0, 4) === 'http');
                    let button;
                    if (isLink) {
                        button = {
                            "type": "web_url",
                            "title": message.card.buttons[b].text,
                            "url": message.card.buttons[b].postback
                        }
                    } else {
                        button = {
                            "type": "postback",
                            "title": message.card.buttons[b].text,
                            "payload": message.card.buttons[b].postback
                        }
                    }
                    buttons.push(button);
                }
        
        
                let element = {
                    "title": message.card.title,
                    "image_url":message.card.imageUri,
                    "subtitle": message.card.subtitle,
                    "buttons": buttons
                };
                elements.push(element);
            }
            
            this.sendGenericMessage(sender, elements);
        }


    /** **Events Section **
     *
     *  @description Events functions.
     */

        /** Message Read Event
         * 
         * @description This event is called when a previously-sent message has been read.
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
         *
         */

        receivedMessageRead(event){
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;

            // All messages before watermark (a timestamp) or sequence have been seen.
            var watermark = event.read.watermark;
            var sequenceNumber = event.read.seq;

            console.log("Received message read event for watermark %d and sequence " +
                "number %d", watermark, sequenceNumber);

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'recieved-message';
            callback(this.wrResponse);
        }

        /** Account Link Event
         * 
         *
         * @description This event is called when the Link Account or UnLink Account action has been
         * tapped.
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
         *
         */

        receivedAccountLink(event){
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;

            var status = event.account_linking.status;
            var authCode = event.account_linking.authorization_code;

            console.log("Received account link event with for user %d with status %s " +
                "and auth code %s ", senderID, status, authCode);

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'account-link';
            callback(this.wrResponse);
        }

        /** Delivery Confirmation Event
         * 
         *
         * @description This event is sent to confirm the delivery of a message. Read more about
         * these fields at @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
         *
         */
        receivedDeliveryConfirmation(event, callback){
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;
            var delivery = event.delivery;
            var messageIDs = delivery.mids;
            var watermark = delivery.watermark;
            var sequenceNumber = delivery.seq;

            if (messageIDs) {
                messageIDs.forEach((messageID) => {
                    console.log("Received delivery confirmation for message ID: %s",
                        messageID);
                });
            }

            console.log("All message before %d were delivered.", watermark);
            
            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'delivery-confirm';
            callback(this.wrResponse);
        }

        /** Authorization Event
         *
         * @description The value for 'optin.ref' is defined in the entry point. For the "Send to
         * Messenger" plugin, it is the 'data-ref' field. Read more at
         * @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
         *
         * The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
         * The developer can set this to an arbitrary value to associate the
         * authentication callback with the 'Send to Messenger' click event. This is
         * a way to do account linking when the user clicks the 'Send to Messenger'
         * plugin.
         * 
         * 
         * When an authentication is received, we'll send a message back to the sender
         * to let them know it was successful.
         * 
         */
        receivedAuthentication(event){
            var senderID = event.sender.id;
            var recipientID = event.recipient.id;
            var timeOfAuth = event.timestamp;
            var passThroughParam = event.optin.ref;

            console.log("Received authentication for user %d and page %d with pass " +
                "through param '%s' at %d", senderID, recipientID, passThroughParam,
                timeOfAuth);

            this.sendTextMessage(senderID, "Authentication successful");

            this.wrResponse.payload = event;
            this.wrResponse.eventType = 'delivery-confirm';
            callback(this.wrResponse);
        }

        /** Verify that the callback came from Facebook. 
         * @description Using the App Secret from
         * the App Dashboard, we can verify the signature that is sent with each
         * callback in the x-hub-signature field, located in the header.
         *
         * @link https://developers.facebook.com/docs/graph-api/webhooks#setup
         *
         */

        verifyRequestSignature(req, res, buf){
            var signature = req.headers["x-hub-signature"];
            console.log('Verifying RequestSignature...');
            if (!signature) {
                throw new Error('Couldn\'t validate the signature.');
            } else {
                var elements = signature.split('=');
                var method = elements[0];
                var signatureHash = elements[1];

                var expectedHash = crypto.createHmac('sha1', this.constants.appSecret)
                    .update(buf)
                    .digest('hex');

                if (signatureHash != expectedHash) {
                    throw new Error("Couldn't validate the request signature.");
                    console.log("Couldn't validate the request signature.");
                }
            }
        }

        /** Send a message with a Receipt
         * 
         * @namespace modify
         * 
         * @var receiptId Generate a random receipt ID as the API requires a unique ID
         *
         */
        sendReceiptMessage(recipientId, recipient_name, currency, payment_method,timestamp, elements, address, summary, adjustments){

            var receiptId = "order" + Math.floor(Math.random() * 1000);
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: recipient_name,
                            order_number: receiptId,
                            currency: currency,
                            payment_method: payment_method,
                            timestamp: timestamp,
                            elements: elements,
                            address: address,
                            summary: summary,
                            adjustments: adjustments
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /** Send a message with Quick Reply buttons.
         *
         */
        sendQuickReply(recipientId, text, replies, metadata){
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: text,
                    metadata: metadata ? metadata : '',
                    quick_replies: replies
                }
            };
            this.callSendAPI(messageData);
        }

        /** Send an image using the Send API.
         *
         */
        sendImageMessage(recipientId, imageUrl){
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "image",
                        payload: {
                            url: imageUrl
                        }
                    }
                }
            };
            this.callSendAPI(messageData);
        }

        /** Send a Gif using the Send API.
         *
         */
        // sendGifMessage(recipientId){
        //     var messageData = {
        //         recipient: {
        //             id: recipientId
        //         },
        //         message: {
        //             attachment: {
        //                 type: "image",
        //                 payload: {
        //                     url: config.serverURL + "/assets/instagram_logo.gif"
        //                 }
        //             }
        //         }
        //     };
        //     this.callSendAPI(messageData);
        // }

        /** Send audio using the Send API.
         *
         */
        // sendAudioMessage(recipientId){
        //     var messageData = {
        //         recipient: {
        //             id: recipientId
        //         },
        //         message: {
        //             attachment: {
        //                 type: "audio",
        //                 payload: {
        //                     url: config.serverURL + "/assets/sample.mp3"
        //                 }
        //             }
        //         }
        //     };

        //     this.callSendAPI(messageData);
        // }

        /** Send a video using the Send API.
         *  @example  videoName: "/assets/allofus480.mov"
         * 
         * 
         */
        // sendVideoMessage(recipientId, videoName){
            
        //     var messageData = {
        //         recipient: {
        //             id: recipientId
        //         },
        //         message: {
        //             attachment: {
        //                 type: "video",
        //                 payload: {
        //                     url: config.serverURL + videoName
        //                 }
        //             }
        //         }
        //     };

        //     this.callSendAPI(messageData);
        // }

        /** Send a video using the Send API.
         * 
         * @example fileName: fileName"/assets/test.txt"
         * 
         * 
         */
        // sendFileMessage(recipientId, fileName) {
        //     var messageData = {
        //         recipient: {
        //             id: recipientId
        //         },
        //         message: {
        //             attachment: {
        //                 type: "file",
        //                 payload: {
        //                     url: config.serverURL + fileName
        //                 }
        //             }
        //         }
        //     };

        //     this.callSendAPI(messageData);
        // }

        /** Send a button message using the Send API.
         *
         */
        sendButtonMessage(recipientId, text, buttons){

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: text,
                            buttons: buttons
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        }

        /** Send Generic Message
         * 
         * @param {*} recipientId 
         * @param {*} elements 
         */
        sendGenericMessage(recipientId, elements){

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: elements
                        }
                    }
                }
            };

            this.callSendAPI(messageData);
        } 
        
        /**Send a read receipt to indicate the message has been read
         * 
         * @param {*} recipientId 
         */
        sendReadReceipt(recipientId) {
            
            console.log("Sending a read receipt to mark message as seen");

            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "mark_seen"
            };

            this.callSendAPI(messageData);
        }

        /**Turn typing indicator on
         * 
         * @param {*} recipientId 
         */
        sendTypingOn(recipientId){
            
            console.log("Turning typing indicator on");

            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "typing_on"
            };

            this.callSendAPI(messageData);
        }

        /**Turn typing indicator off
         * 
         * @param {*} recipientId 
         */
        sendTypingOff(recipientId){
            
            console.log("Turning typing indicator off");
            var messageData = {
                recipient: {
                    id: recipientId
                },
                sender_action: "typing_off"
            };

            this.callSendAPI(messageData);
        }

        /** Send a message with the account linking call-to-action
         * 
         * @param {*} recipientId 
         */
        // sendAccountLinking(recipientId){
        //     var messageData = {
        //         recipient: {
        //             id: recipientId
        //         },
        //         message: {
        //             attachment: {
        //                 type: "template",
        //                 payload: {
        //                     template_type: "button",
        //                     text: "Welcome. Link your account.",
        //                     buttons: [{
        //                         type: "account_link",
        //                         url: config.serverURL + "/authorize"
        //                     }]
        //                 }
        //             }
        //         }
        //     };

        //     callSendAPI(messageData);
        // }

        /** Send Text Message
         * 
         * @param {*} recipientId 
         * @param {*} text 
         */
        sendTextMessage(recipientId, text){

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: text
                }
            }
            this.callSendAPI(messageData);
        }

        /** Call the Send API.
         * 
         * @description The message data goes in the body. If successful, we'll
         * get the message id in a response
         * 
         * @param {*} messageData 
         */
        callSendAPI(messageData){
            request({
                uri: this.constants.graphMsgURL,
                qs: {
                    access_token: this.constants.pageToken
                },
                method: 'POST',
                json: messageData

            },(error, response, body) => {
                if (!error && response.statusCode == 200) {
                    var recipientId = body.recipient_id;
                    var messageId = body.message_id;

                    if (messageId) {
                        console.log("Successfully sent message with id %s to recipient %s",
                            messageId, recipientId);
                    } else {
                        console.log("Successfully called Send API for recipient %s",
                            recipientId);
                    }
                } else {
                    console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
                }
            });
        }
}