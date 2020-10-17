if(sessionStorage.getItem('UID') == (null || undefined)){
    console.log("[SE] UID Error");
}else{
    console.log("[SE] UID Assigned >" + sessionStorage.getItem('UID'));
}

let UID = sessionStorage.getItem('UID');
var editor = ace.edit("editor");
let last_change = null;
let applyingChanges = false;

    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");

    editor.session.getDocument().on('change', function (delta) {
        UID = parseInt(sessionStorage.getItem('UID'));
        let data = {
            'ClientID' : UID,
            'delta' : delta
        }
        console.warn("[CE] Change")
        if(!applyingChanges){
            console.warn("[CE] Update")
            socket.emit('editor_change', data);
        }
    });

    socket.on('ec_update', function (data) {
            console.warn("[EC] Update")
            UID = sessionStorage.getItem('UID');
            if (data.ClientID == UID) {
                console.log("[IO] Was me");
                wasMe = true;
            }else{
                wasMe = false;
            }
            applyingChanges = true;
            if(!wasMe){
                editor.getSession().getDocument().applyDeltas([data.delta]);
            }
            applyingChanges = false;
        
            // // console.log("[IO] Update");
            // // console.table(data.delta)

        // var customPosition = {
        //     row: data.delta.start.row,
        //     column: data.delta.start.column
        // };
        
        // var text = data.delta.lines[0];
        
        // if(!repeatCheck(customPosition, text, data.delta.action)){
        //     if(!wasMe){
        //         switch(data.delta.action) {  //what action did this user perform?
        //             case "insert":
        //                 // console.table({customPosition, text});
        //                 editor.session.insert(customPosition, text);
        //                 console.log("Insert");
        //                 break;
        //             case "insertLines":
    
        //                 console.log("Insert Line");
        //                 break;
        //             case "remove":
        //                 editor.session.insert(customPosition , text);
        //                 console.log("Remove");
        //                 break;
        //             case "removeLines":
                        
        //                 console.log("Remove Line");
        //                 break;
        //         }
        //     }
        // }
    });

        // function repeatCheck(position, text, action){
        //     if(sessionStorage.getItem('lastChange') == (null || undefined)){
        //         sessionStorage.setItem('lastChange', JSON.stringify({'pos' : position,'text' : text, 'action' : action}));
        //         console.warn("[RC] Init");
        //         return false;
        //     }else{
        //         let lastChange = JSON.parse(sessionStorage.getItem('lastChange'));
        //         if(
        //             lastChange.pos.column == position.column && 
        //             lastChange.pos.row == position.row && 
        //             lastChange.text == text &&
        //             lastChange.action == action
        //             ){
        //             console.warn("[RC] Repeated");
        //             return true;
        //         }else{
        //             console.warn("[RC] No Repeat");
        //             console.table({
        //                 'Last Change Text' : lastChange.text,
        //                 'Current Change Text' : text,
        //                 '[1]' : '=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=',
        //                 'Last Change Pos Column' : lastChange.pos.column,
        //                 'Current Change Pos Column' : position.column,
        //                 '[2]' : '=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=',
        //                 'Last Change Pos Row' : lastChange.pos.row,
        //                 'Current Change Pos Row' : position.row,
        //                 '[3]' : '=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=',
        //                 'Last Change Action' : lastChange.action,
        //                 'Current Change Action' : action,
        //             })
        //             sessionStorage.setItem('lastChange', JSON.stringify({'pos' : position,'text' : text, 'action': action}));
        //             return false;
        //         }
        //     }
        // }