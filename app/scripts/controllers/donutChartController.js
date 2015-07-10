app.controller('donutChartController', ['$scope', '$interval', 'd3Service', function($scope, $interval, d3Service) {
	// controller "knows" nothing about donut charts
	d3Service.d3().then(function(d3) {
		$scope.shared = {
			data: [1]
		};
		$scope.charts = d3.range(6);
		//$scope.chartClicked = 
		$interval(function() {
			var n = Math.round(Math.random() * 9) + 1;
			$scope.shared.data = d3.range(n).map(function(d) {
				return Math.random();
			});
		}, 1000);
	});
}]);