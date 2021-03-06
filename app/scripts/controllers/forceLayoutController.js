app.controller('forceLayoutController', function($scope, $interval, $http) {
	$scope.shared = {
		url: 'graph2.json'
	};

	$scope.xnodes = [];
	$scope.xlinks = [];
	$scope.nameToIdMap = {};

	$scope.xnodes.getNode = function(name) {
		return $scope.xnodes[$scope.nameToIdMap[name]];
	};
	$scope.counter = 0;


	$http.get('http://localhost:8080/model/events')
	.success(function(data, status, headers, config) {
		$scope.generateGraphFromData(data);
	}).error(function(data, status, headers, config) {
		console.log('error', data);
	});

	$scope.isProperty = function(name) {
		return name.charAt(0).toLowerCase() === name.charAt(0);
	};

	$scope.createOrFindNode = function(name, workspace) {
		var node = $scope.xnodes.getNode(name);

		if (!node) {
			node = {
				name: name,
				id: $scope.counter++,
				group: Math.floor(Math.random() * (8 - 1 + 1)) + 1,
				workspace: workspace
			};

			$scope.nameToIdMap[name] = node.id;
			$scope.xnodes.push(node);
		}

		return node;
	};

	/*	// Simple POST request example (passing data) :
		$http.post('/someUrl', {
			msg: 'hello word!'
				/*"type": "ADDED",
				 "newAssertion": [
				 "http://itonics.co/itonics",
				 "http://itonics.co/itonics#BusinessUnit",
				 "http://itonics.co/rdf#type",
				 "http://itonics.co/rdfs#Resource"
				 ]
		}).
		success(function(data, status, headers, config) {
			// this callback will be called asynchronously
			// when the response is available
		}).
		error(function(data, status, headers, config) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	};*/

	//parse RDF data and convert into nodes and links d3 can draw
	$scope.generateGraphFromData = function(data) {
		data.forEach(function(d) {
			if (d.type === "ADDED") {
				var space = d.newAssertion[0].split('/')[3];
				var subject = d.newAssertion[1].split('#')[1];
				var predicate = d.newAssertion[2].split('#')[1];
				var value = d.newAssertion[3].split('(')[0];
				var valueSpace = space;
				var object;
				if (value === "Uri") {
					var split = d.newAssertion[3].split('#');
					valueSpace = split[0].split("/")[3];
					object = split[1].split(')')[0];
				} else if (value === "Plain") {
					object = value[1];
				}

				/*				
								console.log("name space -->", space);
								console.log("subject", subject);
								console.log("predicate", predicate);
								console.log("object", object);
				*/

				//filter by space and ignore properties then push parsed data into our nodes/links array
				if (subject && space === "itonics" && valueSpace === "itonics" && !$scope.isProperty(subject) && !$scope.isProperty(object)) {
					var subjectNode = $scope.createOrFindNode(subject, space);
					var objectNode = $scope.createOrFindNode(object, space);

					var link = {
						source: subjectNode.id,
						target: objectNode.id,
						name: predicate,
						value: Math.floor(Math.random() * (10 - 1 + 1)) + 1,
						workspace: space
					};

					$scope.xlinks.push(link);
				}
			}
		});

		//pass data to nodes and links objects shared to the directive
		$scope.nodes = $scope.xnodes;
		$scope.links = $scope.xlinks;
	};
});