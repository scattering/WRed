// Author: Joe Redmon
// pipeline.js
/* This mainly deals with animating the pipeline and is not close to being finished,
since I think you're more interested in the other aspects, I'm going to leave out comments
until it is further along...*/
TEXTHEIGHT = 8;
PADDING = 4;
var addImg = new Image();
addImg.src = 'http://famfamfam.com/lab/icons/silk/icons/add.png';
var subImg = new Image();
subImg.src = 'http://famfamfam.com/lab/icons/silk/icons/delete.png'

//*******EXT Stuff***********
Ext.onReady(init);
function init() {
    var myCanvas = new Ext.Element(document.createElement('canvas'));
    myCanvas.set({
        width: 1000,
        height: 1000,
        //style: "width: 500; height: 500;",
        id: 'myCanvas',
    });
    myCanvas.appendTo(document.body);

    loadMask = new Ext.LoadMask(Ext.getBody(), {
        msg: 'Please wait a moment while the page loads...'
    });
    loadMask.show();


    var maxvals = [];
    var minvals = []; /*Handles rendering of ArrayGrid to show range of parameters in data files*/

    function vrange(val, meta, record, rI, cI, store) {
        var range = maxvals[cI] - minvals[cI];
        var spl = val.split(',');
        var low = parseFloat(spl[0]);
        var high = parseFloat(spl[1]);
        var roffset = 0;
        var loffset = 0;
        if (range != 0) {
            loffset = ((low - minvals[cI]) / range) * 100 - 1;
            roffset = ((maxvals[cI] - high) / range) * 100 - 1;
        }
        var ret = high + low;
        return '<div style="border: 1px red solid;"><div style = "border:1px black solid;background-color:black;height:1.5ex;margin-right:' + roffset + '%; margin-left:' + loffset + '%;"></div></div>';
    }
    var dataArray = [];
    var store = new Ext.data.ArrayStore();
    gridColumns = [];
    var msg = function (title, msg) {
        Ext.Msg.show({
            title: title,
            msg: msg,
            minWidth: 200,
            modal: true,
            icon: Ext.Msg.INFO,
            buttons: Ext.Msg.OK
        });
    };

    /*FormPanel to enable file uploads. Sends POST request to server w/ file information*/

    var fp = new Ext.FormPanel({
        fileUpload: true,
        width: 294,
        frame: true,
        title: 'Upload file',
        autoHeight: true,
        bodyStyle: 'padding: 10px 10px 0 10px;',
        labelWidth: 50,
        defaults: {
            anchor: '95%',
            allowBlank: false,
            msgTarget: 'side',
        },
        items: [{
            xtype: 'fileuploadfield',
            id: 'form-file',
            emptyText: 'Select a file...',
            fieldLabel: 'File',
            name: 'file',
            buttonText: 'Browse...',
        }],
        buttons: [{
            text: 'Upload',
            icon: 'http://famfamfam.com/lab/icons/silk/icons/page_white_add.png',
            handler: function () {
                if (fp.getForm().isValid()) {
                    fp.getForm().submit({
                        url: '../forms/upload/',
                        waitMsg: 'Uploading your file...',
                        success: function (fp, o) {}
                    });
                }
            }
        }, '-',
        {
            text: 'Cancel',
            icon: 'http://famfamfam.com/lab/icons/silk/icons/cancel.png',
            handler: function () {
                fp.getForm().reset();
            }
        }]
    });

    var rowRightClicked = 0; //variable to store index of row that is right clicked
    /*GridPanel that displays the data*/
    var grid = new Ext.grid.GridPanel({
        split: true,
        region: 'west',
        collapsible: true,
        width: 300,
        height: 500,
        minSize: 100,
        maxSize: 500,
        tbar: [fp, '-'],
        bbar: [],
        ds: store,
        columns: gridColumns,
        stripeRows: true,
        title: 'Available files',
/*bbar: new Ext.PagingToolbar({
            pageSize: 25,
            store: store,
            displayInfo: true,
            displayMsg: 'Displaying topics {0} - {1} of {2}',
            emptyMsg: "No topics to display",
        })*/

    });
    grid.on('rowdblclick', function (grid, rowIndex, e) {
        window.location = '../' + (store.getAt(rowIndex).get('id'));
    });

    /*Menu that shows up on right click to delete a file from the database*/
    var rowMenu = new Ext.menu.Menu({
        id: 'rowMenu',
        items: [{
            text: 'Delete',
            handler: deleteRow,
            icon: 'http://famfamfam.com/lab/icons/silk/icons/delete.png',
        }],
    }); /*Sends a POST request to server to delete a file*/

    function deleteRow() {

        conn.request({
            url: '../forms/delete/',
            method: 'POST',
            params: {
                'md5': store.getAt(rowRightClicked).get('md5')
            },
            success: function (responseObject) {},
            failure: function () {}
        });
    }
    grid.on('rowcontextmenu', function (grid, rowIndex, e) {
        rowRightClicked = rowIndex;
        rowMenu.showAt(e.getXY());
        e.stopEvent();
    });


/*After data is retrieved from server, we have to reinitiallize the Store reconfigure the ArrayGrid
so that the new data is displayed on the page*/

    function reload_data() {
        var fieldData = dataArray[0]; //First row is the parameters of the data file (e.g. ['X', 'Y', 'Z', 'Temp'])
        maxvals = dataArray[1]; //Second row is the max values of the parameters over all files (used for rendering ranges)
        minvals = dataArray[2]; //Third row is min values of parameters
        dataArray.splice(0, 3); //The rest is the actual data
        var gridColumns = [];
        storeFields = [];
/*The first three parameters (File Name, database ID, and md5 sum) aren't renedered using the
standard renderer and the ID and md5 sum aren't displayed at all, they are only used for server
requests later, so we add them to the Store differently*/
        gridColumns.push({
            header: fieldData[0],
            width: 150,
            sortable: true,
            dataIndex: fieldData[0]
        });
        storeFields.push({
            name: fieldData[0]
        });
        gridColumns.push({
            header: fieldData[1],
            width: 150,
            hidden: true,
            sortable: true,
            dataIndex: fieldData[1]
        });
        storeFields.push({
            name: fieldData[1]
        });
        gridColumns.push({
            header: fieldData[2],
            width: 150,
            hidden: true,
            sortable: true,
            dataIndex: fieldData[2]
        });
        storeFields.push({
            name: fieldData[2]
        });
        for (var i = 3; i < fieldData.length; ++i) {
            gridColumns.push({
                header: fieldData[i],
                width: 100,
                renderer: vrange,
                sortable: true,
                dataIndex: fieldData[i]
            });
            storeFields.push({
                name: fieldData[i]
            });
        }
        store = new Ext.data.Store({
            proxy: new Ext.ux.data.PagingMemoryProxy(dataArray),
            reader: new Ext.data.ArrayReader({}, storeFields),
            remoteSort: true,
        });

        colModel = new Ext.grid.ColumnModel({
            columns: gridColumns
        });
        store.load({
            params: {
                start: 0,
                limit: 10
            }
        });
        grid.getBottomToolbar().removeAll();
        grid.getBottomToolbar().add(new Ext.PagingToolbar({
            store: store,
            pageSize: 10,
            displayInfo: false,
            displayMsg: 'Displaying topics {0} - {1} of {2}',
            emptyMsg: "No topics to display",
        }))
        grid.getBottomToolbar().doLayout();
        grid.reconfigure(store, colModel);

    }
/*Retrieve data in json format via a GET request to the server. This is used
anytime there is new data, and initially to populate the table.*/

    function update() {
        conn.request({
            url: '../all/json/',
            method: 'GET',
            params: {},
            success: function (responseObject) {
                dataArray = Ext.decode(responseObject.responseText); //decodes the response
                reload_data(); //resets the store and grids
                loadMask.hide();
            },
            failure: function () {}
        });
    }
    update();

/*Sets up the stomp connection, subscribes to the 'all' channel, and updates 
whenever any message comes through (whenever files are added, removed, or changed)*/
    stomp = new STOMPClient();
    stomp.onopen = function () {};
    stomp.onclose = function (c) {
        //alert('Lost Connection, Code: ' + c);
    };
    stomp.onerror = function (error) {
        alert("Error: " + error);
    };
    stomp.onerrorframe = function (frame) {
        alert("Error: " + frame.body);
    };
    stomp.onconnectedframe = function () {
        stomp.subscribe("/updates/files/all");
    };
    stomp.onmessageframe = function (frame) {
        update();
    };
    stomp.connect('localhost', 61613);





    var plMenu = new Ext.menu.Menu({
        id: 'plMenu',
        items: [{
            text: 'Connect',
            handler: connector,
            id: 'connect',
            icon: 'http://famfamfam.com/lab/icons/silk/icons/connect.png',
        },
        {
            text: 'Disconnect',
            handler: disconnector,
            id: 'disconnect',
            icon: 'http://famfamfam.com/lab/icons/silk/icons/disconnect.png',
        }],
    });

    function connected() {
        var count = 0;
        for (var i = 0; i < boxes.length && count < 3; ++i) {
            if (boxes[i].selected) {
                if (count === 0) from = boxes[i];
                else if (count == 1) to = boxes[i];
                ++count;
            }
        }
        if (count != 2) {
            return false;
        }
        else {
            var connected = false;
            for (var j = 0; j < from.connected_boxes.length; ++j) {
                if (from.connected_boxes[j] == to) connected = true;
            }
            for (var j = 0; j < to.connected_boxes.length; ++j) {
                if (to.connected_boxes[j] == from) connected = true;
            }
            return connected;
        }
        return false;
    }


    function disconnected() {
        var fcount = true,
            tcount = true;
        var a = null,
            b = null;
        for (var i = 0; i < boxes.length; ++i) {
            if (boxes[i].selected) {
                if (!a) a = boxes[i];
                else if (!b) b = boxes[i];
                else return false;
            }
        }
        if (a.operator() && a.can_add() && b !== null && b.dataset()) {
            from = a;
            to = b
        }
        else if (b !== null && a.dataset() && b.operator() && b.can_add()) {
            from = b;
            to = a
        }
        else {
            return false;
        }
/*for (var i = 0; i < boxes.length && fcount < 2 && tcount < 2; ++i) {
            if (boxes[i].selected) {
                if (fcount && boxes[i].operator() && boxes[i].can_add()) {from = boxes[i]; fcount = false;}
                else if (tcount && boxes[i].dataset()) {to = boxes[i]; tcount = false;}
                else return false;
            }
        }*/
        var connected = false;
        for (var j = 0; j < from.connected_boxes.length; ++j) {
            if (from.connected_boxes[j] == to) connected = true;
        }
        for (var j = 0; j < to.connected_boxes.length; ++j) {
            if (to.connected_boxes[j] == from) connected = true;
        }
        return !connected;
    }

    function disconnector() {
        if (connected()) {
            for (var j = 0; j < from.connected_boxes.length; ++j) {
                if (from.connected_boxes[j] == to) from.connected_boxes.splice(j, 1);
            }
            for (var j = 0; j < to.connected_boxes.length; ++j) {
                if (to.connected_boxes[j] == from) to.connected_boxes.splice(j, 1);
            }
        }
    }

    function connector() {
        if (disconnected() && from.can_add()) {
            if (from.outputs) {
                from.add(to, boxes);
            }
            else {
                from.add(to);
            }
        }
    }
    var canvasContainer = new Ext.BoxComponent({
        el: 'myCanvas',
        id: 'canvasContainer',
    });
    var toolbar = new Ext.Toolbar();
    toolbar.add({
        text: 'Add',
        id: 'plus',
        icon: 'http://famfamfam.com/lab/icons/silk/icons/add.png',
        enableToggle: true,
        toggleGroup: 'toggle',
        toggleHandler: onItemToggle,
        pressed: false,
    }, {
        text: 'Subtract',
        id: 'minus',
        icon: 'http://famfamfam.com/lab/icons/silk/icons/delete.png',
        enableToggle: true,
        toggleGroup: 'toggle',
        toggleHandler: onItemToggle,
        pressed: false,
    }, {
        text: 'File',
        id: 'file',
        icon: 'http://famfamfam.com/lab/icons/silk/icons/page.png',
        enableToggle: true,
        toggleGroup: 'toggle',
        toggleHandler: onItemToggle,
        pressed: false,
    }, {
        text: 'Filter',
        id: 'filter',
        icon: 'http://famfamfam.com/lab/icons/silk/icons/calculator.png',
        enableToggle: true,
        toggleGroup: 'toggle',
        toggleHandler: onItemToggle,
        pressed: false,
    }, {
        text: 'Pointer',
        id: 'pointer',
        icon: 'http://famfamfam.com/lab/icons/silk/icons/cursor.png',
        enableToggle: true,
        toggleGroup: 'toggle',
        toggleHandler: onItemToggle,
        pressed: true,
    });

    var pipelinePanel = new Ext.Panel({
        tbar: toolbar,
        region: 'center',
        title: 'Pipeline',
        //        autoWidth: true,
        autoHeight: true,
        id: 'pipeline',
        //	layout: 'fit',
        items: [canvasContainer],
    });

    function onItemToggle(button, state) {
        if (state) selected = button.id;
    }
    var mousedownc = [];
    var mousemovec = [];
    var selected = 'pointer';
    var selectedFiles;
    var selectedBox = [];
    //******Drawing Stuff*********
    var boxes = [];
    var canvas = Ext.get('myCanvas');
    var ctx = canvas.dom.getContext('2d');
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    function redraw(e) {
        var coords = imgCoords(e);
        ctx.clearRect(0, 0, 1000, 1000);

        for (var i = 0; i < boxes.length; ++i) {
            //boxes[i].draw(ctx);
            for (var j = 0; j < boxes[i].connected_boxes.length; ++j) {
                connect(ctx, boxes[i], boxes[i].connected_boxes[j]);
            }
        }
        for (var i = 0; i < boxes.length; ++i) {
            boxes[i].draw(ctx);
        }
        switch (selected) {
        case 'file':
            var fb = new FileBox(coords[0], coords[1]);
            for (var i = 0; i < selectedFiles.length; ++i) {
                fb.files.push(new TextBox(selectedFiles[i]));
            }
            fb.draw(ctx);

            break;
        case 'plus':
            new PlusBox(coords[0], coords[1], 16, 16).draw(ctx);
            break;
        case 'minus':
            new MinusBox(coords[0], coords[1], 16, 16).draw(ctx);
            break;
        case 'filter':
            new FilterBox(coords[0], coords[1], 'Detailed Balance').draw(ctx);
            break;
        case 'pointer':
            break;
        default:
            alert('default');
            break;
        }
    }

    function moveSelected(e) {
        var coords = imgCoords(e);
        for (var i = 0; i < boxes.length; ++i) {
            if (boxes[i].selected && boxes[i].moveable) {
                boxes[i].x += coords[0] - mousemovec[0];
                boxes[i].y += coords[1] - mousemovec[1];
                boxes[i].update(ctx);
            }
        }
        mousemovec = coords;
    }

    function imgCoords(e) {
        var toReturn = [e.getXY()[0], e.getXY()[1]];
        toReturn[0] -= canvasContainer.getPosition()[0];
        toReturn[1] -= canvasContainer.getPosition()[1];
        return toReturn;
    }
    var from, to;

    function mouseUp(e) {
        canvas.un('mousemove', moveSelected);
        if (e.button === 0) {
            var coords = imgCoords(e);
            switch (selected) {
            case 'plus':
                boxes.push(new PlusBox(coords[0], coords[1], 16, 16));
                break;
            case 'minus':
                boxes.push(new MinusBox(coords[0], coords[1], 16, 16));
                break;
            case 'file':
                var fb = new FileBox(coords[0], coords[1]);
                for (var i = 0; i < selectedFiles.length; ++i) {
                    fb.files.push(new TextBox(selectedFiles[i]));
                }
                boxes.push(fb);
                break;
            case 'filter':
                boxes.push(new FilterBox(coords[0], coords[1], 'Detailed Balance'));
                break;
            case 'pointer':
                if (!e.ctrlKey && coords[0] == mousedownc[0] && coords[1] == mousedownc[1]) {
                    for (var i = 0; i < boxes.length; ++i) {
                        boxes[i].selected = false;
                        if (boxes[i].x - boxes[i].width / 2 <= coords[0] && boxes[i].x + boxes[i].width / 2 >= coords[0] && boxes[i].y - boxes[i].height / 2 <= coords[1] && boxes[i].y + boxes[i].height / 2 >= coords[1]) {
                            boxes[i].selected = true;
                        }
                    }
                }
                break;
            default:
            }
            cstores = [];
            for (var i = 0; i < boxes.length; ++i) {
                if (boxes[i].selected) {
                    boxes[i].chart();
                }
            }
        } else if (e.button == 2 || e.button == 1) {
            if (connected()) {
                plMenu.items.get('connect').disable();
                plMenu.items.get('disconnect').enable();
            } else if (disconnected() && from.can_add()) {
                plMenu.items.get('connect').enable();
                plMenu.items.get('disconnect').disable();
            } else {
                plMenu.items.get('disconnect').disable();
                plMenu.items.get('connect').disable();
            }
            plMenu.showAt(e.getXY());
            e.stopEvent();
        }
        redraw(e);
    }

    function mouseDown(e) {
        if (e.button === 0) {
            var newS = false;
            var noneS = true;
            var coords = imgCoords(e);
            mousedownc = coords;
            mousemovec = coords;
            switch (selected) {
            case 'plus':
                break;
            case 'minus':
                break;
            case 'pointer':
                canvas.on('mousemove', moveSelected);
                for (var i = 0; i < boxes.length; ++i) {
                    if (boxes[i].x - boxes[i].width / 2 <= coords[0] && boxes[i].x + boxes[i].width / 2 >= coords[0] && boxes[i].y - boxes[i].height / 2 <= coords[1] && boxes[i].y + boxes[i].height / 2 >= coords[1]) {
                        if (boxes[i].selected === false) {
                            newS = true;
                            boxes[i].selected = true;
                        }
                        else if (boxes[i].files) {
                            for (var j = 0; j < boxes[i].files.length; ++j) {
                                if (!e.ctrlKey) boxes[i].files[j].deselect();
                                if (boxes[i].files[j].x - boxes[i].files[j].width / 2 <= coords[0] && boxes[i].files[j].x + boxes[i].files[j].width / 2 >= coords[0] && boxes[i].files[j].y - boxes[i].files[j].height / 2 <= coords[1] && boxes[i].files[j].y + boxes[i].files[j].height / 2 >= coords[1]) {
                                    boxes[i].files[j].selected = true;
                                }
                            }
                        }
                        else if (e.ctrlKey) boxes[i].deselect();
                        noneS = false;
                    }
                }
                if (((!e.ctrlKey) && newS) || noneS) {
                    for (var i = 0; i < boxes.length; ++i) {
                        boxes[i].deselect();
                        if (boxes[i].x - boxes[i].width / 2 <= coords[0] && boxes[i].x + boxes[i].width / 2 >= coords[0] && boxes[i].y - boxes[i].height / 2 <= coords[1] && boxes[i].y + boxes[i].height / 2 >= coords[1]) {
                            boxes[i].selected = true;
                        }
                    }
                }
                break;
            default:
            }
        } else if (e.button == 2 || e.button == 1) {
            e.stopEvent();
        }
        redraw(e);
    }

    function rightClick(e) {
        e.stopEvent();
    }

    function keyUp(e) {
        if (e.getKey() == 8 || e.getKey() == 46) {
            for (var i = 0; i < boxes.length; ++i) {
                if (boxes[i].selected) {
                    var temp = boxes[i];
                    boxes.splice(i, 1);
                    for (var j = 0; j < boxes.length; ++j) {
                        for (var k = 0; k < boxes[j].connected_boxes.length; ++k) {
                            if (boxes[j].connected_boxes[k] == temp) {
                                boxes[j].connected_boxes.splice(k, 1);
                                --k;
                            }
                        }
                    }--i;
                }
            }
            redraw(e);
        } else if (e.getKey() == 67) {
            connector();
            e.stopEvent();
        } else if (e.getKey() == 68) {
            disconnector();
            e.stopEvent();
        }
    }

    function mouseOver(e) {
        if (selected == 'file') {
            selectedFiles = grid.getSelectionModel().getSelections();
        }
        canvas.on('mousemove', redraw);
    }
    grid.on('mouseup', function (g, rowIndex, e) {
        selectedFiles = grid.getSelectionModel().getSelections();
        cupdate(selectedFiles);
    });
    canvas.on('contextmenu', rightClick);
    canvas.on({
        'mouseover': mouseOver
    });
    canvas.on({
        'mouseout': function () {
            canvas.un('mousemove', redraw);
        },
    });
    canvas.on({
        'mousedown': mouseDown,
        'mouseup': mouseUp
    });
    documentExt = Ext.get(document);
    documentExt.on('keyup', keyUp);
/*documentExt.on({'mousedown': function(e){if(e.button == 2){e.stopEvent();}},
         'mouseup': function(e){if(e.button == 2) e.stopEvent();}});*/

    /* Holds the flot plot */


    var ChartContainer = new Ext.Container({
        height: 500,
        valueField: 'id',
        displayField: 'name',
        autoWidth: true,

        id: 'ChartContainer',

    });
    ChartContainer.on('afterrender', cupdate);
    var ChartPanel = new Ext.Panel({
        title: 'Chart',
        region: 'east',
        valueField: 'id',
        displayField: 'name',
        split: true,
        collapsible: true,
        width: 500,
        height: 300,
        minSize: 100,
        maxSize: 500,
        id: 'ChartPanel',
        items: [ChartContainer],

    });



    function cupdate(files) {
        ids = [];
        for (var i = 0; i < files.length; ++i) {
            ids.push(files[i].data['id']);
        }
        cstores = [];
        for (var i = 0; i < ids.length; ++i) {
            conn.request({
                url: '../json/' + ids[i] + '/',
                method: 'GET',
                params: {},
                success: function (responseObject) {
                    var json_response = Ext.decode(responseObject.responseText);
                    creloadData(json_response);
                },
                failure: function () {
                    Ext.Msg.alert('Error', 'Failed JSON request');
                }
            });
        }
    }

    /* Same idea as in all_files.js, when new data comes, we must re-initialize our store to update the plot */
    var iv = 'QY'


    var viewport = new Ext.Viewport({
        layout: 'border',
        items: [pipelinePanel, grid, ChartPanel],
    });

}