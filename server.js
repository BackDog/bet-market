'use strict';

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://admin:bd11112222@@rabbitcluster.jjait.mongodb.net/";
const dbName = 'myFirstDatabase';

const express = require('express');
const { Server } = require('ws');
const cors = require('cors');
const https = require('https');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var parse = require('node-html-parser');

const PORT = process.env.PORT || 3000;

const production  = 'https://bet-market.herokuapp.com';
const development = 'http://localhost:3000';
const apiUrl = (process.env.NODE_ENV ? production : development);
console.log(process.env.NODE_ENV);

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors());

var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    log("Example app listening at http://%s:%s", host, port);
});

const wss = new Server({ server });

var ADMIN = {};

async function chttpsCallback(method, url, data, callback) {
    const result = await chttps(method, url, data);
    callback(JSON.parse(result));
}

var arrayConfirm = [];

setInterval(function() {
    var now = Date.now();
    for (var i = arrayConfirm.length - 1; i >= 0; i--) {
        if ((now - arrayConfirm[i].time) > (300*1000)) {
            arrayConfirm[i].ws.send("@!CONFIRMID|FAIL");
            arrayConfirm.splice(i, 1);
        }else{
            arrayConfirm[i].ws.send("@!CONFIRMID|WAITING");
        }
    }
}, 5000);

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            if (message.includes("@!SUCCESSFUL")){
                var hash = message.split("|")[1];
                var time = message.split("|")[2];
                var steamId = message.split("|")[3];
                for (var i = arrayConfirm.length - 1; i >= 0; i--) {
                    if ((arrayConfirm[i].hash + arrayConfirm[i].time + arrayConfirm[i].steamId) === (hash+time+steamId)) {
                        arrayConfirm[i].ws.send("@SUCCESSFUL|" + 
                            arrayConfirm[i].hash + "|" +
                            arrayConfirm[i].time + "|" +
                            arrayConfirm[i].steamId
                        );
                        arrayConfirm.splice(i, 1);
                    }
                }
            }else if (message.includes("@!CONFIRMID")){
                var hash = message.split("|")[1];
                var time = Date.now();;
                var steamId = message.split("|")[3];
                arrayConfirm.push({hash: hash, time: time, steamId: steamId, confirm: false, ws: ws});
                client.send(message);
            }else{
                ws.send(message);
            }
        });
    });

    app.get('/send-mail/:email', function (req, res) {
        client.send("SENDMAIL|" + req.params.email);
        res.end('<script>location.replace("' + apiUrl + '/sign-up/check-mail.html")</script>');
    });

    app.get('/getuser/:id', function (req, res) {
        var id = req.params.id;
        chttpsCallback('GET', 'https://www.5etop.com/api/user/getuser.do?steamId='+id+'&lang=en', {}, function(data) {
            res.end( JSON.stringify(data));
        });
    });

    app.get('/menu/:hash', function (req, res) {
        var data = [
            {url: "", name: "Predictions", active: "active"},
            {url: "jackpot", name: "Jackpot", active: ""},
            {url: "my-bag", name: "My Bag", active: ""},
            {url: "bonus", name: "Bonus", active: ""},
            {url: "my-profile", name: "My Profile", active: ""}
        ];
        var hash = req.params.hash;
        log("C?? ng?????i ????ng nh???p", hash);
        findObj(dbo, "users", {hash: hash}, function(user) {
            if (user.length === 1) {
                var rs = user[0];
                console.log(rs);
                if (rs.email === 'canhnt1204@gmail.com') {
                    data.push({url: "admin", name: "Admin", active: ""});
                }
            }
            console.log(data);
            res.end( JSON.stringify(data));
        });
    });

    app.post('/sign-up', function (req, res, next) {
        var body = req.body;
        console.log("C?? ng?????i ????ng k??" ,body);
        var username = body.username;
        var email = body.email;
        var password = body.password;
        var obj = {
            time: Date.now(),
            username: username,
            email: email,
            password: password,
            hash: generateCodeActive()
        }
        findObj(dbo, "signup", {email: email}, function(data) {
            if (data.length === 0) {
                insertObj(dbo, "signup", [obj], function(data2) {
                    if (data2.data === 1) {
                        client.send("SENDMAIL|" + obj.email + "|" + obj.hash);
                        res.send('<script>location.replace("' + apiUrl + '/sign-up/check-mail.html")</script>');
                    }else{
                        res.send('<script>location.replace("' + apiUrl + '/sign-up/check-mail.html")</script>');
                    }
                });
            }else{
                res.end("Email has been used.");
            }
        });
    });

    app.get('/verification-account/:pass', function (req, res) {
        var pass = req.params.pass;
        log(pass);
        findObj(dbo, "signup", {hash: pass}, function(data) {
            if (data.length === 1) {
                var obj = data[0];
                delete obj['_id'];
                insertObj(dbo, "users", [obj], log);
                deleteObj(dbo, "signup", {hash: pass}, log);
                res.end('<script>location.replace("' + apiUrl + '/sign-up/actived.html")</script>');
            }
        });
    });

    app.post('/login', function (req, res, next) {
        var body = req.body;
        log("C?? ng?????i ????ng nh???p" , body);
        var obj = {
            email: body.email,
            password: body.password
        }
        findObj(dbo, "users", obj, function(data) {
            if (data.length === 1) {
                var rs = data[0];
                delete rs["password"];
                res.end( JSON.stringify(rs));
            }else{
                res.end( JSON.stringify({data: "login fail"}));
            }
        });
    });

    app.get('/user/:hash', function (req, res) {
        var hash = req.params.hash;
        log("C?? ng?????i ????ng nh???p", hash);
        findObj(dbo, "users", {hash: hash}, function(data) {
            if (data.length === 1) {
                var rs = data[0];
                delete rs["password"];
                res.end( JSON.stringify(rs));
            }else{
                res.end( JSON.stringify({data: "login fail"}));
            }
        });
    });

    app.get('/leaguePrize/:type', function (req, res) {
        var leaguePrize = [];
        res.end( JSON.stringify(leaguePrize));
    });

    app.get('/next-match/:type', function (req, res) {
        getData(req.params.type, function(data) {
            res.end( JSON.stringify(data));
        });
    });
});

