'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (app) {
    app.listen(app.get('port'), function () {
        console.log('running on port', app.get('port'));
    });
};
//# sourceMappingURL=init.js.map