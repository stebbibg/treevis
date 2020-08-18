class TreeAlgorithm {
    constructor(hierarchy){
        this.data = hierarchy;
    }

    get positions() {
        return this.calcPositions();
    }

    calcPositions(){
        // Now iterate through the steps of the algorithm

        // Step 1: Sort the tree in postorder
        let tree = this.sortPostOrder();

        // Step 2: Assign a value to all the nodes. The leftmost of siblings node has the value 0. This node is incremented by one for each sibling
        this.initializeValues(tree);
        
        // Step 3: Center the parents over their children
        // This step then checks if there are any siblings to the left of this node. If so, shift the whole branch of that parent node by the offset
        this.centerParents(tree);

        // Step 4 and five are done iteratively, until the tree is fixed
        while(1){
            // Step 4: Check if there is a collision in the tree
            // Step 5: Fix white spaces due to the shifts in collissions

            // First sort the array by the layer:
            tree.sort((a,b) => (a.layer > b.layer) ? 1 : ((b.layer > a.layer) ? -1 : 0)); 
            
            // Step 6: At last, recenter the parents over their children
            
            for (let i = 0; i < tree.length; i++){
                const noChildren = tree[i].children.length;
                if (noChildren > 0){
                    tree[i].x = (tree[i].children[0].x + tree[i].children[noChildren - 1].x)/2;
                }
            }
            
            
            // If there was no collision in the iteration, done!
            if (this.fixCollisions(tree) === false){
                break;
            }
        }

        this.scaleTree(tree);
        return tree;
    }

    scaleTree(tree){
        // Initialize the root in the middle, along with a y offset
        const xscale = 50;
        const center = 400;
        tree[0].x *= xscale;
        const xoffset = center - tree[0].x;
        tree[0].x = center;
        for (let i = 1; i < tree.length; i++){
            tree[i].x *= xscale;
            tree[i].x += xoffset;
        }
    }

    fixCollisions(arr){
        // A flag set to false, since this function is called iteratively until there are no more collisions
        // This function returns foundCollisions, when it is still false, the tree is perfect
        let foundCollision = false; 
        // This function shifts a whole branch
        function shiftBranch(node, value){
            // Shift the current node
            node.x += value;
            // Now shift all the children
            for (let i = 0; i < node.children.length; i++){
                shiftBranch(node.children[i], value);
            }
        }

        // A function to find the contour, this means either the rightmost, or the leftmost value of each layer of the subtree
        function getContour(tree, element, side){
            // Total layers of the tree
            const totalLayers = Math.max.apply(Math, tree.map(function(o) {return o.layer}));

            // Initlialize an object with all the layers below the node, each layer is an array with all the x values of the nodes
            // on that layer, belonging to the subtree
            let allValues = {};

            function findNextValue(el){ 
                // Initialize the object attribute if it is not there
                if (!(el.layer in allValues))
                {
                    allValues[el.layer] = [];
                }

                allValues[el.layer].push({
                    layer: el.layer,
                    pos: el.x
                })
                // In order to insert the whole subtree, recursively call this function with all the children
                for (let i = 0; i < el.children.length; i++){
                    findNextValue(el.children[i]);
                }
            }
            
            findNextValue(element);

            // Now generate the contour, with either the leftmost or the rightmost node of each layer
            // PROBLEM IS THAT AN ELEMENT IN ALLVALUES IS EMPTY!!!!!!!!!!!
            // 
            let contour = [];
            Object.keys(allValues).forEach(function(key, index) {
                if (side == "left") {
                    contour.push(Math.max.apply(Math, allValues[key].map(function(o) { return o.pos})))
                }else if (side == "right"){
                    contour.push(Math.min.apply(Math, allValues[key].map(function(o) { return o.pos})))
                }
            })
            return contour;
        }

        // A function to find the offset of two contours in order for there to not be a collision
        function checkCollision(maxValues, minValues){
            const minOffset = 1;
            let maxOffset = 0;
            if (maxValues.length >= minValues.length){
                for (let i = 0; i < minValues.length; i++){
                    const offset = minValues[i] - maxValues[i] - minOffset;
                    if (offset < 0){
                        maxOffset = -offset;
                    }
                }
            }else{
                for (let i = 0; i < maxValues.length; i++){
                    const offset = minValues[i] - maxValues[i] - minOffset;
                    if (offset < 0){
                        maxOffset = -offset;
                    }
                }
            }
            return maxOffset;
        }
        
        // Split the array into arrays by the layers
        Array.prototype.group = function() {
            return this.reduce(function (r, a, i) {
                if (!i || r[r.length - 1][0]["layer"] !== a["layer"]) {
                    return r.concat([[a]]);
                }
                r[r.length - 1].push(a);
                return r;
            }, []);
        };
        
        let grouped = arr.group();

        // Now grouped is an array of arrays, each Array in groups, is all the elements with a specific layer
        // Now loop through all the elements in the grouped array, to check if their subtrees have collissions, 
        //  compare each nodes subtree, to all the siblings sub trees
        for (let i = 0; i < grouped.length; i++){
            for (let j = 0; j < grouped[i].length; j++){
                for (let k = j + 1; k < grouped[i].length; k++){

                    // Two nodes on the same layer
                    let rightparent = grouped[i][k].parent;  // The parent of the right node
                    let leftparent = grouped[i][j].parent;
                    // Only check siblings
                    if (rightparent !== leftparent){
                        continue;
                    }

                    // Compare all the nodes of the siblings
                    // maxValues and minValues are arrays that contain the max/min value for each layer of that subtree
                    // If these two overlap, that means that there is a collision between these two branches and the right branch needs to be shifted
                    const maxValues = getContour(arr, grouped[i][j], "left");
                    const minValues = getContour(arr, grouped[i][k], "right");

                    // Check if there is an overlap between these two branches
                    const offset = checkCollision(maxValues, minValues);

                    const rightSiblingNo = grouped[i][k].siblingNo;
                    const leftSiblingNo = grouped[i][j].siblingNo;

                    // The interval of the gap that comes from shifting the node
                    const interval = offset/(rightSiblingNo - leftSiblingNo)
                    // If there is a collission, shift the right branch with the offset
                    if (offset > 0){
                        foundCollision = true;
                        shiftBranch(grouped[i][k], offset)

                        // Now shift all the branches to the left so that the branches are still centered under the parent
                        for (let m = 0; m < rightparent.children.length; m++){
                           shiftBranch(rightparent.children[m],-interval);
                        }
                    }

                    // Now fix whitespaces in between nodes.
                    // Check if the two nodes shifted are siblings
                    if (grouped[i][k].siblingNo < rightparent.children.length - 1){
                        // Shift all the branches on the right of the node just shifted
                        for (let m = grouped[i][k].siblingNo + 1; m < rightparent.children.length; m++){
                            shiftBranch(rightparent.children[m], interval);
                        }
                    }

                    // Shift all the nodes and subbranches in between the two shifted nodes
                    for (let m = 0; m < rightparent.children.length; m++){
                        if (rightparent.children[m].siblingNo > leftSiblingNo && rightparent.children[m].siblingNo < rightSiblingNo){
                            shiftBranch(rightparent.children[m], interval);
                        }
                    }
                }
            }
        }
        return foundCollision;
    }

    // The algorithm requires that the tree is sorted in Post Order traversal
    sortPostOrder(){
        // Initialize a new array
        let newArray = [];
        function generatePostOrder(node){
            for (let i = 0; i < node.children.length; i++){
                generatePostOrder(node.children[i]);
            }
            newArray.push(node);
        }
        generatePostOrder(this.data[0]);
        return newArray;
    }

    initializeValues(arr){
        const yscale = 50;
        // Assign a value to all the nodes. The leftmost of siblings node has the value 0. This node is incremented by one for each sibling
        // Assign 0 to the root since it has no siblings, since it is sorted postorder this is the last element of the array
        arr[arr.length - 1].x = 0;
        // Iterate through the whole tree
        for (let i = 0; i < arr.length; i++){
            for (let j = 0; j < arr[i].children.length; j++){
                arr[i].children[j].x = arr[i].children[j].siblingNo;
                arr[i].children[j].y = arr[i].children[j].layer * yscale;
            }
        }
    }

    centerParents(arr){

        // This function shifts a whole branch
        function shiftBranch(node, value){
            // Shift the current node
            node.x += value;
            // Now shift all the children
            for (let i = 0; i < node.children.length; i++){
                shiftBranch(node.children[i], value);
            }
        }

        // Center the parents over their children
        for (let i = 0; i < arr.length; i++){
            const noChildren = arr[i].children.length;
            if (noChildren > 0){
                arr[i].x = (arr[i].children[0].x + arr[i].children[noChildren - 1].x)/2;
            }
            // Now check if the node has any siblings to the left, if so, shift all the nodes to the right
            if (arr[i].siblingNo > 0){
                // find the difference between the node, and the node on the left
                const siblingPos = arr[i].parent.children[arr[i].siblingNo - 1].x;
                const currentPos = arr[i].x;
                const offsetBetweenSiblings = currentPos - siblingPos; 
                const shiftValue = 1 - offsetBetweenSiblings;

                // If this difference is less than one, shift the node and the whole branch by one minus the difference to ensure a minimum space of one
                shiftBranch(arr[i], shiftValue)
            }
        }
    }
}