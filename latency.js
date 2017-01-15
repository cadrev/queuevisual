// handle displaying of latencies
var results = [];
var resultsAxis = d3.svg.axis().orient("right").scale(resultsY);

var axis = svg.append("g")
    .attr("transform", "translate(" + [w - 20, 0] + ")")
  .append("g")
    .attr("class", "axis")
    .call(resultsAxis);

axis.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 9)
    .text("Latency (s)");

var mm1avgline = axis.append("line")
    .attr("class", "avg")
    .attr("y1", -100).attr("y2", -100)
    .attr("x1", -20).attr("x2", 0)
    .style("stroke", "#33333");

var mmNavgline = axis.append("line")
    .attr("class", "avg")
    .attr("y1", -100).attr("y2", -100)
    .attr("x1", -20).attr("x2", 0)
    .style("stroke", "#ffc107");

function latency(d) {
  return d.latency;
}

function displayResult(circle) {
  var lastMax = d3.max(results, latency);
  var datum = circle.datum();
  datum.latencyMS = new Date().getTime() - datum.enqueueTime;
  datum.latency = datum.latencyMS / 1000;
  results.unshift(datum);
  if (results.length > displayNumResults) { results.splice(displayNumResults, 1); }
  var newMax = d3.max(results, latency);
  var mmNs = results.filter(function (d) { return typeof d.server === "number"; });
  var mm1s = results.filter(function (d) { return typeof d.server !== "number"; });
  var mm1avg = d3.mean(mm1s, latency);
  var mmNavg = d3.mean(mmNs, latency);
  if (mm1avg) {
    mm1avgline.transition()
        .attr("y1", resultsY(mm1avg))
        .attr("y2", resultsY(mm1avg));
  }
  if (mmNavg) {
    mmNavgline.transition()
        .attr("y1", resultsY(mmNavg))
        .attr("y2", resultsY(mmNavg));
  }

  circle.classed("result", true);

  var circles = svg.selectAll("circle.result")
      .data(results, keyById);

  var toTransition = circle;

  if (newMax !== lastMax) {
    resultsY.domain([0, roundToPower(d3.max(results, latency), 1.618)]);
    axis.transition().call(resultsAxis);
    toTransition = circles; // on rescale, transition ALL circles, not just one
  }

  toTransition.transition()
      .delay(atTheEarliest(250, 'serveTime'))
      .style("fill-opacity", function (d, i) { return resultOpacityScale(i); })
      .attr("cx", function (d) { return w - 30 - (typeof d.server === "number" ? packetRadius * 2 : 0); })
      .attr("cy", function (d) { return resultsY(d.latency); });

  circles.exit().remove();
}