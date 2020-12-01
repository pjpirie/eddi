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

socket.on('save_document_client', (data_in) => {
    // let UID = sessionStorage.getItem('UID');
    // // if (UID == data_in.UID) {
    // let edit_state = editor.session.getValue();
    // let data = {
    //     'editorState': edit_state,
    //     'room': data_in.room
    // }
    // console.log('[Client] Document Saved!');
    // console.table(data);
    // socket.emit('save_document_server', JSON.stringify(data));
    // // } else {
    // //     console.log('[Client] Document Not Saved!')
    // // }
    saveDocument(data_in.room);
});

socket.on('load_document', async function (data_in) {
    let saved = await requestSave(data_in.room);
    saved.then((msg) => {
        console.log('Init Load Document');
        loadDocument = true;
        editor.session.setValue("//Loading Document")
        editor.session.setValue(data_in.data);
        loadDocument = false
        console.log('[Client] Document Loaded!');
    });
});

socket.on('error_message', function (err) {
    alert(err);
    console.warn(err);
});

socket.on('clear_document_client', function (username) {
    loadDocument = true;
    editor.session.setValue("//Document Cleared by " + username);
    loadDocument = false
    console.log('[Client] Document Cleared!');
});

editor.session.getDocument().on('change', function (delta) {
    let UID = sessionStorage.getItem('UID');
    let roomID = sessionStorage.getItem('room');
    let data = {
        'ClientID': UID,
        'delta': delta,
        'room': roomID
    }
    console.log("[Client] Change");
    if (!applyingChanges && !loadDocument) {
        console.log("[Client] Update");
        socket.emit('editor_change', JSON.stringify(data));
    }
});

socket.on('ec_update', function (data_in) {
    let data = JSON.parse(data_in)
    console.warn("[Server>Client] Update");
    console.table(data);
    UID = sessionStorage.getItem('UID');
    if (!loadDocument) {
        if (data.ClientID == UID) {
            console.log("[IO] Was me");
            wasMe = true;
        } else {
            wasMe = false;
        }
    } else {
        console.log("[IO] Loading Document");
    }
    applyingChanges = true;
    if (!wasMe && !loadDocument) {
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



function requestSave(docID, allUser = false) {
    if (allUser) {
        return new Promise((resolve) => {
            socket.emit('force_save_document_server', docID);
            socket.on('save_document_server_responce', (res) => {
                resolve(res);
            });
        });
    } else {
        let data = {
            'editorState': editor.session.getValue(),
            'room': docID
        }
        return new Promise((resolve) => {
            socket.emit('save_document_server', JSON.stringify(data));
            socket.on('save_document_server_responce', (res) => {
                resolve(res);
            });
        });
    }
}

async function saveDocument(docID) {
    const reply = await requestSave(docID);
    saved = new Promise((resolve, reject) => {
        if (reply) {
            resolve('Document Saved Reply: ' + reply);
        } else {
            reject('Save Failed Reply: ' + reply);
        }
    });
    saved.then((msg) => {
        console.log('[Client] ' + msg);
        // console.table(data);
    }).catch((msg) => {
        console.warn('[Client] ' + msg);
    });
    return;
}



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
    // editor.setValue('');
    socket.emit('clear_document_server', JSON.stringify({ 'UID': sessionStorage.getItem('UID'), 'room': sessionStorage.getItem('room') }));
});

savebtn.addEventListener('click', () => {
    socket.emit('save_document_client', JSON.stringify({ 'room': sessionStorage.getItem('room') }, room = sessionStorage.getItem('room')))
    // alert(sessionStorage.getItem('UID'))
});
