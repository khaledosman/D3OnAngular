app.controller('donutChartController', function($scope, $interval){
  // controller "knows" nothing about donut charts
  $scope.shared = { data: [1] };
  $scope.charts = d3.range(100);
  //$scope.chartClicked = 
  $interval(function(){
    var n = Math.round(Math.random() * 9) + 1;
    $scope.shared.data = d3.range(n).map(function(d){ return Math.random(); });
  }, 1000);
});