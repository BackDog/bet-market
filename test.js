var request = require('request');

request({
    url: 'https://www.google.com',
    proxy: 'http://97.77.104.22:3128'
}, function (error, response, body) {
    if (error) {
        console.log(error);
    } else {
        console.log(response);
    }
});