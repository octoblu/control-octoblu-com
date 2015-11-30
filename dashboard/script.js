angular.module('app')

.controller('DashboardCtrl', ['$scope', '$timeout',
function($scope, $timeout) {
	$scope.gridsterOptions = {
		margins: [20, 20],
		mobileBreakPoint: 500,
		columns: 4,
		draggable: {
			handle: 'h3',
			enabled: false
		}
	};

	var MESSAGE_SCHEMA = {
		"type": 'object',
		"properties": {
			"name": {
				"type": "string"
			},
			"base64":{
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
				$scope.dashboard = result.board;
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
					"board": $scope.dashboard
				});
				console.log($scope.dashboard);
			}

			conn.on('message', function(data){
				console.log(data.payload.name);
				if(data.payload.base64){
					var canvas = document.getElementById(data.payload.name);
					var context = canvas.getContext('2d');
					var img = new Image();

					img.onload = function() {
						context.drawImage(this, 0, 0, canvas.width, canvas.height);
					}
					img.src = data.payload.base64;
				}
			});

		});
	}else if(!GET.uuid){
		var conn = meshblu.createConnection({});
		$scope.showClaim = true;
		conn.on('ready', function(data){
			console.log('Ready', data);
			data.type = 'device:controlPanel';
			data.discoverWhitelist = [data.uuid];
			data.board = initialDash;
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
			sizeY: 1
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

	$scope.astrals = ['slider', 'button', 'switch','base64-img'];

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
