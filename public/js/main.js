var app = angular.module('myApp', ["ngRoute"]);

app.config(function($routeProvider) {
   $routeProvider
      .when("/", {
         templateUrl : "page/main.html",
         controller : "mainCtrl"
      })
      .when("/jackpot", {
         templateUrl : "page/jackpot.html"
      })
      .when("/my-bag", {
         templateUrl : "page/my-bag.html"
      })
      .when("/bonus", {
         templateUrl : "page/bonus.html"
      })
      .when("/my-profile", {
         templateUrl : "page/my-profile.html"
      })
      .when("/admin", {
         templateUrl : "page/admin.html",
         controller : "adminCtrl"
      })
      .otherwise({
         template : "<p>Sorry when don't support yet</p>"
      });;
});

app.controller('controller', function($scope, $http) {
   $scope.websiteName = "BET MARKET";
   $scope.menu = [];
   $scope.user = {
      username: "test",
      data: "login fail"
   };
   var vm = this;
   vm.changeActiveMenu = function(url) {
      for (let i of $scope.menu) {
         if (i.url === url) {
            i.active = "active";
         }else{
            i.active = "";
         }
      }
   };

   $scope.liveID = readCookie('liveID');

   $http.get("/user/" + readCookie('liveID')).then(function (response) {
      $scope.user = response.data;
   });
   
   vm.login = function() {
      $('#loginModal').modal('hide');
      $('#loadingModal').modal('show');
      var posting = $.post( "/login",
       { email: $('#emailLogin').val(), password: $('#passwordLogin').val() } );
      posting.done(function( data ) {
         $scope.user = JSON.parse(data);
         if ($scope.user.username){
            document.cookie = "liveID=" + $scope.user.hash;
            $scope.liveID = readCookie('liveID');
            $scope.$apply();
            location.reload();
         }
         if ($scope.user.data === "login fail") {
            alert("Login fail");
         }
         $('#loadingModal').modal('hide');
      });
   };
   vm.logout = function() {
      deleteAllCookies();
      $scope.user = {};
      $scope.liveID = null;
   }
   $scope.bet = {
      teamBet: 0,
      rel: '',
      valueBet: 0
   };
   vm.bet = function(idGame) {
      console.log(idGame);
      for (let i of $scope.lol) {
         if (idGame === i.rel) {
            $scope.bet = i;
            console.log($scope.bet);
             $('#betModal').modal('show');
            break;
         }
      }
   }
   vm.change = function(idGame) {
      console.log(idGame);
   }
   vm.cancel = function(idGame) {
      $('#loginModal').modal('show');
   }
   $http.get("/next-match/lol").then(function (response) {
      $scope.lol = response.data;
   });
   $http.get("/menu/" + readCookie('liveID')).then(function (response) {
      $scope.menu = response.data;
   });
   $http.get("/leaguePrize/lol").then(function (response) {
      $scope.names = response.data;
   });

   $scope.bet.valueBet = 0;
   vm.totalValueBet = function() {
      var totalValue = 0.00;
      for (let i of $scope.inventory) {
         if (i.betted) {
            totalValue += i.value;
         }
      }
      return totalValue;
   }
   vm.checkBet = function () {
      console.log('checkBet');
      $scope.bet.valueBet = vm.totalValueBet();
   }
   vm.totalValue = function() {
      var totalValue = 0.00;
      for (let i of $scope.inventory) {
         if ((i.type === $scope.statusBag) && (!i.betted)) {
            totalValue += i.value;
         }
      }
      return totalValue;
   }
   vm.totalItem = function() {
      var totalItem = 0;
      for (let i of $scope.inventory) {
         if ((i.type === $scope.statusBag) && (!i.betted)) {
            totalItem++;
         }
      }
      return totalItem;
   }

   $scope.setBackground = function (item) {
      return item.style;
   }

   $scope.urlItem = "https://steamcommunity-a.akamaihd.net/economy/image/W_I_5GLm4wPcv9jJQ7z7tz_l_0sEIYUhRfbF4arNQkgGQGKd3kMuVpMgCwRZrhuYeVbf2uNDa_HZCjEuH5nvSUryOaKDx1uiU-9Qf9V1NmFX2dro004bBiXRVOUUCNUitZmS1g26WADFfDduw4QBgKXM1M-HCPPSrAynLlT3xxqopQ";
   
   //BET
   $scope.value = 10;
   $scope.betInventory = {
      dota2: [],
      csgo: []
   }
   $scope.status = "none";
   $scope.statusBag = "dota2";

   vm.inventoryByType = function() {
      var array = [];
      for (let i of $scope.inventory) {
         if ((i.type === $scope.statusBag) && (!i.betted)) {
            array.push(i);
         }
      }
      return array;
   }

   vm.betInventoryByType = function(name) {
      var array = [];
      for (let i of $scope.inventory) {
         if ((i.type === name) && (i.betted)) {
            array.push(i);
         }
      }
      return array;
   }

   vm.betItem = function(id) {
      for (let i of $scope.inventory) {
         i.betted = true;
      }
   }

   vm.betGame = function(team, obj) {
      console.log(team, obj);
      var array = [];
      for (let i of $scope.inventory) {
         if (i.betted){
            array.push(i);
         }
      }
      var objBet = {
         teamBet: team,
         rel: obj.rel,
         items: array
      }
      console.log(objBet);
   }
   //COMFIRM ID
   $scope.messageSteamConfirm = "";

   vm.getUser = function() {
      var id = $('#steamId').val();
      $http.get("/getUser/" + id).then(function (response) {
         if (response.data.code === 0) {

            $scope.messageSteamConfirm = "Nickname 5etop: " + response.data.datas.nickname;
            $('#steamId').val(response.data.datas.steamId);
         }else{
            $scope.messageSteamConfirm = "Wrong ID";
         }
      });
   }

   $scope.countDownConfirm = new Date().getTime();
   $scope.countDownConfirmText = "";

   vm.confirmSteamId = function() {
      console.log('confirmSteamId');
      $('#countdownModal').modal('show');
      $scope.countDownConfirm = (new Date().getTime()) + 300*1000;
      console.log($scope.countDownConfirm);
      let HOST = location.origin.replace(/^http/, 'ws');
      let websocket = new WebSocket(HOST);

      websocket.onopen = function(evt) { 
         websocket.send("@!CONFIRMID|" +  $scope.liveID + "|" + $scope.countDownConfirm + '|' + $('#steamId').val());
      };

      websocket.onmessage = (event) => {
         console.log(event.data);
         // if ()
      };
      // $http.post('/api/users/post', JSON.stringify(data))
      //    .then(function (response) {
      //       console.log(response);
      //       if (response.data) {
      //          console.log(response.data);
      //       }
      //    }, function (response) {
      //       console.log(response);
      // });
   }
   //ADMIN ADD GAME

   setInterval( function() {
      $('#countdownText').html(getCountdownConfirm($scope.countDownConfirm));
   }, 1000);

   function getCountdownConfirm(timestamp) {
      var distance = timestamp- (new Date().getTime());
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      return minutes + "m " + seconds + "s ";
   }

   function getCountdownGame(timestamp) {
      var distance = timestamp- (new Date().getTime());
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      return hours + "h " + minutes + "m " + seconds + "s ";
   }
   //
   $scope.inventory = [
      {
         _id: "1",
         user_id: "1",
         value: 1.02,
         name: "name 1.02",
         type: "dota2",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      },
      {
         _id: "2",
         user_id: "1",
         value: 2.02,
         name: "name 2.02",
         type: "dota2",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      },
      {
         _id: "3",
         user_id: "1",
         value: 5.00,
         name: "name 5.00",
         type: "csgo",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      },
      {
         _id: "4",
         user_id: "1",
         value: 10.02,
         name: "name 10.02",
         type: "csgo",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      },
      {
         _id: "5",
         user_id: "1",
         value: 20.00,
         name: "name 20",
         type: "dota2",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      },
      {
         _id: "6",
         user_id: "1",
         value: 20.00,
         name: "name 20",
         type: "csgo",
         style: {
            "background-image": "url("+ $scope.urlItem + ")"
         }
      }
   ];
});

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteAllCookies() {
   var cookies = document.cookie.split(";");

   for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf("=");
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
   }
}

app.controller('mainCtrl', function($scope, $http) {
   console.log('mainCtrl');
});

app.controller('adminCtrl', function($scope, $http) {
   console.log('adminCtrl');
   var ad = this;
   $scope.addGameAdmin = {};
   $scope.addGameObj = {
      x: {},
      bo: 1,
      game: []
   };
   ad.addGameAdmin = function(game) {
      $scope.addGameObj.x = game;
   }
   ad.insertGameAdmin = function() {
      var game = JSON.stringify($scope.addGameObj);
      $scope.runGames.push(JSON.parse(game));
   }

   $scope.runGames = [];
});

$( document ).ready(function() {
   new ClipboardJS('#clipboardSteamId');
});