'use strict';
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://admin:bd11112222@@rabbitcluster.jjait.mongodb.net/";

const express = require('express');
const { Server } = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
// const INDEX = 'public/index.html';

// const server = express()
//   .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`));

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors());

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

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);

    app.get('/menu', function (req, res) {
        var data = [
            {url: "", name: "Predictions", active: "active"},
            {url: "jackpot", name: "Jackpot", active: ""},
            {url: "product", name: "My Bag", active: ""},
            {url: "demo", name: "Bonus", active: ""},
            {url: "contact", name: "My Profile", active: ""}
        ];
        res.end( JSON.stringify(data));
    });
});