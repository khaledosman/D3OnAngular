app.directive('forceLayout', function() {

 return {
    scope: { 'url': '=', 'width': '=', 'height':'=', 'onClick': '&' },
    restrict: 'E',
    link: link
  };

  function link(scope, element, attr) {
  	var el = element[0];
    var width = el.clientWidth;
    var height = el.clientHeight;
    var root;
    var svg = d3.select(el).append('svg')
      .attr({width: width, height: height});


    var force = d3.layout.force()
      .linkDistance(80)
      .charge(-120)
      .gravity(0.05)
      .size([width, height])
      .on("tick", tick);

    var link = svg.selectAll(".link"),
      node = svg.selectAll(".node");
  }

});