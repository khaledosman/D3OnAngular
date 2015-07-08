app.directive('forceLayout', function() {

 return {
    scope: { 'url': '=', 'width': '=', 'height':'=', 'onClick': '&' },
    restrict: 'E',
    link: linkFn
  };

  function linkFn(scope, element, attr) {
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


	function tick() {
	  link
	    .attr("x1", function(d) { return d.source.x; })
	    .attr("y1", function(d) { return d.source.y; })
	    .attr("x2", function(d) { return d.target.x; })
	    .attr("y2", function(d) { return d.target.y; });

	  node
	    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}

    var link = svg.selectAll(".link"),
      node = svg.selectAll(".node");
  }

});