function checkCollectionExist(dbo, collName, callback) {
    dbo.listCollections({name: collName}).next(function(err, collinfo) {
        callback(collinfo);
    });
}

function createCollection(dbo, collName, callback) {
    dbo.createCollection(collName, function(err, res) {
        if (err) throw err;
        log("Collection created!");
        callback(res);
    });
}

function insertObj(dbo, collName, array, callback) {
    dbo.collection(collName).insertMany(array, function(err, res) {
        if (err) throw err;
        log(res.insertedCount + " document(s) inserted");
        callback({data : res.insertedCount});
    });
}

function deleteObj(dbo, collName, obj, callback) {
    dbo.collection(collName).deleteMany(obj, function(err, res) {
        if (err) throw err;
        log(res.result.n + " document(s) deleted");
        callback({data : res.result.n});
    });
}

function updateObj(dbo, collName, obj, newObj, callback) {
    var newvalues = { $set: newObj };
    dbo.collection(collName).updateMany(obj, newvalues, function(err, res) {
        if (err) throw err;
        log(res.result.nModified + " document(s) updated");
        callback({data : res.result.nModified});
    });
}

function findObj(dbo, collName, obj, callback) {
    dbo.collection(collName).find(obj).toArray(function(err, result) {
        // after find .limit(5)
        if (err) throw err;
        callback(result);
    });
}

function log(message) {
    if (true) console.log(message);
}

function generateCodeActive() {
    var length = 32,
        charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        result = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        result += charset.charAt(Math.floor(Math.random() * n));
    }
    return result;
}


