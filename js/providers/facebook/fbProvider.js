import request from 'request'
import crypto from 'crypto'
import { Button, Element } from '../../models/facebookObjects';


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

    constructor(graphMsgURL, pageToken, appSecret){
        console.log('Called constructor' + graphMsgURL + pageToken + appSecret);
        this.constants = {};
        this.constants.graphMsgURL = graphMsgURL;
        this.constants.pageToken = pageToken;
        this.constants.appSecret = appSecret;

    }
    
    /** Handle methods
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

        switch (message.type) {
            case 0: //text
                this.sendTextMessage(sender, message.speech);
            break;
            
            case 2: //quick replies
                let replies = [];
                for (var b = 0; b < message.replies.length; b++) {
                    let reply =
                    {
                        "content_type": "text",
                        "title": message.replies[b],
                        "payload": message.replies[b]
                    }
                    replies.push(reply);
                }
                this.sendQuickReply(sender, message.title, replies);
            break;
            
            case 3: //image
                this.sendImageMessage(sender, message.imageUrl);
            
            break;
            
            case 4:
                // custom payload
                var messageData = {
                    recipient: {
                        id: sender
                    },
                    message: message.payload.facebook

                };

                this.callSendAPI(messageData);

            break;
        }
    }
    
    /** Handle cards messages
     * 
     * @param {Array} messages 
     * @param {String} sender 
     */
    handleCardMessages(messages, sender){
        let elements = [];
        
        if(messages){
            messages.map( m => {
                let buttons = [];
                
                m.buttons.map( b => {
                    let isLink = (b.postback.substring(0, 4) === 'http');
                    let button = new Button();
                    
                    button.title = b.text;
                    button.url = b.postback;
                    
                    if (isLink) {
                        button.type = 'web_url';
                        
                        // button = {
                        //     "type": "web_url",
                        //     "title": message.buttons[b].text,
                        //     "url": message.buttons[b].postback
                        // }
                    } else {
                        button.type = 'postback';
                        // button = {
                        //     "type": "postback",
                        //     "title": message.buttons[b].text,
                        //     "payload": message.buttons[b].postback
                        // }
                    }
                    buttons.push(button);
                });

                let element = new Element();
                element.title = m.title;
                element.image_url = m.imageUrl;
                element.subtitle = m.subtitle;
                element.buttons = buttons;

                // let element = {
                //     "title": message.title,
                //     "image_url":message.imageUrl,
                //     "subtitle": message.subtitle,
                //     "buttons": buttons
                // };
                elements.push(element);
            });
        }

        console.log('card message');
        console.log(elements);
        this.sendGenericMessage(sender, elements);
    }


    /** **Events Section**
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
    }

    /** Delivery Confirmation Event
     * 
     *
     * @description This event is sent to confirm the delivery of a message. Read more about
     * these fields at @link https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation(event){
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
        console.log('verifyRequestSignature');
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