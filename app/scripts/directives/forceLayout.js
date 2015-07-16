app.directive('forceLayout', ['d3Service', '$http', function(d3Service, $http) {

	return {
		scope: {
			'nodes': '=',
			'links': '=',
			'counter': '='
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
			optArray = [],
			radius = 8,
			padding = 1,
			link, node, linkText;

		scope.addNode = function(name, id) {
			nodes.push({
				"name": name,
				"id": id
			});
			update();

			var prefix = "http://itonics.co/itonics#";

			var Assertion = [
				prefix.concat("itonics"),
				prefix.concat("subject"),
				prefix.concat("predicate"),
				prefix.concat("object")
			];
			console.log(createAssertionEvent("ADDED", Assertion));

			/*
			 var createAssertionEvent = function(type, assertion) {
			 var AssertionEvent = {
			 "type": type,
			 "newAssertion": assertion
			 };
			 return AssertionEvent;
			 };
			 */
		};

		scope.searchNode = function searchNode() {

			//find the node
			var selectedVal = document.getElementById('search').value;

			var node = svg.selectAll(".node");
			if (selectedVal == "none") {
				node.style("stroke", "white").style("stroke-width", "1");
			} else {
				var selected = node.filter(function(d, i) {
					return d.name != selectedVal;
				});
				selected.style("opacity", "0");

				d3.selectAll(".node, .link").transition()
					.duration(2000)
					.style("opacity", 1);
			}
		};
		//adjust threshold
		scope.setThreshold = function(thresh) {
			links.splice(0, links.length);
			update();
			for (var i = 0; i < graphRec.links.length; i++) {
				if (graphRec.links[i].value > thresh) {
					links.push(graphRec.links[i]);
				}
			}
			update();
		};

		function mouseover() {

			var selected = d3.select(this);
			var name = selected.text();

			linkText.attr("opacity", 1);
			link.attr("opacity", 0.1);
			node.attr("opacity", 0.1);
			link.each(function(d) {
				if (d.source.name === name || d.target.name === name) {

					d3.select(this).attr("opacity", 1);

					node.each(function(n) {
						if (n.name === d.source.name || n.name === d.target.name) {

							var self = d3.select(this);
							self.attr("opacity", 1);
						}
					});
				}

			});

		}

		function mouseout() {
			node.attr("opacity", 1);
			link.attr("opacity", 1);
			linkText.attr("opacity", 0);
		}


		scope.removeNode = function(id) {

			var i = 0;
			var n = scope.findNode(id);

			while (i < links.length) {
				if ((links[i].source == n) || (links[i].target == n)) {
					links.splice(i, 1);
				} else i++;
			}
			nodes.splice(scope.findNodeIndex(id), 1);
			updateAutoComplete(nodes);
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
			updateAutoComplete(nodes);
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
				if (nodes[i].id == id) return nodes[i];
			}

		};

		scope.findNodeIndex = function(id) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].id == id) {
					return i;
				}
			}
		};

		function collide(alpha) {
			var quadtree = d3.geom.quadtree(nodes);
			return function(d) {
				var rb = 2 * radius + padding,
					nx1 = d.x - rb,
					nx2 = d.x + rb,
					ny1 = d.y - rb,
					ny2 = d.y + rb;
				quadtree.visit(function(quad, x1, y1, x2, y2) {
					if (quad.point && (quad.point !== d)) {
						var x = d.x - quad.point.x,
							y = d.y - quad.point.y,
							l = Math.sqrt(x * x + y * y);
						if (l < rb) {
							l = (l - rb) / l * alpha;
							d.x -= x *= l;
							d.y -= y *= l;
							quad.point.x += x;
							quad.point.y += y;
						}
					}
					return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
				});
			};
		}



		function dragstart(d, i) {

			node.on("mouseover", null).on("mouseout", null);
			/*	force.charge(0)
				.linkStrength(1)
				.friction(0)
					.charge(0)
					.gravity(0.05); // stops the force auto positioning before you start dragging*/
		}

		function dragmove(d, i) {
			/*d.px += d3.event.dx;
			d.py += d3.event.dy;
			d.x += d3.event.dx;
			d.y += d3.event.dy;
			force.resume();*/
		}

		function dragend(d, i) {
			node.on("mouseover", mouseover).on("mouseout", mouseout);
			d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			/*
						force
							.linkDistance(110)
							.linkStrength(0.3)
							.charge(-300)
							.friction(0.7)
							.gravity(0.001)
						.resume();*/
		}

		function releasenode(d) {
			d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			force.resume();
		}


		//Constants for the SVG
		var el = element[0];
		var width = window.innerWidth,
			height = window.innerHeight;

		//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
		var svg = d3.select(el).append("svg")
			.style("width", width)
			.attr("height", height);

		//Set up the colour scale
		var color = d3.scale.category20();

		//Set up the force layout
		var force = d3.layout.force()
			.size([width, height]);


		scope.$watch('nodes', function(newval, oldval) {

			nodes = newval;

			console.log('nodes changed', nodes);
			root = {
				nodes: nodes,
				links: links
			};

			graphRec = JSON.parse(JSON.stringify(root));
			updateAutoComplete(nodes);
			update();

		});

		function updateAutoComplete(nodes) {
			optArray = [];
			for (var i = 0; i < nodes.length - 1; i++) {
				optArray.push(nodes[i].name);
			}
			optArray = optArray.sort();
			$(function() {
				$("#search").autocomplete({
					source: optArray
				});
			});
		}


		scope.$watch('links', function(newval, oldval) {
			links = newval;
			console.log('links changed', links);
			root = {
				nodes: nodes,
				links: links
			};

			graphRec = JSON.parse(JSON.stringify(root));
			update();
		});


		var update = function() {
			var lineOpacity = .5;

			var markers = svg.selectAll("marker")
				.data(["arrow"]);

			markers.exit().remove();

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
				.attr('d', 'M0,-5L10,0L0,5')
				.attr('fill', '#000')
				.style("opacity", lineOpacity);


			//Create all the line svgs but without locations yet
			link = svg.selectAll(".link")
				.data(links);

			link.exit().remove();

			var linkEnter = link.enter().insert("g", ".node")
				.attr("class", "link");

			var line = linkEnter
				.append("line")
				.attr("opacity", lineOpacity)
				//.attr("class", "link")
				.style("marker-end", "url(#arrow)")
				.attr("stroke-width", 2);

			linkText = linkEnter.append("text")
				.attr("opacity", 0)
				.text(function(d) {
					return d.name;
				});


			//Do the same with the circles for the nodes - no
			node = svg.selectAll(".node")
				.data(nodes);


			node.exit().remove();

			var node_drag = force.drag()
				.on("dragstart", dragstart)
				.on("drag", dragmove)
				.on("dragend", dragend);

			var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.on('dblclick', releasenode)
				.on('mouseover', mouseover)
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
				//.attr("visibility", "hidden")
				.text(function(d) {
					setText(this, d.name);
					return d.name;
				});


			function setText(textElmt, str) {
				textElmt.textContent = str;
				var box = textElmt.getBBox();
				var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				//rect.style("fill","red");
				rect.setAttribute('fill', 'transparent');
				rect.setAttribute("border", "1px solid #cccccc");

				for (var n in box) {
					rect.setAttribute(n, box[n]);
				}
				textElmt.parentNode.insertBefore(rect, textElmt);
			}


			//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
			force.on("tick", function() {


				/*line.attr("d", function(d) {
				 var x1 = d.source.x,
				 y1 = d.source.y,
				 x2 = d.target.x,
				 y2 = d.target.y,
				 dx = x2 - x1,
				 dy = y2 - y1,
				 dr = Math.sqrt(dx * dx + dy * dy),

				 // Defaults for normal edge.
				 drx = dr,
				 dry = dr,
				 xRotation = 0, // degrees
				 largeArc = 0, // 1 or 0
				 sweep = 1; // 1 or 0

				 // Self edge.
				 if (x1 === x2 && y1 === y2) {
				 // Fiddle with this angle to get loop oriented.
				 xRotation = -45;

				 // Needs to be 1.
				 largeArc = 1;

				 // Change sweep to change orientation of loop.
				 //sweep = 0;

				 // Make drx and dry different to get an ellipse
				 // instead of a circle.
				 drx = 30;
				 dry = 20;

				 // For whatever reason the arc collapses to a point if the beginning
				 // and ending points of the arc are the same, so kludge it.
				 x2 = x2 + 1;
				 y2 = y2 + 1;
				 }

				 return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
				 });
				 */

				line.attr("x1", function(d) {
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

				linkText
					.attr("transform", function(d) {
						return "translate(" + (d.source.x + ((d.target.x - d.source.x) / 2)) + "," +
							(d.source.y + ((d.target.y - d.source.y) / 2)) + ")";
					});

				node
					.attr("transform", function(d) {
						return "translate(" + d.x + "," + d.y + ")";
					})
					.each(collide(0.6));

			});
			//Creates the graph data structure out of the json data
			force
				.links(links)
				.nodes(nodes)
				.linkDistance(110)
				.linkStrength(0.3)
				.charge(-300)
				.friction(0.7)
				.gravity(0.001)
				.start();

		};

	}

}]);