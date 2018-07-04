import { constants } from '../libs/config'


export default (app) => {
    app.get('/', (req,res) => {
        res.json({
            response: 'Hello index deploy!'
        });
    });
    // app.get('/webhook/', function (req, res) {
    //     if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === constants.fb.verifyToken) {
    //         res.status(200).send(req.query['hub.challenge']);
    //     } else {
    //         console.error("Failed validation. Make sure the validation tokens match.");
    //         res.sendStatus(403);
    //     }
    // });
    app.get('/404', (req,res) => {
        res.json({
            response: '404 error!'
        });
    })
}