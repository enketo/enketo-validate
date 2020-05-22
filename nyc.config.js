'use strict';

module.exports = {
    include: [ 'src/*.js' ],
    reporter: [
        'html',
        'text-summary',
        'json'
    ],
    'report-dir': './test-coverage'
};
