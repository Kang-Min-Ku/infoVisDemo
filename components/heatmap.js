class LinkedHeatMap{
    margin = {
        top: 10, right: 10, bottom: 20, left: 20
    }
    rectPadding = {
        x: 0.4,
        y: 0.3
    }
    legendMargin = {
        x: 20,
        y: 30
    }
    lineStroke = 3.5
    mouseover = {
        stroke: "orange",
        strokeWidth: 1.5
    }

    constructor(svg, divId, successiveData, numUniqueCountryData, width=1200, height=600){
        this.svg = svg;
        this.divId = divId;
        this.successiveData = successiveData;
        this.numUniqueCountryData = numUniqueCountryData;
        this.width = width;
        this.height = height;
        this.handlers = {};
    }

    initialize(){
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.legend = this.svg.append("g");
        
        this.tooltip = d3.select(this.divId);

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.xScale = d3.scaleBand();
        this.yScale = d3.scaleBand();
        this.zScale = d3.scaleSequential(customInterpolateBlues);
    }

    reset(){
        this.container.selectAll("*").remove();
        this.legend.selectAll("*").remove();
        this.xAxis.selectAll("*").remove();

        this.container = this.svg.append("g");
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.xAxis = this.svg.append("g");
        this.legend = this.svg.append("g");
    }

    update(data, represent, startYear, endYear){
        startYear = Number(startYear);
        endYear = Number(endYear);
        const uniqueCountry = [];
        this.numUniqueCountryData.forEach(d => {
            if(d["year"] >= startYear && d["year"] <= endYear){
                uniqueCountry.push(d["num"]);
            }
        });
        const numRow = Math.max(...uniqueCountry);
        const rows = Array.from({length: numRow}, (_, i) => i);

        const counts = {}; // year: {country: count} structure
        const yIndex1d = {};
        const counts1d = {};
        const line1d = {};
        const years = Array.from({length: endYear - startYear + 1}, (_, i) => i + Number(startYear));

        years.forEach(y => {
            counts[y] = {};
            data.filter(d => d["year"] === y).forEach(d => {
                if(counts[y][d["country"]]){
                    if(represent === "numAccident"){
                        counts[y][d["country"]] += 1;
                        counts1d[`${y}_${d["country"]}`] += 1;
                    }
                    else{
                        counts[y][d["country"]] += d[represent];
                        counts1d[`${y}_${d["country"]}`] += d[represent];
                    }
                }
                else{
                    if(represent === "numAccident"){
                        counts[y][d["country"]] = 1;
                        counts1d[`${y}_${d["country"]}`] = 1;
                    }
                    else{
                        counts[y][d["country"]] = d[represent];
                        counts1d[`${y}_${d["country"]}`] = d[represent];
                    }
                }
            });

            let emptyRow = Array.from({length: numRow}, (_, i) => i);
            let newCountry = [];
            Object.keys(counts[y]).forEach((c) => {
                if(y === startYear){
                    yIndex1d[`${y}_${c}`] = Object.keys(yIndex1d).length;
                }
                else if(yIndex1d[`${y-1}_${c}`] >= 0){
                    yIndex1d[`${y}_${c}`] = yIndex1d[`${y-1}_${c}`];
                    // if counts of both year are nonzero, draw a line
                    if(counts[y-1][c] && counts[y][c]){
                        line1d[`${y-1}_${y}_${c}`] = true;
                    }
                    emptyRow = emptyRow.filter(e => e !== yIndex1d[`${y}_${c}`]);
                }
                else{
                    newCountry.push(c);
                }
            });
            
            newCountry.forEach((c, index) => {
                yIndex1d[`${y}_${c}`] = emptyRow[index];
            });
        })

        //remove zero count countries
        Object.keys(counts1d).forEach(d => {
            if(counts1d[d] === 0){
                delete counts1d[d];
            }
        });
        
        this.xScale.domain(years).range([0, this.width]).padding(this.rectPadding.x);
        this.yScale.domain(rows).range([this.height, 0]).padding(this.rectPadding.y);
        this.zScale.domain([0, d3.max(Object.values(counts1d))]);    

        this.container.selectAll("rect")
            .data(Object.keys(counts1d))
            .join("rect")
            .on("mouseover", (event, d) => {
                const [year, country] = d.split("_");
                this.tooltip.select(".tooltip-inner")
                    .html(`${year} ${country} ${counts1d[d]}`);

                Popper.createPopper(event.target, this.tooltip.node(), {
                    placement: "top",
                    modifiers: [
                        {
                            name: "arrow",
                            options: {
                                element: this.tooltip.select(".tooltip-arrow").node(),
                            },
                        },
                        {
                            name: "offset",
                            options: {
                                offset: [0, 8],
                            },
                        },
                    ],
                });

                this.tooltip.style("display", "block");

                // emphasize all heatmap cells for selected country
                this.container.selectAll("rect")
                    .style("stroke", rect => {
                        const [rectYear, rectCountry] = rect.split("_");
                        return rectCountry === country ? this.mouseover.stroke : "";
                    })
                    .style("stroke-width", rect => {
                        const [rectYear, rectCountry] = rect.split("_");
                        return rectCountry === country ? this.mouseover.strokeWidth : 0;
                    });
            })
            .on("mouseout", () => {
                this.tooltip.style("display", "none");
                this.container.selectAll("rect")
                    .style("stroke", "")
                    .style("stroke-width", 0);
            })
            .transition()
            .attr("class", d=>`${d.split("_")[1]}`) // {year}-{country}
            .attr("x", d => this.xScale(Number(d.split("_")[0])))
            .attr("y", d => this.yScale(yIndex1d[d]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("fill", d => this.zScale(counts1d[d]));

        this.container.selectAll("line")
            .data(Object.keys(line1d))
            .join("line")
            .transition()
            .attr("class", d => `${d.split("_")[2]}`) // {year}-{year}-{country}
            .attr("x1", d => this.xScale(Number(d.split("_")[0])) + this.xScale.bandwidth())
            .attr("x2", d => this.xScale(Number(d.split("_")[1])))
            .attr("y1", d => this.yScale(yIndex1d[`${Number(d.split("_")[0])}_${d.split("_")[2]}`]) + this.yScale.bandwidth() / 2)
            .attr("y2", d => this.yScale(yIndex1d[`${Number(d.split("_")[1])}_${d.split("_")[2]}`]) + this.yScale.bandwidth() / 2)
            .attr("stroke", "black")
            .attr("stroke-width", this.lineStroke);

        this.xAxis
            .transition()
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("x", -2.5)
            .style("text-anchor", "end")
            .style("font-size", "8px");

        this.legend.selectAll("*").remove();
        renderSequentialLegend(this.legend, this.zScale, 25, 400);
        this.legend
            .attr("transform", `translate(${this.width + this.margin.left + this.legendMargin.x}, ${this.height / 2})`)
            .style("display", "inline");
    }

    on(event, handler){
        this.handlers[event] = handler;
    }
}

function customInterpolateBlues(t) {
    return d3.interpolateBlues(t + 0.2);
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