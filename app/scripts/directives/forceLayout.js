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

					// mouse event vars
					var selected_node = null,
						selected_link = null,
						mousedown_link = null,
						mousedown_node = null,
						mouseup_node = null;



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
						link.attr("opacity", 0.2);
						node.attr("opacity", 0.2);
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


					scope.goCrazy = function() {
						setInterval(function() {
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

					var node_drag = d3.behavior.drag()
						//.on("dragstart", dragstart)
						//.on("drag", dragmove)
						//.on("dragend", dragend);

					function dragstart(d, i) {

						node.on("mouseover", null).on("mouseout", null);
						force.stop(); // stops the force auto positioning before you start dragging
					}

					function dragmove(d, i) {
						d.px += d3.event.dx;
						d.py += d3.event.dy;
						d.x += d3.event.dx;
						d.y += d3.event.dy;
						force.resume();
					}

					function dragend(d, i) {
						node.on("mouseover", mouseover).on("mouseout", mouseout);
						d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
						force.resume();
					}

					function releasenode(d) {
						d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
						force.resume();
					}


					//Constants for the SVG
					var el = element[0];
					var width = attr.width,
						height = attr.height;

					//Append a SVG to the directive's element of the html page. Assign this SVG as an object to svg
					var svg = d3.select(el).append("svg")
						.style("width", "100%")
						.attr("height", height)
						.attr("pointer-events", "all");


					var vis = svg
						.call(d3.behavior.zoom().on("zoom", rescale))
						.on("dblclick.zoom", null)
						 .append('svg:g')
						.on("mousemove", mousemove)
						.on("mousedown", mousedown)
						.on("mouseup", mouseup);

					// line displayed when dragging new nodes
					var drag_line = vis.append("line")
						.attr("class", "drag_line")
						.attr("x1", 0)
						.attr("y1", 0)
						.attr("x2", 0)
						.attr("y2", 0);

					//Set up the colour scale
					var color = d3.scale.category20();

					//Set up the force layout
					var force = d3.layout.force()
						.charge(-120)
						.linkDistance(80)
						.size([width, height]);


					// add keyboard callback
					d3.select(window)
						.on("keydown", keydown);


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

					function rescale() {
						trans = d3.event.translate;
						scale = d3.event.scale;

						vis.attr("transform",
							"translate(" + trans + ")" + " scale(" + scale + ")");
					}

					function mousemove() {
						if (!mousedown_node) return;

						// update drag line
						drag_line
							.attr("x1", mousedown_node.x)
							.attr("y1", mousedown_node.y)
							.attr("x2", d3.svg.mouse(this)[0])
							.attr("y2", d3.svg.mouse(this)[1]);

					}

					function mousedown() {
						if (!mousedown_node && !mousedown_link) {
							// allow panning if nothing is selected
							vis.call(d3.behavior.zoom().on("zoom"), rescale);
							return;
						}
					}


					function mouseup() {
						if (mousedown_node) {
							// hide drag line
							drag_line
								.attr("class", "drag_line_hidden");

							if (!mouseup_node) {
								// add node
								var point = d3.mouse(this),
									node = {
										x: point[0],
										y: point[1]
									},
									n = nodes.push(node);

								// select new node
								selected_node = node;
								selected_link = null;

								// add link to mousedown node
								links.push({
									source: mousedown_node,
									target: node
								});
							}

							update();
						}
						// clear mouse event vars
						resetMouseVars();
					}


					function resetMouseVars() {
						mousedown_node = null;
						mouseup_node = null;
						mousedown_link = null;
					}

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


					/*
							// Browser onresize event
							window.onresize = function() {
								scope.$apply();
							};


							scope.$watch(function() {
								return el.innerWidth;
							}, function() {
								update();
							});*/


					var update = function() {




						var markers = vis.selectAll("marker")
							.data(["arrow"]);

						markers.exit().remove();

						markers.enter().append("marker")
							.attr("id", function(d) {
								return d;
							})
							.attr("viewBox", "0 -5 10 10")
							.attr("refX", 22)
							.attr("refY", 0)
							.attr("markerWidth", 6)
							.attr("markerHeight", 6)
							.attr("orient", "auto")
							.append("path")
							.attr("d", "M0,-5L12,0L0,5 L10,0 L0, -5")
							.style("stroke", "#4679BD")
							.style("opacity", "0.6");



						//Create all the line svgs but without locations yet
						link = vis.selectAll(".link")
							.data(links);


						link.exit().remove();

						link
							.classed("link_selected", function(d) {
								return d === selected_link;
							});

						var linkEnter = link.enter().append("g")
							.attr("class", "link");

						var line = linkEnter.append("line")

						.attr("opacity", 0.4)
							//.attr("class", "link")
							.style("marker-end", "url(#arrow)")
							.attr("stroke-width", 1.5);



						linkText = linkEnter.append("text")

						.attr("opacity", 0)
							.text(function(d) {
								return d.name;
							});



						//Do the same with the circles for the nodes - no 
						node = vis.selectAll(".node")
							.data(nodes);



						var nodeEnter = node.enter().append("g")
							.attr("class", "node")
							.call(force.drag)
							//.on('dblclick', releasenode)
							//.on('mouseover', mouseover)
							//.on('mouseout', mouseout)
							.call(node_drag); //Added


						var circle =
							nodeEnter.append("circle")
							.attr("r", 12)
							.style("fill", function(d) {
								return color(d.group);
							});
							/*	.on("mousedown",
								function(d) {
									// disable zoom
									vis.call(d3.behavior.zoom().on("zoom"), null);

									mousedown_node = d;
									if (mousedown_node == selected_node) selected_node = null;
									else selected_node = mousedown_node;
									selected_link = null;

									// reposition drag line
									drag_line
										.attr("class", "link")
										.attr("x1", mousedown_node.x)
										.attr("y1", mousedown_node.y)
										.attr("x2", mousedown_node.x)
										.attr("y2", mousedown_node.y);

									update();
								})
							.on("mousedrag",
								function(d) {
									// redraw();
								})
							.on("mouseup",
								function(d) {
									if (mousedown_node) {
										mouseup_node = d;
										if (mouseup_node == mousedown_node) {
											resetMouseVars();
											return;
										}

										// add link
										var link = {
											source: mousedown_node,
											target: mouseup_node
										};
										links.push(link);

										// select new link
										selected_link = link;
										selected_node = null;

										// enable zoom
										vis.call(d3.behavior.zoom().on("zoom"), rescale);
										redraw();
									}
								})
							.transition()
							.duration(750)
							.ease("elastic")
							.attr("r", 6.5);*/


						node.exit().remove();

						node
							.classed("node_selected", function(d) {
								return d === selected_node;
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


						if (d3.event) {
							// prevent browser's default behavior
							d3.event.preventDefault();
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
						force.nodes(nodes)
							.links(links)
							.linkDistance(110)
							.linkStrength(1)
							.charge(-100)
							.friction(0.7)
							.gravity(0.001)
							.start();

					};
}
	function spliceLinksForNode(node) {
						toSplice = links.filter(
							function(l) {
								return (l.source === node) || (l.target === node);
							});
						toSplice.map(
							function(l) {
								links.splice(links.indexOf(l), 1);
							});
					}

					function keydown() {
						if (!selected_node && !selected_link) return;
						switch (d3.event.keyCode) {
							case 8: // backspace
							case 46:
								{ // delete
									if (selected_node) {
										nodes.splice(nodes.indexOf(selected_node), 1);
										spliceLinksForNode(selected_node);
									} else if (selected_link) {
										links.splice(links.indexOf(selected_link), 1);
									}
									selected_link = null;
									selected_node = null;
									redraw();
									break;
								}
							}

						}


					}]);