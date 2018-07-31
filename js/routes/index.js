import { constants } from '../libs/config'


export default (app) => {
    app.get('/', (req,res) => {
        res.json({
            response: 'Hello index deploy!'
        });
    });
    
    app.get('/404', (req,res) => {
        res.json({
            response: '404 error!'
        });
    })
}