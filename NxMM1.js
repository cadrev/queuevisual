// NxMM1 simulation
var mm1Queues = serverIds.map(function () { return []; });
var mm1ServerId = 0;
var mm1Groups = svg.append("g").selectAll("g")
    .data(serverIds)
    .enter()
    .append("g");

function styleMM1Packet(packet) {
  packet
      .attr("cx", function (d, i) { return serverX - i * 2 * (packetRadius + packetPadding); })
      .attr("cy", function (d) { return d.y; });
}

function mm1PacketArrival() {
  var queue = mm1Queues[mm1ServerId];
  var group = mm1Groups.filter(function (d) { return d === mm1ServerId; });
  queue.push({
    id: id++,
    y: mm1y(mm1ServerId),
    enqueueTime: new Date().getTime()
  });

  var packets = group.selectAll("circle.active")
      .data(queue, keyById);

  // move in new packets
  packets.enter().append("circle")
      .each(function (d) { d.circle = this; })
      .classed("active", true)
      .attr("r", packetRadius)
      .attr("cx", -packetRadius)
      .attr("cy", mm1EnterY)
      .attr("fill", "#333333")
    .transition()
      .ease('cubic-out') // fast-in slow-out
      .call(styleMM1Packet);


  // kick the server to start working if it was previously idle
  if (queue.length === 1) {
    queue[0].serveTime = queue[0].enqueueTime;
    schedulePoisson(mm1PacketService(queue, group), 1 / averageServiceTimeInSeconds());
  }

  // schedule next packet
  mm1ServerId = (mm1ServerId + 1) % numServers;
}

function mm1PacketService(queue, group) {
  return function result() {
    queue.shift();
    if (queue[0]) {
      queue[0].serveTime = Math.max(queue[0].enqueueTime + 250, new Date().getTime());
    }
    var packets = group.selectAll("circle.active")
        .data(queue, keyById);

    // update existing packets
    packets
      .transition()
        .delay(atTheEarliest(250, 'enqueueTime'))
        .call(styleMM1Packet);

    // move out old (serviced) packets
    packets.exit()
        .classed("active", false)
        .call(displayResult);

    if (queue.length > 0) {
      schedulePoisson(result, 1 / averageServiceTimeInSeconds());
    }
  };
}

// start the simulations
schedulePoisson(mm1PacketArrival, arrivalRatePerSecond());