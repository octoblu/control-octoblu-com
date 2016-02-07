angular.module('app')
.controller('DashboardCtrl', ['$scope', '$timeout', '$rootScope', 'geolocation',
function($scope, $timeout, $rootScope, geolocation) {


	$scope.Hmap = [50, -111];
	$scope.gridsterOptions = {
		margins: [20, 20],
		mobileBreakPoint: 600,
		columns: 5,
		draggable: {
			handle: 'h3',
			enabled: false
		},
		resizable: {
       enabled: true,
       handles: ['se'],
       resize: function(event, $element, widget) {
				 if(widget.type == "map"){
					 var i = _.findLastIndex($scope.dashboard.widgets, { 'name': widget.name});
  				 $scope.dashboard.widgets[i].height = widget.sizeY * 100 + "px"; 
				 }
			 },
    }
	};

	var MESSAGE_SCHEMA = {
		"type": 'object',
		"properties": {
			"name": {
				"type": "string"
			},
			"type":{
				"type": "string",
				"enum": ["image", "text", "map"]
			},
			"data":{
				"type": "string"
			},
			"lat": {
				"type": "string"
			},
			"lon": {
				"type": "string"
			}
		}
	};

	var initialDash = {
		id: '1',
		name: 'Home',
		widgets: [{
			col: 0,
			row: 0,
			sizeY: 1,
			sizeX: 1,
			name: "Widget 1",
			type: "slider"
		}, {
			col: 1,
			row: 1,
			sizeY: 1,
			sizeX: 1,
			name: "Widget 2",
			type: "button"
		},
		{
			col: 2,
			row: 1,
			sizeY: 1,
			sizeX: 1,
			name: "Widget 3",
			type: "switch"
		}]
	};


	var GET = {};
	var query = window.location.search.substring(1).split("&");
	for (var i = 0, max = query.length; i < max; i++)
	{
		if (query[i] === "")
		continue;
		var param = query[i].split("=");
		GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
	}

	if(GET.uuid){

		var conn = meshblu.createConnection({
			"uuid": GET.uuid,
			"token": GET.token
		});

		conn.on('ready', function(data){
			console.log('UUID AUTHENTICATED!');
			conn.whoami({}, function(result) {
				$scope.dashboard = result.board || initialDash;
				$scope.showClaim = false;
				$scope.deviceName = result.name || "Dashboard";
				$scope.$apply();
			});

			$scope.sendMessage = function(name, value) {
				var message = {
					"devices": "*",
					"payload": {"name": name, "value": value}
				};
				conn.message(message);
				console.log(message);
			};

			$scope.saveBoard = function() {
				conn.update({
					"uuid": GET.uuid,
					"board": $scope.dashboard,
					"messageSchema": $scope.createSchema()
				});
				console.log($scope.dashboard);
			}

			$scope.createSchema = function(){
				var newSchema = MESSAGE_SCHEMA;
				var names = [];
				$scope.dashboard.widgets.forEach(function(entry) {
						    if(entry.type == 'displayImage' || entry.type == 'text' || entry.type == "map"){
									names.push(entry.name);
								}
						});
				newSchema.properties.name.enum = names;
				return newSchema
			}

			conn.on('message', function(data){
				//console.log(data.payload.name);
				if(data.payload.type == "image"){
					var canvas = document.getElementById(data.payload.name);
					var context = canvas.getContext('2d');
					var img = new Image();

					img.onload = function() {
						context.drawImage(this, 0, 0, canvas.width, canvas.height);
					}
					img.src = data.payload.data;
				}
				if(data.payload.type == "text"){
					document.getElementById(data.payload.name).innerHTML = data.payload.data;
				}
				if(data.payload.type == "map"){

					var widget = _.findLastIndex($scope.dashboard.widgets, { 'name': data.payload.name});

					$scope.dashboard.widgets[widget].lat = data.payload.lat;
					$scope.dashboard.widgets[widget].lon = data.payload.lon;

					$scope.$apply();
				}
			});

			$scope.sendGeo = function(){
				geolocation.getLocation().then(function(data){
						$scope.coords = {lat:data.coords.latitude, long:data.coords.longitude};
						//console.log($scope.coords);

						var message = {
							"devices": "*",
							"payload": {
								"coords": $scope.coords
							}
						};

					//	console.log(message);
						conn.message(message);

					});
			}

			setInterval(function(){
		    if($scope.enableGeo == true){
		      geolocation.getLocation().then(function(data){
		          $scope.coords = {lat: data.coords.latitude, lon: data.coords.longitude};

		          var message = {
		            "devices": "*",
		            "payload": {
									"geolocation": {
										"coords": $scope.coords
									}
		            }
		          };

		          //console.log(message);
		          conn.message(message);
		        });
		    }
		  }, 3000);


		});
	}else if(!GET.uuid){
		var conn = meshblu.createConnection({});
		$scope.showClaim = true;
		conn.on('ready', function(data){
			console.log('Ready', data);
			data.type = 'device:controlPanel';
			data.discoverWhitelist = [data.uuid];
			data.messageSchema = MESSAGE_SCHEMA;
			data.logo  = "https://s3-us-west-2.amazonaws.com/octoblu-icons/device/astral_plane.svg";
			conn.update(data);
			$scope.useURL   = "http://control.octoblu.com/?uuid=" + data.uuid + "&token=" + data.token;
			$scope.claimURL = "https://app.octoblu.com/node-wizard/claim/" + data.uuid + "/" + data.token;
			$scope.$apply();
		});
	}


	$scope.clear = function() {
		$scope.dashboard.widgets = [];
	};

	$scope.addWidget = function() {
		$scope.dashboard.widgets.push({
			name: "New Widget",
			sizeX: 1,
			sizeY: 1,
			lat: 33,
			lon: -111,
			height: "100px"
		});
	};

	$scope.disableDrag = function(value) {
		$scope.gridsterOptions.draggable.enabled = value;
		console.log($scope.gridsterOptions.draggable.enabled);
	};



}
])

.controller('CustomWidgetCtrl', ['$scope', '$modal',
function($scope, $modal) {

	$scope.astrals = ['slider', 'button', 'switch','displayImage', 'text', 'map'];

	$scope.remove = function(widget) {
		$scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
	};

	$scope.openSettings = function(widget) {
		$modal.open({
			scope: $scope,
			templateUrl: 'dashboard/widget_setting.html',
			controller: 'WidgetSettingsCtrl',
			resolve: {
				widget: function() {
					return widget;
				}
			}
		});
	};

}
])

.controller('WidgetSettingsCtrl', ['$scope', '$timeout', '$rootScope', '$modalInstance', 'widget',
function($scope, $timeout, $rootScope, $modalInstance, widget) {
	$scope.widget = widget;

	$scope.form = {
		name: widget.name,
		type: widget.type,
		sizeX: widget.sizeX,
		sizeY: widget.sizeY,
		col: widget.col,
		row: widget.row
	};

	$scope.sizeOptions = [{
		id: '1',
		name: '1'
	}, {
		id: '2',
		name: '2'
	}, {
		id: '3',
		name: '3'
	}, {
		id: '4',
		name: '4'
	}];

	$scope.dismiss = function() {
		$modalInstance.dismiss();
	};

	$scope.remove = function() {
		$scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
		$modalInstance.close();
	};

	$scope.submit = function() {
		angular.extend(widget, $scope.form);

		$modalInstance.close(widget);
	};

}
])

// helper code
.filter('object2Array', function() {
	return function(input) {
		var out = [];
		for (i in input) {
			out.push(input[i]);
		}
		return out;
	}
});
