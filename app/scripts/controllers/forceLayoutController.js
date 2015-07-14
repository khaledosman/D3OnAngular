/**
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */

app.controller('forceLayoutController', function($scope, $timeout, $http) {
	$scope.shared = {
		url: 'graph2.json'
	};
	$scope.nodes = [];

	$scope.links = [];

	$scope.nodes.contains = function(name) {
		for (var i in this) {
			if (this[i].name === name) return true;
		}
	};
	/*$scope.nodes.indexOf = function(name) {
		console.log("This", this);
		console.log("name", name);
		for (var i in this) {
			if (this[i].name === name) return i;
			else console.log('fail');
		}
	};*/

	$scope.nodes.getNode = function(name) {
		for (var i in this) {
			if (this[i].name === name) return this[i];
		}
	};

	$scope.idCounter = (function() {
		var privateCounter = 0;

		function addOne() {
			privateCounter++;
		}
		return {
			increment: function() {
				addOne();
			},
			value: function() {
				return privateCounter;
			}
		};
	})();

	// Simple GET request example :
	$http.get('http://localhost:8080/model/events').success(function(data, status, headers, config) {
		//console.log(data);
		$scope.generateGraphFromData(data);
		// this callback will be called asynchronously
		// when the response is available
	}).error(function(data, status, headers, config) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
		console.log('error', data);
	});
	//$timeout(function() {$scope.shared.url = 'graph2.json';}, 7000);

	$scope.generateGraphFromData = function(data) {
		data.forEach(function(d) {
			if (d.type === "ADDED") {
				var subject = d.newAssertion[1].split('#')[1];
				var object = d.newAssertion[3].split('#')[1];
				var predicate = d.newAssertion[2].split('#')[1];

				//console.log("subject", subject);
				//console.log("predicate", predicate);
				//console.log("object", object);

				var subjNode = {
					name: "",
					group: Math.floor(Math.random() * (8 - 1 + 1)) + 1,
				};

				var objNode = {
					name: "",
					group: Math.floor(Math.random() * (8 - 1 + 1)) + 1,
				};

				if (!$scope.nodes.contains(subject)) {
					subjNode.id = $scope.idCounter.value();
					subjNode.name = subject;
					$scope.idCounter.increment();
					//console.log(subjNode);
					$scope.nodes.push(subjNode);
				} else {
					subjNode = $scope.nodes.getNode(subject);
				}

				if (!$scope.nodes.contains(object)) {
					objNode.id = $scope.idCounter.value();
					objNode.name = object;
					$scope.idCounter.increment();
					//console.log(objNode);
					$scope.nodes.push(objNode);
				} else {
					objNode = $scope.nodes.getNode(object);
				}


				var link = {
					source: $scope.nodes.indexOf(subjNode),
					target: $scope.nodes.indexOf(objNode),
					name: predicate,
					value: Math.floor(Math.random() * (10 - 1 + 1)) + 1
				};

				//console.log(link);
				$scope.links.push(link);

			}
		});
		console.log($scope.nodes);
		console.log($scope.links);
		$scope.links.forEach(function(link) {
			if (link.source === link.target)
				console.log("B-I-N-G-O");
		});
	};
});
//};