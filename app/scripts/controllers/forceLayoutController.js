/**
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable tat refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */

app.controller('forceLayoutController', function($scope, $interval, $http) {
	$scope.shared = {
		url: 'graph2.json'
	};
	$scope.nodes = [];

	$scope.links = [];

	$scope.nameToIdMap = {};

	$scope.nodes.getNode = function(name) {
		return $scope.nodes[$scope.nameToIdMap[name]];
	};
	$scope.counter = 0;

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

	$scope.isProperty = function(name) {
		return name.charAt(0).toLowerCase() === name.charAt(0);
	};

	$scope.createOrFindNode = function(name, workspace) {
		var node = $scope.nodes.getNode(name);

		if (!node) {
			node = {
				name: name,
				id: $scope.counter++,
				group: Math.floor(Math.random() * (8 - 1 + 1)) + 1,
				workspace: workspace
			};

			$scope.nameToIdMap[name] = node.id;
			$scope.nodes.push(node);
		}

		return node;
	};

	$scope.sendCommand = function(type, assertions) {
		
		var assertionEvents = [];
		// Simple POST request example (passing data) :
		$http.post('/someUrl', {
			msg: 'hello word!'
				/*"type": "ADDED",
"newAssertion": [
"http://itonics.co/itonics",
"http://itonics.co/itonics#BusinessUnit",
"http://itonics.co/rdf#type",
"http://itonics.co/rdfs#Resource"
]*/
		}).
		success(function(data, status, headers, config) {
			// this callback will be called asynchronously
			// when the response is available
		}).
		error(function(data, status, headers, config) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	};

	$scope.generateGraphFromData = function(data) {
		data.forEach(function(d) {
			if (d.type === "ADDED") {
				var workspace = d.newAssertion[0].split('/')[3];
				var subject = d.newAssertion[1].split('#')[1];
				var predicate = d.newAssertion[2].split('#')[1];
				var value = d.newAssertion[3].split('(')[0];
				var object;
				if(value === "Uri")
				 object = d.newAssertion[3].split('#')[1].split(')')[0];
				else if(value === "Plain")
				 object = value[1];
				console.log(object);
				//console.log("name space -->", namespace);
				//console.log("subject", subject);
				//console.log("predicate", predicate);
				//console.log("object", object);
				if(subject && subject !== "Resource" && subject !=="Class" && object !== "Resource" && object !== "Class")
				if (!$scope.isProperty(subject) && !$scope.isProperty(object)) {
					var subjectNode = $scope.createOrFindNode(subject, workspace);
					var objectNode = $scope.createOrFindNode(object, workspace);

					var link = {
						source: subjectNode.id,
						target: objectNode.id,
						name: predicate,
						value: Math.floor(Math.random() * (10 - 1 + 1)) + 1,
						workspace: workspace
					};

					//console.log(link);
					$scope.links.push(link);
				}
			}
		});
		//console.log($scope.nodes);
		//console.log($scope.links);
		$scope.links.forEach(function(link) {
			//if (link.source === link.target)
			//	console.log("B-I-N-G-O");
		});
	};
});
//};