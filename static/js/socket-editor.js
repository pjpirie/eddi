if (sessionStorage.getItem('UID') == (null || undefined)) {
    console.log("[SE] UID Error");
} else {
    console.log("[SE] UID Assigned >" + sessionStorage.getItem('UID'));
}

let UID = sessionStorage.getItem('UID');
var editor = ace.edit("editor");
let last_change = null;
let applyingChanges = false;
let loadDocument = false;

editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

socket.on('save_document', (data_in) => {
    let UID = parseInt(sessionStorage.getItem('UID'));
    if (UID == data_in.UID) {
        console.log('Document Saved!')
        let edit_state = editor.session.getValue();
        let data = {
            'editorState': edit_state,
            'room': data_in.room
        }
        socket.emit('save_document_reply', JSON.stringify(data));
    }
});

socket.on('load_document', function (data_in) {
    console.log('Init Load Document');
    loadDocument = true;
    editor.session.setValue(data_in.data);
    loadDocument = false
    console.log('Document Loaded!');
});

editor.session.getDocument().on('change', function (delta) {
    let UID = parseInt(sessionStorage.getItem('UID'));
    let roomID = sessionStorage.getItem('room');
    let data = {
        'ClientID': UID,
        'delta': delta,
        'room': roomID
    }
    console.warn("[CE] Change");
    if (!applyingChanges) {
        console.warn("[CE] Update");
        socket.emit('editor_change', JSON.stringify(data));
    }
});

socket.on('ec_update', function (data_in) {
    let data = JSON.parse(data_in)
    console.warn("[EC] Update");
    console.table(data);
    UID = sessionStorage.getItem('UID');
    if (!loadDocument) {
        if (data.ClientID == UID) {
            console.log("[IO] Was me");
            wasMe = true;
        } else {
            wasMe = false;
        }
    }
    applyingChanges = true;
    if (!wasMe) {
        editor.getSession().getDocument().applyDeltas([data.delta]);
    }
    applyingChanges = false;
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





const runbtn = document.querySelector('#control-run');
const clearbtn = document.querySelector('#control-clear');
const savebtn = document.querySelector('#control-save');

runbtn.addEventListener('click', () => {
    // Get User Code
    const code = editor.getValue();

    try {
        console.log(new Function(code)());
    } catch (err) {
        console.error(err);
    }
});

clearbtn.addEventListener('click', () => {
    editor.setValue('');
});

savebtn.addEventListener('click', () => {
    editor.setValue('');
});
