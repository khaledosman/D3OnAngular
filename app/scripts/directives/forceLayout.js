app.directive('forceLayout', function() {

  // isolate scope
  return {
    scope: { 'url': '=', 'onClick': '&' },
    restrict: 'E',
    link: link
  };

  function link(scope, element, attr) {
    var el = element[0];
    var width = el.clientWidth;
    var height = el.clientHeight;
    var root;
    var min = Math.min(width, height);
    var url = attr.url;
    var svg = d3.select(el).append('svg')
      .attr({width: width, height: height});

 d3.json(url, function(error, json) {
  if (error) throw error;

  root = json;
  update();
});

var force = d3.layout.force()
    .linkDistance(80)
    .charge(-120)
    .gravity(0.05)
    .size([width, height])
    .on("tick", tick);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

scope.$watch('url', function(oldval, newval){
  console.log('url changed');
  console.log('new url',newval);
  console.log('old url',oldval);
});

function update() {
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force
    .nodes(nodes)
    .links(links)
    .start();

  // Update links.
  link = link.data(links, function(d) { return d.target.id; });

  link.exit().remove();

  link.enter().insert("line", ".node")
      .attr("class", "link");

  // Update nodes.
  node = node.data(nodes, function(d) { return d.id; });

  function mouseover() {
    if(!this.oldRadius)
    this.oldRadius = d3.select(this).select("circle")[0][0].r.baseVal.value;
    console.log(this.oldRadius);
    d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 30);
    this.currentRadius=30;
}

  function mouseout() {
    d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", this.oldRadius);
}
  node.exit().remove();

  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .call(force.drag);

  nodeEnter.append("circle")
      .attr("r", function(d) { return Math.sqrt(d.size) / 9 || 15; });
     
  nodeEnter.append("text")
      .attr("dy", "-1.3em")
      .style("fill","gray")
      .text(function(d) { setText(this, d.name);
      return d.name; });

  function setText(textElmt,str) {
   textElmt.textContent = str;
   var box = textElmt.getBBox();
   var rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
   //rect.style("fill","red");
   rect.setAttribute('fill','white');
   rect.setAttribute("border", "1px solid #cccccc");

   for (var n in box) { rect.setAttribute(n,box[n]); }
   textElmt.parentNode.insertBefore(rect,textElmt);
}

  node.select("circle")
      .transition()
      .duration(700)
      .style("fill", color);
}

function tick() {
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function color(d) {
  return d._children ? "#3282bd" // collapsed package
      : d.children ? "#b2dbef" // expanded package
      : "#5a834c"; // leaf node
}

// Toggle children on click.
function click(d) {
  if (d3.event.defaultPrevented) return; // ignore drag
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}
  }
});