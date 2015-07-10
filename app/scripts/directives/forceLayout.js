app.directive('forceLayout', ['d3Service', function(d3Service) {

	return {
		scope: {
			'url': '=',
			'onClick': '&'
		},
		restrict: 'E',
		link: linkFn,
		templateUrl: 'app/scripts/partials/forceGraphButtons.html'
	};

	function linkFn(scope, element, attr) {
		d3Service.d3().then(function(d3) {
			var graph = new Graph(scope, element, attr);
		});
	}

	function Graph(scope, element, attr) {
		var nodes = [],
			links = [],
			link, node;
		scope.addNode = function(id) {
			nodes.push({
				"id": id
			});
			update();
		};

		//adjust threshold
		scope.setThreshold = function(thresh) {
			links.splice(0, links.length);
			for (var i = 0; i < graphRec.links.length; i++) {
				if (graphRec.links[i].value > thresh) {
					links.push(graphRec.links[i]);
				}
			}
			update();
		};


		function restart() {

			link = link.data(links);
			link.exit().remove();
			link.enter().insert("line", ".node").attr("class", "link");
			node = node.data(nodes);
			node.enter().insert("circle", ".cursor").attr("class", "node").attr("r", 5).call(force.drag);
			force.start();
		}

		//Toggle stores whether the highlighting is on
		var toggle = 0;
		//Create an array logging what is connected to what
		var linkedByIndex = {};
		for (i = 0; i < nodes.length; i++) {
			linkedByIndex[i + "," + i] = 1;
		}
		links.forEach(function(d) {
			linkedByIndex[d.source.index + "," + d.target.index] = 1;
		});
		//This function looks up whether a pair are neighbours
		function neighboring(a, b) {
			return linkedByIndex[a.index + "," + b.index];
		}

		function connectedNodes() {
			//if(toggle === 0) {
			var selected = d3.select(this);
			var name = selected.text();
			console.log(name);
			link.attr("opacity", 0.5);
			node.attr("opacity", 0.5);
			link.each(function(d) {
				if (d.source.name === name || d.target.name === name) {

					d3.select(this).attr("opacity", 1);
					node.each(function(n) {
						if (n.name === d.source.name || n.name === d.target.name) {
							//console.log(n.name);
							d3.select(this).attr("opacity", 1);
						}
					});
				}

			});
			toggle = 1;
			//   console.log("toggle",toggle);

			// }
			/*  else {
			  	        //Put them back to opacity=1
			    node.attr("opacity", 1);
			    link.attr("opacity", 1);
			    toggle = 0;
			    console.log("toggle",toggle);
			  }*/
		}

		function mouseout() {
			node.attr("opacity", 1);
			link.attr("opacity", 1);
			toggle = 0;
			// console.log("toggle",toggle);
		}



		scope.goCrazy = function() {
			setInterval(function() {
				if (nodes.length !== 0)
					scope.removeNode();
			}, 100);
		};

		scope.removeNode = function(id) {
			var i = 0;
			var n = scope.findNode(id);
			while (i < links.length) {
				if ((links[i].source == n) || (links[i].target == n)) {
					links.splice(i, 1);
				} else i++;
			}
			nodes.splice(scope.findNodeIndex(id), 1);
			update();
		};

		scope.removeLink = function(source, target) {
			for (var i = 0; i < links.length; i++) {
				if (links[i].source.id == source && links[i].target.id == target) {
					links.splice(i, 1);
					break;
				}
			}
			update();
		};

		scope.removeAllLinks = function() {
			links.splice(0, links.length);
			update();
		};

		scope.removeAllNodes = function() {
			nodes.splice(0, nodes.length);
			update();
		};

		scope.addLink = function(source, target, value) {
			links.push({
				"source": scope.findNode(source),
				"target": scope.findNode(target),
				"value": value
			});
			update();
		};

		scope.findNode = function(id) {
			for (var i in nodes) {
				if (nodes[i].id === id) return nodes[i];
			}

		};

		scope.findNodeIndex = function(id) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].id == id) {
					return i;
				}
			}
		};



		var node_drag = d3.behavior.drag()
			.on("dragstart", dragstart)
			.on("drag", dragmove)
			.on("dragend", dragend);

		function dragstart(d, i) {
			// force.stop() // stops the force auto positioning before you start dragging
		}

		function dragmove(d, i) {
			d.px += d3.event.dx;
			d.py += d3.event.dy;
			d.x += d3.event.dx;
			d.y += d3.event.dy;
		}

		function dragend(d, i) {
			d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			force.resume();
		}

		function releasenode(d) {
			d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			//force.resume();
		}


		//Constants for the SVG
		var el = element[0];
		var width = attr.width,
			height = attr.height;

		//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
		var svg = d3.select(el).append("svg")
			.style("width", "100%")
			.attr("height", height);

		//Set up the colour scale
		var color = d3.scale.category20();

		//Set up the force layout
		var force = d3.layout.force()
			.charge(-120)
			.linkDistance(80)
			.size([width, height]);

		//this.nodes= force.nodes();
		//this.links = force.links();


		scope.$watch('url', function(newval, oldval) {
			//Read the data from the json file 
			console.log('new url', newval);
			console.log('old url', oldval);
			d3.json(newval, function(error, json) {
				if (error) throw error;
				//	console.log("graph", json);
				root = json;
				graphRec = JSON.parse(JSON.stringify(root));
				//	console.log("graphRec", graphRec);
				nodes = root.nodes;
				links = root.links;
				update();
			});
		});

		/*
		   // Browser onresize event
		          window.onresize = function() {
		            scope.$apply();
		          };


		    scope.$watch(function() {
		            return el.innerWidth;
		          }, function() {
		            update();
		          });
		    */

		var update = function() {
			//this.nodes = root.nodes;
			//this.links = root.links;
			//Create all the line svgs but without locations yet
			link = svg.selectAll(".link")
				.data(links);

			link.enter().append("line")
				.attr("class", "link")
				/* .attr("stroke-width", function(d) {
				 	return d.value / 10;
				 })*/
				.style("marker-end", "url(#arrow)"); //Added 
			/*	link.append("title")
                    .text(function (d) {
                        return d.value;
                    });
*/
			link.exit().remove();

			//Do the same with the circles for the nodes - no 
			node = svg.selectAll(".node")
				.data(nodes);

			var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.call(force.drag)
				.on('dblclick', releasenode)
				.on('mouseover', connectedNodes)
				.on('mouseout', mouseout)
				.call(node_drag); //Added

			var circle =
				nodeEnter.append("circle")
				.attr("r", 8)
				.style("fill", function(d) {
					return color(d.group);
				});

			var text = nodeEnter.append("text")
				.attr("dy", "-1.3em")
				.style("fill", "gray")
				.text(function(d) {
					setText(this, d.name);
					return d.name;
				});

			function setText(textElmt, str) {
				textElmt.textContent = str;
				var box = textElmt.getBBox();
				var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				//rect.style("fill","red");
				rect.setAttribute('fill', 'white');
				rect.setAttribute("border", "1px solid #cccccc");

				for (var n in box) {
					rect.setAttribute(n, box[n]);
				}
				textElmt.parentNode.insertBefore(rect, textElmt);
			}


			node.exit().remove();


			var markers = svg.selectAll("marker")
				.data(["arrow"]);

			markers.enter().append("marker")
				.attr("id", function(d) {
					return d;
				})
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

			markers.exit().remove();



			//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
			force.on("tick", function() {

				link.attr("x1", function(d) {
						return d.source.x;
					})
					.attr("y1", function(d) {
						return d.source.y;
					})
					.attr("x2", function(d) {
						return d.target.x;
					})
					.attr("y2", function(d) {
						return d.target.y;
					});

				/*circle.attr("cx", function (d) {
				    return d.x;
				})
				    .attr("cy", function (d) {
				    return d.y;
				});*/

				node
					.attr("transform", function(d) {
						return "translate(" + d.x + "," + d.y + ")";
					});

			});
			//Creates the graph data structure out of the json data
			force.nodes(nodes)
				.links(links)
				.gravity(0.01)
				.friction(0)
				.start();
		};


		/*setTimeout(function(){
			removeallLinks();
		}, 5000);
		*/


	}

}]);