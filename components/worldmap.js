class WorldMap {
    margin = {
        top: 10, right: 100, bottom: 10, left: 10
    }
    legendMargin = {
        x: -80,
        y: 30
    }

    constructor(svg, geoData, width=500, height=150){
        this.svg = svg;
        this.allGeoData = geoData;
        this.width = width;
        this.height = height;

        this.handlers = {};
    }

    initialize(){
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.projection = d3.geoEquirectangular()
            .fitSize([this.width, this.height], this.allGeoData);
        this.geoGenerator = d3.geoPath()
            .projection(this.projection);

        this.xScale = d3.scaleSequential(d3.interpolateViridis);
        this.legend = this.svg.append("g");

        this.brush = d3.brush()
            .extent([[0,0],[this.width, this.height]])
            .on("brush end", (event) => {
                this.geoBrush(event);
            });
    }

    reset(){
        this.container.call(this.brush);
        this.pathes = this.container.selectAll("path")
            .data(this.allGeoData.features)
            .join("path")
            .on("click", (event, d) => {
                if(this.handlers.geoClick){
                    this.handlers.geoClick(d.properties.name);
                }
            })
            .transition()
            .attr("d", this.geoGenerator)
            .attr("fill", "lightgray")
            .attr("stroke", "black")
            .attr("stroke-width", 1.0);

        this.legend
            .transition()
            .style("display", "none");
    }

    update(A2Data, geoData, represent){
        const categories = [...new Set(A2Data.map(d => d["country"]))];
        const counts = {};

        if(represent === "numAccident"){
            categories.forEach(c => {
                counts[c] = A2Data.filter(d => d["country"] === c).length;
            });
        }
        else{
            categories.forEach(c => {
                counts[c] = d3.sum(A2Data.filter(d => d["country"] === c), d => d[represent]);
            });
        }

        this.xScale.domain([0, d3.max(Object.values(counts))]);

        this.pathes = this.container.selectAll("path")
            .data(geoData.features)
            .join("path")
            .on("click", (event, d) => {
                if(this.handlers.geoClick){
                    this.handlers.geoClick(d.properties.name);
                }
            })
            .transition()
            .attr("d", this.geoGenerator)
            .attr("fill", d => {
                const country = d.properties.name;
                return country in counts ? this.xScale(counts[country]) : "lightgray";
            })
            .attr("stroke", "black")
            .attr("stroke-width", 1.0);

        this.container.call(this.brush);
        
        this.legend.selectAll("*").remove()
        renderSequentialLegend(this.legend, this.xScale, 25, 375);
        this.legend
            .attr("transform", `translate(${this.width + this.legendMargin.x}, ${this.legendMargin.y})`)
            .style("display", "inline");
    }

    isBrushed(d, selection){
        let [[x0, y0], [x1, y1]] = selection;
        const [x,y] = this.geoGenerator.centroid(d);
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    geoBrush(event){
        let selection = event.selection;
        // Find brushed countries
        const brushedGeoData = this.allGeoData.features.filter(d => {
            const brushed = this.isBrushed(d, selection);
            return brushed;
        });
        const brushedCountry = brushedGeoData.map(d => d.properties.name);

        // Update brushed and selected countries
        if(this.handlers.geoBrush){
            this.handlers.geoBrush(brushedCountry);
        }
    }

    on(eventType, handler){
        this.handlers[eventType] = handler;
    }
}


function renderSequentialLegend(svg, colorScale, width, height) {
    const numSwatches = 50;
    const swatchHeight = height / numSwatches;

    svg.selectAll("rect")
        .data(d3.range(colorScale.domain()[0], colorScale.domain()[1], (colorScale.domain()[1] - colorScale.domain()[0]) / numSwatches))
        .enter().append("rect")
            .transition()
            .attr("x", 0)
            .attr("y", (d, i) => height - (i + 1) * swatchHeight)
            .attr("width", width)
            .attr("height", swatchHeight)
            .attr("fill", d => colorScale(d));

    const axisScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([height, 0]);

    const axisBottom = d3.axisRight(axisScale)
        .ticks(10)
        .tickSize(6);

    svg.append("g")
        .transition()
        .attr("class", "color-axis")
        .attr("transform", `translate(${width + 5}, 0)`)
        .call(axisBottom);
}


