
import bodyParser from 'body-parser'
import fbProvider from '../providers/facebook/fbProvider'


export default (app, constants) => {
    let port = 3000;
    let fbService = new fbProvider(constants.fb.graphMsgURL, constants.fb.pageToken, constants.fb.appSecret);
    
    if(constants){
        port = constants.env.port ? constants.env.port : port;
    }

    app.set('port', (process.env.PORT || port))

    // Verifying Facebook Request
    app.use(bodyParser.json({
        verify: fbService.verifyRequestSignature
    }))

    // Process application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({
        extended: false
    }))

    // Process application/json
    app.use(bodyParser.json())
}