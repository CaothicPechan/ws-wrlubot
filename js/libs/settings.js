
import bodyParser from 'body-parser'

export default (app, constants) => {
    let port = 3000;

    if(constants){
        port = constants.env.port ? constants.env.port : port;
    }

    app.set('port', (process.env.PORT || port));

    // app.use(bodyParser.json({
    //     verify: fbService.verifyRequestSignature
    // }));
    
}