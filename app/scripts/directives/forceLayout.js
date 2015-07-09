app.directive('forceLayout', function() {

 return {
    scope: { 'url': '=', 'onClick': '&' },
    restrict: 'E',
    link: linkFn
  };

  function linkFn(scope, element, attr) {
  	//Constants for the SVG
  	var el = element[0];
	var width = attr.width,
    height = attr.height;

	//Set up the colour scale
	var color = d3.scale.category20();

	//Set up the force layout
	var force = d3.layout.force()
	    .charge(-120)
	    .linkDistance(80)
	    .size([width, height]);

	//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
	var svg = d3.select(el).append("svg")
	    .attr("width", width)
	    .attr("height", height);

	//Read the data from the json file 
	d3.json('graph2.json', function(error , json){
		if(error) throw error;
		var graph = json;	
		//Creates the graph data structure out of the json data
	force.nodes(graph.nodes)
	    .links(graph.links)
	    .start();

	//Create all the line svgs but without locations yet
	var link = svg.selectAll(".link")
	    .data(graph.links)
	    .enter().append("line")
	    .attr("class", "link")
    	.style("marker-end",  "url(#licensing)"); //Added 

	//Do the same with the circles for the nodes - no 
	var node = svg.selectAll(".node")
	    .data(graph.nodes)
	    .enter().append("circle")
	    .attr("class", "node")
	    .attr("r", 8)
	    .style("fill", function (d) {
	    return color(d.group);
	})
	    .call(force.drag);

	    	//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
	force.on("tick", function () {
	    link.attr("x1", function (d) {
	        return d.source.x;
	    })
	        .attr("y1", function (d) {
	        return d.source.y;
	    })
	        .attr("x2", function (d) {
	        return d.target.x;
	    })
	        .attr("y2", function (d) {
	        return d.target.y;
	    });

	    node.attr("cx", function (d) {
	        return d.x;
	    })
	        .attr("cy", function (d) {
	        return d.y;
	    });
	});

		//---Insert-------
var markers= svg.append("defs").selectAll("marker")
			    .data(["suit", "licensing", "resolved"])
			  .enter().append("marker")
			    .attr("id", function(d) { return d; })
			    .attr("viewBox", "0 -5 10 10")
			    .attr("refX", 19)
			    .attr("refY", 0)
			    .attr("markerWidth", 6)
			    .attr("markerHeight", 6)
			    .attr("orient", "auto")
			  .append("path")
			    .attr("d", "M0,-5L12,0L0,5 L10,0 L0, -5")
			    .style("stroke", "#4679BD")
			    .style("opacity", "0.6");
			//---End Insert---

	});

}

});