async function chttps(method, url, data) {
  const dataString = JSON.stringify(data)

  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    timeout: 5000, // in ms
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`))
      }

      const body = []
      res.on('data', (chunk) => body.push(chunk))
      res.on('end', () => {
        const resString = Buffer.concat(body).toString()
        resolve(resString)
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request time out'))
    })

    req.write(dataString)
    req.end()
  })
}

async function getData(name, callback){
   // console.clear();
   // console.log(Date.now() + " Start");
   const res = await chttps('GET', 'https://en.game-tournaments.com/' + name, "");
   const root = parse.parse(res);
   //console.log(root.querySelector('#block_matches_current'));
   var matchs_past = root.querySelector('#block_matches_current').querySelector('table').childNodes;
   var array = [];
   for (let i of  matchs_past) {
      if (i.rawTagName === 'tr'){
         var obj = {
            type: name
         };
         var live = i.rawAttrs.indexOf(' class="mlive');
         console.log(live);
         obj.rel = i.rawAttrs.substring(5, (live === -1 )? i.rawAttrs.length -1 : live - 1 );
         var str = i.childNodes[3].childNodes[1].rawAttrs;
         obj.link = str.substring(str.indexOf('href=')+6, str.indexOf(' title=') - 1);
         obj.title = str.substring(str.indexOf('tle=') + 5, str.indexOf(' class=') - 1);

            var datetime = i.childNodes[5].childNodes[3].childNodes[1].rawText;
            var date = datetime.split(" ")[0].split('-');
            var time = datetime.split(" ")[1].split(':');
            console.log(datetime, date, time);
            var datetime_1 = new Date(date[0], date[1], date[2], time[0], time[1], time[2], 0).getTime();

         obj.datetime = datetime_1;

         obj.team1 = i.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes[1].rawText;
         obj.teamName1 = "";
         obj.betPer1 = parseFloat(i.childNodes[3].childNodes[1].childNodes[3].childNodes[1].rawText.substring(1,5));
         obj.betPer1 = isNaN(obj.betPer1) ? 0 : obj.betPer1;
         
         obj.team2 = i.childNodes[3].childNodes[1].childNodes[5].childNodes[3].childNodes[1].rawText;
         obj.teamName2 = "";
         obj.betPer2 = parseFloat(i.childNodes[3].childNodes[1].childNodes[3].childNodes[5].rawText.substring(1,5));
         obj.betPer2 = isNaN(obj.betPer2) ? 0 : obj.betPer2;

         str = i.childNodes[7].childNodes[1].rawAttrs;
         obj.leagueLink = str.substring(str.indexOf('href=')+6, str.indexOf(' title=') - 1);
         obj.leagueName = str.substring(str.indexOf('tle=') + 5, str.length - 1);

         obj.teamName1 = obj.link.split(obj.leagueLink + '/')[1].split('-vs-')[0];
         obj.teamName2 = obj.link.split(obj.leagueLink + '/')[1].split('-vs-')[1].split('-' + obj.rel)[0];
         str = obj.leagueLink.split("/");
         obj.typeGame = str[3];
         obj.leagueLink = '/' + str[1] + '/' + str[2];
         array.push(obj);
      }
   }
   callback(array);

   var prize_pool;
   if (name === 'lol'){
      prize_pool = root.querySelector('.col-right').querySelector('table').childNodes[1].childNodes;
   }else{
      prize_pool = root.querySelector('.col-right').childNodes[3].querySelector('table').childNodes[1].childNodes;
   }
   var array_prize_pool = [];
   for (let i of  prize_pool) {
      if (i.rawTagName === 'tr'){
         var obj = {}
         obj.leagueName = i.childNodes[1].childNodes[0].childNodes[0].rawText;
         obj.leagueLink = i.childNodes[1].childNodes[0].rawAttrs.substring(6).replace('"','');
         obj.leaguePrize = parseInt(i.childNodes[3].childNodes[1].rawText.split(",").join(""));
         array_prize_pool.push(obj);
      }
   }
   // console.log(array_prize_pool);
}

var W3CWebSocket = require('websocket').w3cwebsocket;
var client;
var clientWsConnected = false;

function connectWSServer() {
    client = new W3CWebSocket('ws://27.71.228.17', 'echo-protocol');

    client.onerror = function() {
        console.log('Connection Error');
    };

    client.onopen = function() {
        console.log('WebSocket Client Connected');
        clientWsConnected = true;
    };

    client.onclose = function() {
        console.log('echo-protocol Client Closed');
        clientWsConnected = false;
        setTimeout(function() {
            connectWSServer();
        }, 1000);
    };

    client.onmessage = function(e) {
        if (typeof e.data === 'string') {
            console.log("Received: '" + e.data + "'");
        }
    };
}

connectWSServer();