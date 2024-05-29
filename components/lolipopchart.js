class LoliPopChart {
    margin = {
        top: 10, right: 10, bottom: 50, left: 22.5
    }
    textMargin = {
        x: -65,
        y: 40
    }
    text = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }

    constructor(svg, month, width=175, height=100){
        this.svg = svg;
        this.month = month;
        this.width = width;
        this.height = height;
    }

    initialize(visYaxis=false){
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        if(visYaxis){
            this.yAxis = this.svg.append("g");
        }
        this.monthIndicator = this.svg.append("text")

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        if([1,3,5,7,8,10,12].includes(this.month)){
            this.categories = Array.from({length: 31}, (_, i) => i + 1);
        }
        else if(this.month === 2){
            this.categories = Array.from({length: 28}, (_, i) => i + 1);
            this.textMargin.x = -55;
        }
        else{
            this.categories = Array.from({length: 30}, (_, i) => i + 1);
        }

        this.xScale = d3.scaleBand().domain(this.categories).range([0, this.width]).padding(0.3);
        this.yScale = d3.scaleLinear();
    }

    reset(){
        this.container.selectAll("*")
            .transition()
            .style("opacity", 0)
            .on("end", () => {
                d3.select(this).remove();
            });
        this.xAxis.selectAll("*")
            .transition()
            .style("opacity", 0)
            .on("end", () => {
                d3.select(this).remove();
            });
        if(this.yAxis){
            this.yAxis.selectAll("*")
                .transition()
                .style("opacity", 0)
                .on("end", () => {
                    d3.select(this).remove();
                });
        }
        this.monthIndicator
            .transition()
            .style("opacity", 0)
            .on("end", () => {
                d3.select(this).remove();
            });

        this.container = this.svg.append("g");
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.xAxis = this.svg.append("g");
        if(this.yAxis){
            this.yAxis = this.svg.append("g");
        }
        this.monthIndicator = this.svg.append("text");
    }

    update(data, yVar, yMax){
        const counts = {};

        if(yVar === "numAccident"){
            this.categories.forEach(c => {
                counts[c] = data.filter(d => d["day"] === c && d["month"] === this.month).length;
            })
        }
        else{
            this.categories.forEach(c => {
                counts[c] = d3.sum(data.filter(d => d["day"] === c && d["month"] === this.month).map(d => d[yVar]));
            })
        }

        this.yScale.domain([0, yMax]).range([this.height, 0]);

        this.container.selectAll("line")
            .data(this.categories)
            .join("line")
            .transition()
            .attr("x1", d => this.xScale(d) + this.xScale.bandwidth() / 2)
            .attr("x2", d => this.xScale(d) + this.xScale.bandwidth() / 2)
            .attr("y1", this.height)
            .attr("y2", d => this.yScale(counts[d]))
            .attr("stroke", "black")
            .attr("stroke-wdith", 2.0);

        this.container.selectAll("circle")
            .data(this.categories)
            .join("circle")
            .transition()
            .attr("cx", d => this.xScale(d) + this.xScale.bandwidth() / 2)
            .attr("cy", d => this.yScale(counts[d]))
            .attr("r", 2)
            .attr("fill", "black");

        this.monthIndicator
            .transition()
            .attr("x", this.width + this.textMargin.x)
            .attr("y", this.height + this.textMargin.y)
            .text(this.text[this.month])
            .style("font-size", "10px")
            .style("text-anchor", "end")
            .style("font-weight", "bold");

        this.xAxis
            .transition()
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale)
                .tickValues([1, 15, Math.max(...this.categories)])
            );

        if(this.yAxis){
            this.yAxis
                .transition()
                .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
                .call(d3.axisLeft(this.yScale))
                .selectAll("text")
                .style("font-size", "6px")
                .style("text-anchor", "end");
        }
    }
}