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
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        
    });
});

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);

    app.get('/customers', function (req, res) {
        findObj(dbo, "customers", {}, function (data) {
            res.end( JSON.stringify(data));
        });
    });

    app.get('/menu', function (req, res) {
        var data = [
            {url: "", name: "Predictions", active: "active"},
            {url: "jackpot", name: "Jackpot", active: ""},
            {url: "my-bag", name: "My Bag", active: ""},
            {url: "bonus", name: "Bonus", active: ""},
            {url: "my-profile", name: "My Profile", active: ""}
        ];
        res.end( JSON.stringify(data));
    });

    app.post('/sign-up', function (req, res, next) {
        var body = req.body;
        console.log("Có người đăng ký" ,body);
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
                        sendActiveMail(obj.email, obj.hash, function(data3) {
                            res.send("Please user another email. We can't send to your email.");
                        });
                    }else{
                        res.send("Check your email: " + email + " to activate your account.");
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
                res.send("Your account is activated.");
            }
        });
    });

    app.post('/login', function (req, res, next) {
        var body = req.body;
        log("Có người đăng nhập" , body);
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
        log("Có người đăng nhập", hash);
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

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'canhnt1204@gmail.com',
    pass: '1204thanhcanh1994'
  }
});

function sendActiveMail(email, code, callback) {
    var mailOptions = {
      from: 'canhnt1204@gmail.com',
      to: email,
      subject: 'Your Bet Market Verification Code',
      text: 'Your activation link : ' + apiUrl + '/verification-account/' + code
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        log(error);
      } else {
        log('ĐÃ GỬI 1 MAIL XÁC NHẬN: ' + info.response);
      }
    });
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
         var obj = {};
         obj.rel = i.rawAttrs.substring(5, i.rawAttrs.indexOf(' class="mlive') -1);
         var str = i.childNodes[3].childNodes[1].rawAttrs;
         obj.link = str.substring(str.indexOf('href=')+6, str.indexOf(' title=') - 1);
         obj.title = str.substring(str.indexOf('tle=') + 5, str.indexOf(' class=') - 1);

         obj.time = i.childNodes[5].childNodes[3].childNodes[1].rawText;

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