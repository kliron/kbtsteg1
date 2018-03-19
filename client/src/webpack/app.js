'use strict';

require('es5-shim');
require('es6-shim');
require('ace-css/css/ace.css');
require('./app.css');
require('./index.html');

let app = require('../modules/App');

window.addEventListener('DOMContentLoaded', e => {
    app.init('main');
});

