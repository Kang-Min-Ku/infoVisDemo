class DataTable{
    constructor(id){
        this.id = id;
    }

    reset(){
        d3.select(this.id).selectAll("*").remove();
    }

    update(data, columns){
        let table = d3.select(this.id);

        let rows = table
            .selectAll("tr")
            .data(data)
            .join("tr");
            
        rows.selectAll("td")
            .data(d => columns.map(c => d[c]))
            .join("td")
            .text(d => d);
    }
}