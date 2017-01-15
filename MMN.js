// MMN simulation (load balancer)
var mmNServers = d3.range(numServers).map(function () { return null; });
var mmNQueue = [];
var mmNGroup = svg.append("g");

function styleMMNPacket(packet) {
  packet
      .attr("cx", function (d, i) { return serverX - (i + 3) * 2 * (packetRadius + packetPadding); })
      .attr("cy", mmNEnterY);
}

function mmNPacketArrival() {
  mmNQueue.push({
    id: id++,
    enqueueTime: new Date().getTime()
  });

  var packets = mmNGroup.selectAll("circle.active")
      .data(mmNQueue, keyById);

  // move in new packets
  packets.enter().append("circle")
      .each(function (d) { d.circle = this; })
      .attr("r", packetRadius)
      .attr("cx", -packetRadius)
      .attr("cy", mmNEnterY)
      .attr("fill", "#ffc107")
      .classed("active", true)
    .transition()
      .ease('cubic-out') // fast-in slow-out
      .call(styleMMNPacket);

  servicePacketsOnIdleServers();
}

function servicePacketsOnIdleServers() {
  var change = false;
  for (var i = 0; mmNQueue.length > 0 && i < numServers; i++) {
    if (!mmNServers[i]) {
      servicePacketOnServer(i);
      change = true;
    }
  }

  if (change) {
    var packets = mmNGroup.selectAll("circle.active")
        .data(mmNQueue, keyById);

    // update existing packets
    packets.transition()
        .delay(atTheEarliest(250, 'enqueueTime'))
        .call(styleMMNPacket);

    // move packets out of the queue and into one of the servers
    packets.exit()
        .classed("active", false)
      .transition()
        .delay(atTheEarliest(250, 'enqueueTime'))
        .attr("cy", function (d) { return mmNy(d.server); })
        .attr("cx", serverX);
  }
}

function servicePacketOnServer(i) {
  var pkt = mmNQueue.shift();
  mmNServers[i] = d3.select(pkt.circle);
  pkt.server = i;
  pkt.serveTime = Math.max(pkt.enqueueTime + 250, new Date().getTime());
  schedulePoisson(finishServicingOnServer(i), 1 / averageServiceTimeInSeconds());
}

function finishServicingOnServer(i) {
  return function () {
    displayResult(mmNServers[i]);
    mmNServers[i] = null;
    servicePacketsOnIdleServers();
  };
}