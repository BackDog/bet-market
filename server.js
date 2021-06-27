'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = 'public/index.html';

// const server = express()
//   .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));

var app = express();
app.use(express.static(__dirname + '/public'));

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});

const wss = new Server({ server });

var CLIENTS=[];
wss.on('connection', function connection(ws) {
    CLIENTS.push(ws);
    ws.on('message', function incoming(message) {
        sendAll(message);
    });
});

function sendAll (message) {
    for (var i=0; i<CLIENTS.length; i++) {
        CLIENTS[i].send(message);
    }
}
