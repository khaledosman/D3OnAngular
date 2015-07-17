app.directive('forceLayout', ['d3Service', '$http', function(d3Service, $http) {
	//directive's attribute
	return {
		//isolated scope's attributes
		// '=' means twoway data binding '@' is oneway '&' is inherited from parent scope
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
		//define our variables, might need to be cleaned
		var nodes = [],
			links = [],
			drag_line,
			circle,
			counter,
			root = {},
			optArray = [],
			radius = 8,
			padding = 1,
			link, node, linkText, line, linkLabel;


		// mouse event vars
		var selected_node = null,
			selected_link = null,
			mousedown_link = null,
			mousedown_node = null,
			mouseup_node = null;



		function resetMouseVars() {
			mousedown_node = null;
			mouseup_node = null;
			mousedown_link = null;
		}
		//Constants for the SVG
		var el = element[0];
		var width = window.innerWidth,
			height = window.innerHeight;



		//helper functions to add/remove/search for stuff

		scope.addNode = function(name, id) {
			console.log(counter);
			nodes.push({
				"name": name,
				"id": counter
			});

			counter++;
			update();

			var prefix = "http://itonics.co/itonics#";

			var Assertion = [
				prefix.concat("itonics"),
				prefix.concat("subject"),
				prefix.concat("predicate"),
				prefix.concat("object")
			];
			var createAssertionEvent = function(type, assertion) {
				var AssertionEvent = {
					"type": type,
					"newAssertion": assertion
				};
				return AssertionEvent;
			};

			console.log(createAssertionEvent("ADDED", Assertion));
		};

		//autocomplete search
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
				link.style("opacity", "0");

				d3.selectAll(".node, .link").transition()
					.duration(2000)
					.style("opacity", 1);
			}
		};

		//adjust threshold from slider
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

		//autocomplete search data
		function updateAutoComplete(nodes) {
			optArray = [];
			for (var i = 0; i < nodes.length - 1; i++) {
				optArray.push(nodes[i].name);
			}
			optArray = optArray.sort();
			$(function() {
				$("#search").autocomplete({
						source: optArray
					})
					.keypress(function(e) {
						if (e.keyCode == 13) {
							e.preventDefault();
							scope.searchNode(this.value);
							$(this).autocomplete('close');
						}
					});
			});
		}

		//removes a node has a problem when adding links after, also need to update our graphRec with 
		//changes to nodes/links array
		scope.removeNode = function(id) {

			var i = 0;
			//var n = scope.findNode(--counter);
			//console.log(n);
			//var n = nodes.pop();
			var n = nodes[0];

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
			/*for (var i = 0; i < links.length; i++) {
				if (links[i].source.id == source && links[i].target.id == target) {
					links.splice(i, 1);
					break;
				}
			}*/
			links.pop();
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
			/*links.push({
				"source": scope.findNode(source),
				"target": scope.findNode(target),
				"value": value
			});*/
			var link = {
				"source": scope.findNode(Math.floor(Math.random() * (nodes.length - 2 + 1)) + 1),
				"target": scope.findNode(Math.floor(Math.random() * (nodes.length - 2 + 1)) + 1),
				"value": scope.findNode(Math.floor(Math.random() * (8 - 1 + 1)) + 1)
			};
			links.push(link);
			console.log(link);

			update();
		};

		//get node by id
		scope.findNode = function(id) {
			for (var i in nodes) {
				if (nodes[i].id == id) return nodes[i];
			}

		};

		//get node index by id
		scope.findNodeIndex = function(id) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].id == id) {
					return i;
				}
			}
		};

		//collision detection prevents nodes from colliding
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

		//node mouseover
		function mouseover() {

			var selected = d3.select(this);
			//get node's name
			var name = selected.text();

			//dim all nodes and links
			node.attr("opacity", 0.2);
			link.attr("opacity", 0.1);
			//search for links connected to this node
			link.each(function(d) {
				if (d.source.name === name || d.target.name === name) {
					//highlight connected links
					d3.select(this).attr("opacity", 0.7);
					//get link id
					var id = d3.select(this).attr('id');
					//get relationship labels of that id
					var selectedTexts = linkText.filter(function(d, i) {
						return i == id;
					});
					//highlight them aswell
					selectedTexts.style("opacity", "1");
					//highlight connected nodes aswell
					node.each(function(n) {
						if (n.name === d.source.name || n.name === d.target.name) {
							var self = d3.select(this);
							self.attr("opacity", 1);
						}
					});
				}

			});

		}

		//node mouseout
		function mouseout() {
			var selected = d3.select(this);
			var name = selected.text();
			//restore default opacity, should use variables
			node.attr("opacity", 1);
			link.attr("opacity", 0.5);
			linkText.attr("opacity", 0);
			//undo mouseover, hide relationship labels that were highlighted on mouseover
			link.each(function(d) {
				if (d.source.name === name || d.target.name === name) {
					var id = d3.select(this).attr('id');
					var selected = linkText.filter(function(d, i) {
						return i !== id;
					});
					selected.style("opacity", "0");
				}
			});
		}

		//called when drag event starts
		function dragstart(d, i) {
			//deregister mouse listener to prevent overlap between drag and mouseover
			node.on("mouseover", null).on("mouseout", null);
		}

		//dont need to update anything since we're overriding d3's force drag method
		function dragmove(d, i) {}

		//register listeners again and pin
		function dragend(d, i) {
			node.on("mouseover", mouseover).on("mouseout", mouseout);
			//pin node
			d.fixed = true;
		}

		//unpin
		function releasenode(d) {
			d.fixed = false;
			force.resume();
		}

		//define our canvas
		//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
		var svg = d3.select(el).append("svg")
			.style("width", width)
			.style("height", height)
			.on('mousedown', svgmousedown)
			.on('mousemove', svgmousemove)
			.on('mouseup', svgmouseup);

		d3.select(window)
			.on('keydown', keydown)
			.on('keyup', keyup);

		drag_line = svg.insert('svg:path')
			.attr('class', 'dragline hidden')
			.style('stroke-width', 2)
			.attr('d', 'M0,0L0,0');

		// define arrow markers for graph links

		svg.append('svg:defs').append('svg:marker')
				.attr("id", "arrow")
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 19)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("path")
				.attr('d', 'M0,-5L10,0L0,5')
				.attr('fill', '#000')
				.style("opacity", 0.5);


		svg.append('svg:defs').append('svg:marker')
			.attr('id', 'end-arrow')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 6)
			.attr('markerWidth', 3)
			.attr('markerHeight', 3)
			.attr('orient', 'auto')
			.append('svg:path')
			.attr('d', 'M0,-5L10,0L0,5')
			.attr('fill', '#000');

		svg.append('svg:defs').append('svg:marker')
			.attr('id', 'start-arrow')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 4)
			.attr('markerWidth', 3)
			.attr('markerHeight', 3)
			.attr('orient', 'auto')
			.append('svg:path')
			.attr('d', 'M10,-5L0,0L10,5')
			.attr('fill', '#000');


		function keydown() {
			d3.event.preventDefault();

			if (lastKeyDown !== -1) return;
			lastKeyDown = d3.event.keyCode;

			// ctrl
			if (d3.event.keyCode === 17) {
				circle.call(force.drag);
				svg.classed('ctrl', true);
			}

			if (!selected_node && !selected_link) return;
			switch (d3.event.keyCode) {
				case 8: // backspace
				case 46: // delete
					if (selected_node) {
						nodes.splice(nodes.indexOf(selected_node), 1);
						spliceLinksForNode(selected_node);
					} else if (selected_link) {
						links.splice(links.indexOf(selected_link), 1);
					}
					selected_link = null;
					selected_node = null;
					update();
					break;
				case 66: // B
					if (selected_link) {
						// set link direction to both left and right
						selected_link.left = true;
						selected_link.right = true;
					}
					update();
					break;
				case 76: // L
					if (selected_link) {
						// set link direction to left only
						selected_link.left = true;
						selected_link.right = false;
					}
					update();
					break;
				case 82: // R
					if (selected_node) {
						// toggle node reflexivity
						selected_node.reflexive = !selected_node.reflexive;
					} else if (selected_link) {
						// set link direction to right only
						selected_link.left = false;
						selected_link.right = true;
					}
					update();
					break;
			}
		}

		function keyup() {
			lastKeyDown = -1;

			// ctrl
			if (d3.event.keyCode === 17) {
				circle
					.on('mousedown.drag', null)
					.on('touchstart.drag', null);
				svg.classed('ctrl', false);
			}
		}

		function svgmousedown() {
			// prevent I-bar on drag
			//d3.event.preventDefault();

			// because :active only works in WebKit?
			svg.classed('active', true);

			if (d3.event.ctrlKey || mousedown_node || mousedown_link) return;

			// insert new node at point
			var point = d3.mouse(this),
				node = {
					id: ++counter,
					reflexive: false
				};
			node.x = point[0];
			node.y = point[1];
			nodes.push(node);

			update();
		}

		function svgmousemove() {
			if (!mousedown_node) return;

			// update drag line
			drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' +
				d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

			update();
		}

		function svgmouseup() {
			if (mousedown_node) {
				// hide drag line
				drag_line
					.classed('hidden', true)
					.style('marker-end', '');
			}

			// because :active only works in WebKit?
			svg.classed('active', false);

			// clear mouse event vars
			resetMouseVars();
		}

		function spliceLinksForNode(node) {
			var toSplice = links.filter(function(l) {
				return (l.source === node || l.target === node);
			});
			toSplice.map(function(l) {
				links.splice(links.indexOf(l), 1);
			});
		}


		//Set up the colour scale
		var color = d3.scale.category20();

		//Set up the force layout attributes, linkdistance, strength and charge are responsible for
		//repulsion or attraction between nodes
		var force = d3.layout.force()
			.size([width, height])
			.linkDistance(80)
			.linkStrength(0.3)
			.charge(-200)
			.friction(0.7)
			.gravity(0.001);


		//angular watchers, should use watchgroup or just share one object instead
		scope.$watch('counter', function(newval, oldval) {
			counter = newval;
		});

		scope.$watch('nodes', function(newval, oldval) {
			nodes = newval;
			console.log('nodes changed', nodes);
			root.nodes = nodes;
			if (nodes && links) {
				graphRec = JSON.parse(JSON.stringify(root));
				//update autocomplete options with new nodes
				updateAutoComplete(nodes);
				update();
			}
		});

		scope.$watch('links', function(newval, oldval) {
			links = newval;
			console.log('links changed', links);
			root.links = links;
			if (links && nodes) {
				//used for threshold slider, acts as a copy of our links array
				graphRec = JSON.parse(JSON.stringify(root));
				update();
			}
		});

		//override drag method to include pin/unpin and deregister mouselisteners
		var node_drag = force.drag()
			.on("dragstart", dragstart)
			.on("drag", dragmove)
			.on("dragend", dragend);

		//appends a transparent rectangle as a placeholder for text
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

		//redraw our graph with new data elements
		var update = function() {

			var lineOpacity = 0.5;

			//create our nodes dom containers and bind data to them
			node = svg.selectAll(".node")
				.data(nodes);

			//remove dom elements that are not bound to data
			node.exit().remove();

			var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.on('dblclick', releasenode)
				.on('mousedown', function(d) {
					if (d3.event.ctrlKey) return;

					// select node
					mousedown_node = d;
					if (mousedown_node === selected_node) selected_node = null;
					else selected_node = mousedown_node;


					// reposition drag line
					drag_line
				.style('marker-end', 'url(#arrow)')
						.classed('hidden', false)
						.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

					update();
				})
				.on('mouseup', function(d) {
					if (!mousedown_node) return;

					// needed by FF
					drag_line
						.classed('hidden', true)
						.style('marker-end', '');

					// check for drag-to-self
					mouseup_node = d;
					if (mouseup_node === mousedown_node) {
						resetMouseVars();
						return;
					}

					// add link to graph (update if exists)
					// NB: links are strictly source < target; arrows separately specified by booleans
					var source, target, direction;
					if (mousedown_node.id < mouseup_node.id) {
						source = mousedown_node;
						target = mouseup_node;
						direction = 'right';
					} else {
						source = mouseup_node;
						target = mousedown_node;
						direction = 'left';
					}

					var link;
					link = links.filter(function(l) {
						return (l.source === source && l.target === target);
					})[0];

					if (link) {
						link[direction] = true;
					} else {
						link = {
							source: source,
							target: target,
							left: false,
							right: false
						};
						link[direction] = true;
						links.push(link);
					}

					// select new link
					selected_link = link;
					selected_node = null;
					update();
				});



			//.on('mouseover', mouseover)
			//.on('mouseout', mouseout)
			//.call(node_drag);

			//append a circle to our node dom container
			var circle = nodeEnter.append("circle")
				.attr("r", radius)
				.style('fill', function(d) {
					return (d === selected_node) ? d3.rgb(color(d.group)).brighter().toString() : color(d.group);
				});

			//append text on top of our node container
			var text = nodeEnter.append("text")
				.attr("dy", "-1.3em")
				.style("fill", "gray")
				.text(function(d) {
					setText(this, d.name);
					return d.name;
				});


			//Create our links containers and bind data to them
			link = svg.selectAll(".link")
				.data(links)
				.classed("selected", function(d) {
					return d === selected_link;
				});



			//create a container for relationship labels with the links array bound to them
			linkLabel = svg.selectAll(".text")
				.data(links)
				.classed("selected", function(d) {
					return d === selected_link;
				});


			//remove unused DOM elements to avoid memory leak
			link.exit().remove();
			linkLabel.exit().remove();

			//attach a line to every DOM bound to a datum
			var linkEnter = link.enter().insert("line", ".node")
				.attr("class", "link")
				.classed("selected", function(d) {
					return d === selected_link;
				})
				//giving them id by index to connect relationship names with links
				.attr("id", function(d, i) {
					return i;
				})

			.attr("opacity", lineOpacity)
				.style("marker-end", "url(#arrow)")
				.attr("stroke-width", 2)
				.on('mousedown', function(d) {
					if (d3.event.ctrlKey) return;

					// select link
					mousedown_link = d;
					if (mousedown_link === selected_link) selected_link = null;
					else selected_link = mousedown_link;
					selected_node = null;
					update();
				});

			//attach a g with text to every datum in links 
			var textEnter = linkLabel.enter().insert("g", ".linK")
				.attr("class", "text")
				.classed("selected", function(d) {
					return d === selected_link;
				})
				//give them a tag attribute with link ids
				.attr("tag", function(d, i) {
					return "linkId_" + i;
				});

			//add our text / relationship names to the dom selections
			linkText = textEnter
				.append("text")
				.attr("opacity", 0)
				.text(function(d) {
					return d.name;
				});

			//restarts the graph with the new nodes and links
			force
				.nodes(nodes)
				.links(links)
				.start();

		};


		//called on every tick of the force graph, reposition everything
		force.on("tick", function() {
			/*
						drag_line.attr('d', function(d) {
							var deltaX = d.target.x - d.source.x,
								deltaY = d.target.y - d.source.y,
								dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
								normX = deltaX / dist,
								normY = deltaY / dist,
								sourcePadding = d.left ? 17 : 12,
								targetPadding = d.right ? 17 : 12,
								sourceX = d.source.x + (sourcePadding * normX),
								sourceY = d.source.y + (sourcePadding * normY),
								targetX = d.target.x - (targetPadding * normX),
								targetY = d.target.y - (targetPadding * normY);

						console.log(drag_line.attr('d'));
							return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
						});*/

			//x1,y1 is point1 .. x2,y2 is point2, link is the line passing through them
			//reposition that such that it doesn't go out of canvas bounds
			link.attr("x1", function(d) {
					d.source.x = Math.max(radius, Math.min(width - radius, d.source.x));
					return d.source.x;
				})
				.attr("y1", function(d) {
					d.source.y = Math.max(radius, Math.min(height - radius, d.source.y));
					return d.source.y;
				})
				.attr("x2", function(d) {
					d.target.x = Math.max(radius, Math.min(width - radius, d.target.x));
					return d.target.x;
				})
				.attr("y2", function(d) {
					d.target.y = Math.max(radius, Math.min(height - radius, d.target.y));
					return d.target.y;
				});

			//reposition relationship names in the midpoint of the link
			linkText
				.attr("transform", function(d) {
					return "translate(" + (d.source.x + ((d.target.x - d.source.x) / 2)) + "," +
						(d.source.y + ((d.target.y - d.source.y) / 2)) + ")";
				});

			//reposition names according to data and make them stay in our canvas and check for collision
			node
				.attr("transform", function(d) {
					d.x = Math.max(radius, Math.min(width - radius, d.x));
					d.y = Math.max(radius, Math.min(height - radius, d.y));
					return "translate(" + d.x + "," + d.y + ")";
				}).each(collide(0.6));



		});

	}

}]);