var view;
var ctx;
var polygons = {
    convex: {
        color: 'Fuchsia', // choose color here!
        vertices: [
            {x:100, y:300},
            {x:100, y:200},
            {x:200, y:100},
            {x:300, y:100},
            {x:400, y:200},
            {x:400, y:300},
            {x:300, y:400},
            {x:200, y:400}
        ]
    },
    concave: {
        color: 'Lime', // choose color here!
        vertices: [
            {x:200, y:500},
            {x:300, y:100},
            {x:400, y:300},
            {x:500, y:100},
            {x:600, y:500}
        ]
    },
    self_intersect: {
        color: 'Yellow', // choose color here!
        vertices: [

            {x:100, y:250},
            {x:250, y:100},
            {x:450, y:400},
            {x:450, y:200},
            {x:200, y:400}

            // {x:100, y:200},
            // {x:150, y:400},
            // {x:200, y:100},
            // {x:300, y:500},
            // {x:400, y:100},
            // {x:450, y:400},
            // {x:500, y:200}
        ]
    },
    interior_hole: {
        color: 'Cyan', // choose color here!
        vertices: [
            {x:300, y:400},
            {x:300, y:100},
            {x:600, y:500},
            {x:300, y:500},
            {x:600, y:100},
            {x:600, y:400}
        ]
    }
};

// Init(): triggered when web page loads
function Init() {
    var w = 800;
    var h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    SelectNewPolygon();
}

// DrawPolygon(polygon): erases current framebuffer, then draws new polygon
function DrawPolygon(polygon) {
    // Clear framebuffer (i.e. erase previous content)
    ctx.clearRect(0, 0, view.width, view.height);

    // Set line stroke color
    ctx.strokeStyle = polygon.color;

    // Create empty edge table (ET)
    var edge_table = [];
    var i;
    for (i = 0; i < view.height; i++) {
        edge_table.push(new EdgeList());
    }

    // Create empty active list (AL)
    var active_list = new EdgeList();


    // Step 1: populate ET with edges of polygon
    {
        // Asigne the last element as the first prev vertex
        let prev_x = polygon.vertices[polygon.vertices.length-1].x;
        let prev_y = polygon.vertices[polygon.vertices.length-1].y;

        // Loop over vertexes of polygon
        for (let i = 0; i < polygon.vertices.length; i++) {
            // Set current x and y
            let current_x = polygon.vertices[i].x;
            let current_y = polygon.vertices[i].y;

            // Add edge to edge_table
            if (prev_y > current_y){
                edge_table[current_y].InsertEdge(new EdgeEntry(prev_y, current_x, (prev_x-current_x), (prev_y-current_y)));
            }else{
                edge_table[prev_y].InsertEdge(new EdgeEntry(current_y, prev_x, (prev_x-current_x), (prev_y-current_y)));
            }

            // console.log(edge_table)
            //debug
            // DrawLine(prev_x, prev_y, current_x, current_y);

            // Update prev x and y
            prev_x = current_x;
            prev_y = current_y;
        }
    }


    // Step 2: set y to first scan line with an entry in ET
    var first_y = -1;
    for (let i = 0; i < edge_table.length; i++) {
        if (edge_table[i].first_entry != null){
            first_y = i;
            break;
        }
    }

    console.log("Hit first y at: " + first_y);

    // Step 3: Repeat until ET[y] is empty and AL is empty
    //   a) Move all entries at ET[y] into AL
    //   b) Sort AL to maintain ascending x-value order
    //   c) Remove entries from AL whose ymax equals y
    //   d) Draw horizontal line for each span (pairs of entries in the AL)
    //   e) Increment y by 1
    //   f) Update x-values for all remaining entries in the AL (increment by 1/m)

    // e) Increment y by 1
    for (let y = first_y; y < edge_table.length; y++) {

        // a) Move all entries at ET[y] into AL if their are any entrys
        if (edge_table[y].first_entry != null){
            let current_entry = edge_table[y].first_entry;
            while (current_entry != null) {
                active_list.InsertEdge(current_entry);
                console.log("adding current_entry: y_max: " + current_entry.y_max + " x: " + current_entry.x + " inv slp: " + current_entry.inv_slope + " to the list")
                current_entry = current_entry.next_entry;
            }
        }

        // b) Sort AL to maintain ascending x-value order
        if (active_list.first_entry != null){
            active_list.SortList();
        }

        // c) Remove entries from AL whose ymax equals y
        active_list.RemoveCompleteEdges(y);

        // d) Draw horizontal line for each span (pairs of entries in the AL)
        if (active_list.first_entry != null){
            let current_entry = active_list.first_entry;
            while (current_entry != null){
                let next_entry = current_entry.next_entry;
                let x1 = Math.ceil((current_entry.x + current_entry.inv_slope));
                let y1 = y;
                let x2 = next_entry.x + next_entry.inv_slope;
                if ((x2%1) === 0){
                    x2 = x2-1;
                }
                else{
                    x2 = Math.floor(x2)
                }
                let y2 = y;

                console.log("Atempting to draw y= " + y1 + " x1: " + x1 + " to x2: " + x2)

                if (x2 > x1) {
                    DrawLine(x1, y1, x2, y2);
                }
                // f) Update x-values for all remaining entries in the AL (increment by 1/m)
                current_entry.x = current_entry.x + current_entry.inv_slope;
                next_entry.x = next_entry.x + next_entry.inv_slope;
                current_entry = next_entry.next_entry;
            }

        }
    }
}


// SelectNewPolygon(): triggered when new selection in drop down menu is made
function SelectNewPolygon() {
    var polygon_type = document.getElementById('polygon_type');
    DrawPolygon(polygons[polygon_type.value]);
}

function DrawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
