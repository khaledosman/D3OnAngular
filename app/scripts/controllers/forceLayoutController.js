app.controller('forceLayoutController', function($scope, $timeout, $interval){

	$scope.shared = { url: 'graph.json' };
	/*$interval(function(){
		$scope.shared.url='graph.json'; 
		console.log($scope.shared.url);
	}, 3000,2);*/
	$timeout(function(){
		$scope.shared.url='graph2.json'; 
	}, 5000);
});