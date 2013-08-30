function curvy() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = 300,
        height = 300,
        xValue = function(d) { return d[0]; },
        yValue = function(d) { return d[1]; },
        xScale = d3.scale.linear().clamp(true),
        yScale = d3.scale.linear().clamp(true),
        xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickSize(-height + margin.top + margin.bottom, 0),
        yAxis = d3.svg.axis().scale(yScale).orient('left').tickSize(6, 0),
        line = d3.svg.line().x(X).y(Y),
        event = d3.dispatch('line');

    function lr(a, b) {
        return a[0] - b[0];
    }

    function eq(data) {
        return function(x) {
            data = data.sort();
            var place = Math.max(0, d3.bisectLeft(data.map(function(d) { return d[0]; }), x) - 1);
            if (place >= data.length - 1) return data[data.length - 1][1];
            var m = (data[place][1] - data[place + 1][1]) /
                (data[place][0] - data[place + 1][0]);
            return (x - data[place][0]) * m + data[place][1];
        };
    }

    function chart(selection) {
        selection.each(render);
        function render(data) {
            data.sort(lr);

            event.line(eq(data));

            // Update the x-scale.
            xScale
                .domain([0, 1])
                .range([0, width - margin.left - margin.right]);

            // Update the y-scale.
            yScale
                .domain([0, 1])
                .range([height - margin.top - margin.bottom, 0]);

            // Select the svg element, if it exists.
            var svg = d3.select(this).selectAll("svg").data([data]);

            // Otherwise, create the skeletal chart.
            var gEnter = svg.enter().append("svg").append("g");
            gEnter.append("g").attr("class", "x axis");
            gEnter.append("path").attr("class", "line");

            // Update the outer dimensions.
            svg .attr("width", width)
                .attr("height", height);

            // Update the inner dimensions.
            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Update the line path.
            g.select(".line")
                .attr("d", line)
                .on('mouseover', showghost)
                .on('mousemove', moveghost)
                .on('mouseout', hideghost)
                .on('dblclick', ondblclick);

            function showghost() {
                g.append('circle').attr('r', 5).attr('class', 'ghost');
            }

            function moveghost() {
                g.select('circle.ghost').attr('transform', function() {
                    return 'translate(' + d3.mouse(g.node()) + ')';
                });
            }

            function hideghost() {
                g.select('circle.ghost').remove();
            }

            function ondblclick() {
                var rel = d3.mouse(g.node());
                data.push([
                    xScale.invert(rel[0]),
                    yScale.invert(rel[1])
                ]);
                selection.data([data]).call(chart);
            }

            var circles = g.selectAll('circle.pt')
                .data(data, function(d, i) {
                    return i;
                });

            circles.exit().remove();

            circles.enter()
                .append('circle')
                .attr('r', 7)
                .attr('class', 'pt')
                .on('dblclick', ondblclickcircle)
                .call(d3.behavior.drag()
                      .on('drag', function(d, i) {
                          d[0] = xScale.invert(d3.event.x);
                          d[1] = yScale.invert(d3.event.y);
                          selection.data([data]).call(chart);
                      })
                      .on('dragend', function() {
                          data.sort(lr);
                          selection.data([data]).call(chart);
                      }));

            function ondblclickcircle(d) {
                data = data.filter(function(_) {
                    return d !== _;
                });
                selection.data([data]).call(chart);
            }

            circles.attr('transform', function(d) {
                return 'translate(' + [xScale(d[0]), yScale(d[1])] + ')';
            });

            // Update the x-axis.
            g.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                .call(xAxis);
        }
    }

    function X(d) {
        return xScale(d[0]);
    }

    function Y(d) {
        return yScale(d[1]);
    }

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.x = function(_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return chart;
    };

    chart.y = function(_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return chart;
    };

    return d3.rebind(chart, event, 'on');
}
