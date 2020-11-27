from flask import Flask, render_template, url_for, request, redirect, session, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from main.db import Document
import json

sockets = Blueprint('sockets', __name__)


socketio = SocketIO()

#### Socket IO ####
@socketio.on('save_document_reply')
def handle_debug(dataPackage):
    converted_obj = json.loads(dataPackage)
    print('Save Document Request[ ' + converted_obj['room'] + ' ]')
    doc = Document.query.filter_by(id=converted_obj['room']).first()
    print('DOC [ ' + doc + ' ]')
    Document.update().values(state=converted_obj['editorState']).where(id=doc.id)
    # db.session.add(new_user)
    # db.session.commit()

@socketio.on('user_join')
def handle_debug(roomID):
    print('User Join Request[ ' + roomID + ' ]')
    socketio.emit('save_document', roomID, room=roomID)

@socketio.on('debug')
def handle_debug(debugPackage):
    converted_obj = json.loads(debugPackage)
    print('DEBUG[ ' + converted_obj[1] + ' ]')
    socketio.emit('debug_reply', {'data': converted_obj[1]}, room=converted_obj[0])

@socketio.on('testSocket')
def handle_debug(debugPackage):
    converted_obj = json.loads(debugPackage)
    print('TEST_SOCKET[ ' + converted_obj['socket'] + ' ]')
    socketio.emit(converted_obj['socket'], converted_obj['testdata'], room=converted_obj['room'])

@socketio.on('room')
def handle_room(dataPackage):
    converted_obj = json.loads(dataPackage)
    print('Room ' + str(converted_obj['room']) + ' Called')
    rows = Document.query.filter_by(id=converted_obj['room']).count()
    print('Rows: ' + str(rows))
    if rows != 0: 
        doc = Document.query.filter_by(id=converted_obj['room']).first()
        print('Doc ID: ' + str(doc.id))
        if doc.id == 'default':
            print('Default Document | Room:' + str(converted_obj['room']) + ' | State: '+ doc.state)
            join_room(converted_obj['room'])
            socketio.emit('load_document', {'data': doc.state}, room=str(converted_obj['room']))
        else:
            if doc.owner_Id == converted_obj['UID']:
                print('Owner Document | Room:' + str(converted_obj['room']) + ' | State: '+ doc.state)
                join_room(converted_obj['room'])
                socketio.emit('load_document', {'data': doc.state}, room=converted_obj['room'])
            else:
                allowed = json.loads(doc.allowed_Ids)
                if str(converted_obj['UID']) in allowed:
                    print('Allowed Document | Room:' + str(converted_obj['room']) + ' | State: '+ doc.state)
                    join_room(converted_obj['room'])
                    socketio.emit('load_document', {'data': doc.state}, room=converted_obj['room'])
                else:
                    socketio.emit('document_access_denied', {'UID': str(converted_obj['UID'])})
    else:
        new_document = Document(id=str(converted_obj['room']), state=str("Hello, World!"),owner_Id=str(converted_obj['UID']), allowed_Ids=str('[]'))
        db.session.add(new_document)
        db.session.commit()
        print('New Document | Room:' + str(converted_obj['room']))
        join_room(converted_obj['room'])
        socketio.emit('load_document', {'data': "// Hello, World! Editor Programmed By Paul Pirie www.paulpirie.com"}, room=converted_obj['room'])
    

    # join_room(roomID)
    # socketio.emit('user_join_room', {'data': 'User Joined Room!'}, room=roomID)

@socketio.on('room_leave')
def handle_leave_room(dataPackage):
    converted_obj = json.loads(dataPackage)
    print('Room ' + converted_obj['room'] + " Left")
    socketio.emit('save_document', { 'UID': converted_obj['UID'], 'room': converted_obj['room']}, room=converted_obj['room'])
    leave_room(converted_obj['room'])

@socketio.on('save_document_reply')
def handle_document_save(dataPackage):
    converted_obj = json.loads(dataPackage)
    rows = Document.query.filter_by(id=converted_obj['room']).count()
    if rows != 0:
        doc = Document.query.filter_by(id=converted_obj['room']).first()
        doc.state = converted_obj['editorState']
        db.session.commit()
        print('Document Saved | Room:' + str(converted_obj['room']) + " | New State: "+ converted_obj['editorState'])

@socketio.on('message')
def handle_message(msg):
    print('Message:' + msg)
    send(msg, broadcast=True)

@socketio.on('user_connect')
def handle_connect(json):
    print('Recieved Something:' + str(json))
    socketio.emit('user_connect_reply', json)

@socketio.on('editor_change')
def handle_editor_change(jsonobj):
    converted_json = json.loads(jsonobj)
    socketio.emit('ec_update', jsonobj, room=converted_json['room'])
    print('E-C: ' + str(converted_json))