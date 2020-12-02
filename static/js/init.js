// const socket = io.connect('http://eddi.live');
// const socket = io.connect('http://127.0.0.1:5000');
const socket = io.connect('http://webtech-47.napier.ac.uk:5000');

socket.on('connect', function () {
    socket.emit('user_connect', {
        data: 'User Connected'
    });
    console.log("[Client] Connected");
    if (sessionStorage.getItem('room') == null || sessionStorage.getItem('room') == undefined) {
        console.log("[Client] No Room Selected Joining Default");
        changeRoom('default');
    } else {
        console.log("[Client] Joining " + sessionStorage.getItem('room'));
        changeRoom(sessionStorage.getItem('room'));
    }
});

socket.on('debug_reply', function (e) {
    console.log("[Debug Reply]");
    console.table(e)
});



// socket.on('disconnecting', () => {
//     const rooms = Object.keys(socket.rooms);
//     socket.to(rooms[0]).emit('user_leave', { data: 'User Leaving' });
//     // the rooms array contains at least the socket ID
// });

// if (sessionStorage.getItem('UID') == (null || undefined)) {
//     sessionStorage.setItem('UID', Math.random() * 10000000000000000);
//     console.log("[E] UID Created");

function setUID(uid) {
    sessionStorage.setItem('UID', uid);
}

function joinRoom(roomID) {
    let UID = sessionStorage.getItem('UID');
    let data = {
        'room': roomID,
        'UID': UID
    }
    socket.emit('room', JSON.stringify(data));
    sessionStorage.setItem('room', roomID)
}

async function changeRoom(roomID) {
    let UID = sessionStorage.getItem('UID');
    let data = {
        'room': roomID,
        'UID': UID
    }
    if (sessionStorage.getItem('room') == (null || undefined)) {
        try {
            socket.emit('room', JSON.stringify(data));
            console.log('Success: Changed Rooms to ' + roomID);
            sessionStorage.setItem('room', roomID)
        } catch (e) {
            console.log('Failed: Changed Rooms | Reason:' + e);
        }
    } else {
        try {
            requestLeave(sessionStorage.getItem('room')).then((msg) => {
                console.log('[Client] Success: Left Room ' + sessionStorage.getItem('room'));
                socket.emit('room', JSON.stringify(data));
                console.log('[Client] Success: Changed Rooms to ' + roomID);
                sessionStorage.setItem('room', roomID)
                document.querySelector('#room-input').value = sessionStorage.getItem('room');

            });
        } catch (e) {
            console.log('Failed: Leave Room | Reason:' + e);
        }


    }

}

function requestLeave(roomID) {
    return new Promise((resolve) => {
        console.warn('Promise Started | Room ID:' + roomID);
        socket.emit('room_leave', JSON.stringify({ 'UID': sessionStorage.getItem('UID'), 'room': roomID }));
        socket.on('room_leave_responce', (res) => {
            console.warn('Promise Done');
            resolve(res);
        });
    });
}

async function leaveRoom(roomID) {
    const reply = await requestLeave(docID);
    left = new Promise((resolve, reject) => {
        if (reply) {
            resolve('Room Left: ' + reply);
        } else {
            reject('Leave Failed: ' + reply);
        }
    });
    left.then((msg) => {
        console.log('[Client] ' + msg);
        // console.table(data);
    }).catch((msg) => {
        console.warn('[Client] ' + msg);
    });
    return;
}

function changeEditor(roomID) {
    changeRoom(roomID);
    socket.emit('user_join', roomID)
}

function testEmit(roomID, text) {
    console.log(roomID + " " + text);
    let data = [roomID, text];
    socket.emit('debug', JSON.stringify(data));
}
function testSocket(socket_in, testdata, room) {
    console.log(socket_in + " " + testdata + " " + room);
    let data = {
        'room': room,
        'testdata': testdata,
        'socket': socket_in
    };
    socket.emit('testSocket', JSON.stringify(data));
}

// socket.on('user_connect_reply', function (msg) {
//     console.log(msg);
// });

// socket.on('message', function (msg) {
//     li_ele = document.createElement("li");
//     text_ele = document.createTextNode(msg);
//     li_ele.appendChild(text_ele)
//     document.querySelector('#messages').appendChild(li_ele);
//     console.log("Recieved Message");
// });
// if (document.querySelector('#sendButton') != (null || undefined)) {
//     document.querySelector('#sendButton').addEventListener('click', function () {
//         socket.send(document.querySelector('#myMessage').value);
//         document.querySelector('#myMessage').value = " ";
//         console.log("Clicked!")
//     });
// }