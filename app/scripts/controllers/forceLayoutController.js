app.controller('forceLayoutController', function($scope, $interval){

	$scope.shared = { url: 'graph.json' };
	/*$interval(function(){
		$scope.shared.url='graph.json'; 
		console.log($scope.shared.url);
	}, 3000,2);*/
	$interval(function(){
		$scope.shared.url='graph2.json'; 
		console.log($scope.shared.url);
	}, 5000,2);
});