const socket = io.connect('http://eddi.live');
// const socket = io.connect('http://127.0.0.1:5000');

socket.on('connect', function () {
    socket.emit('user_connect', {
        data: 'User Connected'
    });
    console.log("Connected");
});

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
