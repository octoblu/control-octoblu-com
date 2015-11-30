angular.module('app')

.controller('DashboardCtrl', ['$scope', '$timeout',
function($scope, $timeout) {
	$scope.gridsterOptions = {
		margins: [20, 20],
		columns: 4,
		draggable: {
			handle: 'h3',
			enabled: false
		}
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

	var conn = meshblu.createConnection({
		"uuid": GET.uuid,
		"token": GET.token
	});


	conn.on('ready', function(data){
		console.log('UUID AUTHENTICATED!');
		conn.whoami({}, function(result) {
			$scope.dashboard = result.board;
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


	});

	$scope.dashboards = {
		'1': {
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
		}
	};

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

	$scope.astrals = ['slider', 'button', 'switch'];

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
