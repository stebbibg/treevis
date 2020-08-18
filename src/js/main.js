// Global array containing all the data, initialized with the root
const boxwidth = 20;
const boxheight = 20;
const boxOffsetx = boxwidth/2;
const boxOffsety = boxheight/2;

let nodeCounter = 1;
let dataArray = [
    {
        id: 0,
        children: [],
        parent: null,
        layer: 0,
        x: 400,
        siblingNo: 0,
        y: 20
    }
]

function resetSVG(){

    dataArray = [
        {
            id: 0,
            children: [],
            parent: null,
            layer: 0,
            x: 400,
            siblingNo: 0,
            y: 20
        }
    ]

    let mainsvg = d3.select("#mainsvg");

    /*
    var zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', function() {
          g.selectAll('path')
           .attr('transform', d3.event.transform);
    });

    mainsvg.call(zoom);
    */

    let g = mainsvg.append("g")
        .attr("id","id0");

    // Calculate the tree
    let tree = new TreeAlgorithm(dataArray);

    for (let i = 0; i < dataArray.length; i++){
        g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill', 'rgba(0,0,0,0)')
            .attr('stroke', '#2378ae')
            .attr('stroke-width', '3')
            .on("click", function (d,i){
                // Left click
                generateNode(dataArray[i]);
            //    console.log("left click")
            })
            .on("contextmenu", function (d, i) {
                d3.event.preventDefault();
                // right click
                removeNode(dataArray[i])
                console.log("right click")
            });
        g.transition()
            .duration(500)
            .attr("transform", "translate(" + dataArray[i].x +"," + dataArray[i].y + ")")
    }
}

function refreshSVG(){
    let mainsvg = d3.select("#mainsvg");
    // Calculate the tree
    let tree = new TreeAlgorithm(dataArray);
    const positions = tree.positions;
    
    // refresh the nodes
    for (let i = 0; i < positions.length; i++){
        const element = positions[i];
        let d3El = d3.select("#id" + positions[i].id);
        d3El.transition()
            .duration(500)
            .attr("transform", "translate(" + positions[i].x +"," + positions[i].y + ")");
    }

    d3.selectAll("line").remove();
    // Draw the links
    for (let i = 0; i < positions.length; i++){
        if (positions[i].children.length > 0){
            const parent = positions[i];
            const childy = positions[i].children[0].y;  // They all have the same y pos
            // First the horozontal buses
            mainsvg.append("line")
                .attr("x1", parent.children[0].x + boxOffsetx)
                .attr("y1", (parent.y + childy)/2 + boxOffsety)
                .attr("x2", parent.children[parent.children.length - 1].x + boxOffsetx)
                .attr("y2", (parent.y + childy)/2 + boxOffsety)
                .attr("stroke-width", 2)
                .attr("stroke", "black");

            // Now draw the vertical buses
            mainsvg.append("line")
                .attr("x1", parent.x + boxOffsetx)
                .attr("y1", parent.y + boxOffsety + boxheight/2)
                .attr("x2", parent.x + boxOffsetx)
                .attr("y2", (parent.y + childy)/2 + boxOffsety)
                .attr("stroke-width", 2)
                .attr("stroke", "black");
            for (let j = 0; j < positions[i].children.length; j++){
                const childx = positions[i].children[j].x;
                const childy = positions[i].children[j].y;
                mainsvg.append("line")
                    .attr("x1", childx + boxOffsetx)
                    .attr("y1", childy + boxOffsety - boxheight/2)
                    .attr("x2", childx + boxOffsetx)
                    .attr("y2", (parent.y + childy)/2 + boxOffsety)
                    .attr("stroke-width", 2)
                    .attr("stroke", "black");
            }
        }
    }  
}

function generateNode(parent){
    const elementVal = {
        id: nodeCounter++,
        children: [],
        parent: parent,
        layer: parent.layer + 1,
        x: 400,
        siblingNo: parent.children.length,
        y: 20
    }

    dataArray.push(elementVal)
    let mainsvg = d3.select("#mainsvg");
    let g = mainsvg.append("g")
        .attr("id", "id" + (nodeCounter - 1));
        g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", boxwidth)
        .attr("height", boxheight)
        .attr('fill', 'rgba(0,0,0,0)')
        .attr('stroke', '#2378ae')
        .attr('stroke-width', '3')
        .on("click", function (d){
            // Left click
            generateNode(elementVal);
        })
        .on("contextmenu", function (d, i) {
            d3.event.preventDefault();
            // right click
            removeNode(elementVal)
        });

    parent.children.push(dataArray[dataArray.length - 1]);  // Add the newly generated node to the parent
    refreshSVG();
}

function removeNode(node){
    // Recursive function, delete the bottom nodes first
    function deleteNode(n){
        // Call this delete function recursively, in order to delete all the leaves in this branch
        for (let i = 0; i < n.children.length; i++){
            deleteNode(n.children[i]);
        }

        // Remove this leaf, both from the data array and the SVG element
        for(let i = dataArray.length - 1; i >= 0; i--){
            if (n.id === dataArray[i].id){
                // Remove the node from the data array
                dataArray.splice(i,1);
                // Remove the d3 element from the visualization
                d3.select("#id" + n.id).remove();
            }
        }
    }
    deleteNode(node);

    // Remove it as a children object from the parent
    let currentSiblingNo = null;
    for (let i = 0; i < node.parent.children.length; i++){
        if (node.parent.children[i].id === node.id){
            currentSiblingNo = node.parent.children[i].siblingNo;
            node.parent.children.splice(i,1);
            break;
        }
    }

    // Adjust siblingNo (if a sibling was deleted in the middle, make sure there is no gap)
    for (let i = currentSiblingNo; i < node.parent.children.length ; i++){
        node.parent.children[i].siblingNo--;
    }
    refreshSVG();
}

resetSVG();