app.directive('forceLayout', function() {

 return {
    scope: { 'url': '=', 'onClick': '&' },
    restrict: 'E',
    link: linkFn
  };

  function linkFn(scope, element, attr) {

        // Add and remove elements on the graph object
        this.addNode = function (id) {
            nodes.push({"id": id});
            update();
        };

        this.removeNode = function (id) {
            var i = 0;
            var n = findNode(id);
            while (i < links.length) {
                if ((links[i].source == n) || (links[i].target == n)) {
                    links.splice(i, 1);
                }
                else i++;
            }
            nodes.splice(findNodeIndex(id), 1);
            update();
        };

        this.removeLink = function (source, target) {
            for (var i = 0; i < links.length; i++) {
                if (links[i].source.id == source && links[i].target.id == target) {
                    links.splice(i, 1);
                    break;
                }
            }
            update();
        };

        this.removeallLinks = function () {
            links.splice(0, links.length);
            update();
        };

        this.removeAllNodes = function () {
            nodes.splice(0, links.length);
            update();
        };

        this.addLink = function (source, target, value) {
            links.push({"source": findNode(source), "target": findNode(target), "value": value});
            update();
        };

        var findNode = function (id) {
            for (var i in nodes) {
                if (nodes[i]["id"] === id) return nodes[i];
            }
            
        };

        var findNodeIndex = function (id) {
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].id == id) {
                    return i;
                }
            }
        };


  	//Constants for the SVG
  	var el = element[0];
	var width = attr.width,
    height = attr.height;

	//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
	var svg = d3.select(el).append("svg")
	    .attr("width", width)
	    .attr("height", height);

	//Set up the colour scale
	var color = d3.scale.category20();

	//Set up the force layout
	var force = d3.layout.force()
	    .charge(-120)
	    .linkDistance(80)
	    .size([width, height]);

	scope.$watch('url', function(newval, oldval) {
		//Read the data from the json file 
		console.log('new url',newval);
      	console.log('old url',oldval);
		d3.json(newval, function(error , json){
			if(error) throw error;
			var root = json;	
			console.log(root);
			update(root);
		});
	});

	var update = function(root) {
		var nodes = root.nodes;
		var links = root.links;

	//Create all the line svgs but without locations yet
	var link = svg.selectAll(".link")
	    .data(links);

	    link.enter().append("line")
	    .attr("class", "link")
	   /* .attr("stroke-width", function(d) {
	    	return d.value / 10;
	    })*/
    	.style("marker-end",  "url(#licensing)"); //Added 
    	 /*link.append("title")
                    .text(function (d) {
                        return d.value;
                    });
*/
            link.exit().remove();

	//Do the same with the circles for the nodes - no 
	var node = svg.selectAll(".node")
	    .data(nodes)
	    
	var nodeEnter = node.enter().append("circle")
	    .attr("class", "node")
	    .attr("r", 8)
	    .style("fill", function (d) {
	    return color(d.group);
	})
	    .call(force.drag);

	node.exit().remove();

			//---Insert-------
	var markers = svg.append("defs").selectAll("marker")
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
			//Creates the graph data structure out of the json data
	force.nodes(nodes)
		.links(links)
		.gravity(0.01)
		.friction(0)
	    .start();
};

}

});
