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

socket.on('document_access_denied', function (e) {
    if (sessionStorage.getItem('UID') == e.UID) {
        alert('[Eddi] Access Denied To document [' + e.room + ']')
        console.log("[Document] Access Denied, Setting Room to Default");
        console.table(e);
        changeRoom('default');
    }
});

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

socket.on('load_new_document', async function (data_in) {
    console.log('[Client] Init Load New Document');
    loadDocument = true;
    editor.session.setValue("//Loading Document")
    editor.session.setValue(data_in.data);
    loadDocument = false
    console.log('[Client] Document New Loaded!');
});
socket.on('load_document', async function (data_in) {
    if (data_in.UID != sessionStorage.getItem('UID')) {
        requestSave(data_in.room, true).then((msg) => {
            console.log('[Client] Init Load Document With Save');
            loadDocument = true;
            editor.session.setValue("//Loading Document")
            editor.session.setValue(data_in.data);
            loadDocument = false
            console.log('[Client] Document Loaded! With Save');
        });
    } else {
        console.log('[Client] Init Load Document');
        loadDocument = true;
        editor.session.setValue("//Loading Document")
        editor.session.setValue(data_in.data);
        loadDocument = false
        console.log('[Client] Document Loaded!');
    }
});

socket.on('error_message', function (err) {
    alert(err);
    console.warn(err);
});


socket.on('change_room_client', function (data) {
    if (sessionStorage.getItem('UID') == data.UID) {
        changeRoom(data.room);
    }
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
    // console.log("[Client] Change From " + UID);
    if (!applyingChanges && !loadDocument) {
        // console.log("[Client] Update From " + UID);
        socket.emit('editor_change', JSON.stringify(data));
    }
});

socket.on('ec_update', function (data_in) {
    let data = JSON.parse(data_in)
    console.warn("[Server>Client] Update From " + data.ClientID);
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

function requestSave(docID, allUser = false) {
    console.log("[Client] Save Requested. Joining: " + allUser);
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
            resolve('Document [' + docID + '] Saved');
        } else {
            reject('Save [' + docID + '] Failed');
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
function changeLanguage(lang) {
    switch (lang) {
        case 'javascript':
            editor.session.setMode("ace/mode/javascript");
            break;
        case 'python':
            editor.session.setMode("ace/mode/python");
            break;
        case 'html':
            editor.session.setMode("ace/mode/html");
            break;
        case 'css':
            editor.session.setMode("ace/mode/css");
            break;
    }
}

function changeTheme(theme) {
    switch (theme) {
        case 'monokai':
            editor.setTheme("ace/theme/monokai");
            break;
        case 'dreamweaver':
            editor.setTheme("ace/theme/dreamweaver");
            break;
        case 'dracula':
            editor.setTheme("ace/theme/dracula");
            break;
        case 'github':
            editor.setTheme("ace/theme/github");
            break;
    }
}


const runbtn = document.querySelector('#control-run');
const clearbtn = document.querySelector('#control-clear');
const savebtn = document.querySelector('#control-save');

runbtn.addEventListener('click', () => {
    // Get User Code
    let language = document.querySelector('#languageSelector').value;
    const code = editor.getValue();

    switch (language) {
        case 'javascript':
            try {
                console.log(new Function(code)());
            } catch (err) {
                console.error(err);
            }
            var iframe = document.createElement('iframe');
            var html = '<html><head></head><body>Open Developer Console For JS</body></html>';
            iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
            document.querySelector('#console-output').innerHTML = "";
            document.querySelector('#console-output').appendChild(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();
            break;
        case 'python':
            editor.session.setMode("ace/mode/python");
            break;
        case 'html':
            var iframe = document.createElement('iframe');
            let htmlIn = editor.session.getValue();
            // var html = '<html><head></head><body>' + htmlIn + '</body></html>';
            var html = htmlIn;
            iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
            document.querySelector('#console-output').innerHTML = "";
            document.querySelector('#console-output').appendChild(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();

            break;
        case 'css':
            var iframe = document.createElement('iframe');
            let cssIn = editor.session.getValue();
            var html = '<html><head><style>' + cssIn + '</style></head><body><div><h1 class="divs" id="div1">Div 1 - ID = "div1"</h1></div></body></html>';
            // var html = htmlIn;
            iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
            document.querySelector('#console-output').innerHTML = "";
            document.querySelector('#console-output').appendChild(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();

            break;
    }




});

clearbtn.addEventListener('click', () => {
    // editor.setValue('');
    socket.emit('clear_document_server', JSON.stringify({ 'UID': sessionStorage.getItem('UID'), 'room': sessionStorage.getItem('room') }));
});

savebtn.addEventListener('click', () => {
    socket.emit('force_save_document_server', sessionStorage.getItem('room'), room = sessionStorage.getItem('room'))
    alert("Document Saved");
});



