
var app = angular.module('MyApp',['ngMaterial','geolocation']);

app.controller('AppCtrl', function($scope, geolocation) {

  // initialize with at least something
  $scope.displayText = "Hello World";

  var MESSAGE_SCHEMA = {
    "type": 'object',
    "properties": {
      "enable": {
        "type": "boolean",
        "title": "Enable Interval",
        "default": false
      },
      "ping": {
        "type": "boolean",
        "default": false
      }
    }
  };

  $scope.payload = function(payload){
    $scope.enable = payload.enable;
    if(payload.ping == true){
      $scope.sendMessage();
    }
  }

  setInterval(function(){
    if($scope.enable == true){
      geolocation.getLocation().then(function(data){
          $scope.coords = {lat:data.coords.latitude, long:data.coords.longitude};

          var message = {
            "devices": "*",
            "payload": {
              "coords": $scope.coords
            }
          };

          console.log(message);
          conn.message(message);
        });
    }
  }, 1000);

  var GET = {};
  var query = window.location.search.substring(1).split("&");
  for (var i = 0, max = query.length; i < max; i++)
  {
    if (query[i] === "")
    continue;
    var param = query[i].split("=");
    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
  }

  var conn = meshblu.createConnection({
    "uuid": GET.uuid,
    "token": GET.token
  });

  conn.on('ready', function(data){
    console.log('UUID AUTHENTICATED!');
    console.log(data);
    conn.update({
      "uuid": GET.uuid,
      "messageSchema": MESSAGE_SCHEMA
    });

    conn.on('message', function(data){
      $scope.payload(data.payload);
    });

    $scope.sendMessage = function(){
      geolocation.getLocation().then(function(data){
          $scope.coords = {lat:data.coords.latitude, long:data.coords.longitude};
          //console.log($scope.coords);

          var message = {
            "devices": "*",
            "payload": {
              "coords": $scope.coords
            }
          };

          console.log(message);
          conn.message(message);

        });
    }
  });

});
