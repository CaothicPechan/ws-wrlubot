
export default (app) => {
    app.listen(app.get('port'), function () {
        console.log('running on port', app.get('port'))
    })    
}