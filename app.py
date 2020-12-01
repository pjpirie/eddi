# Start Code
# gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker --bind 0.0.0.0:5000 -w 1 app:app

#### Imports ####
from flask import Flask, render_template, url_for, request, redirect, session, Blueprint
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField
from wtforms.validators import InputRequired, Email, Length
from werkzeug.security import generate_password_hash, check_password_hash
from geventwebsocket import WebSocketServer, WebSocketError
import json
import uuid
# from users.routes import users
# from users.db import user_db, User
# from sockets.socket_listeners import sockets, socketio


#### App Init ####
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'false'
db = SQLAlchemy(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

from main.db import User, Document
#### Main Blueprint####
# db.init_app(app) #Inits The db variable in main/db.py

#### Socket IO Blueprint####
# app.register_blueprint(sockets)
# socketio.init_app(app)

#### User Blueprint ####
# app.register_blueprint(users)
# user_db.init_app(app)

#### FlaskForm ####

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired('Username is required'),Length(min=4, max=15)])
    password = PasswordField('Password', validators=[InputRequired('Password is required'),Length(min=8, max=80)])
    remember =  BooleanField('Remember me')
    
class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired('Username is required'),Length(min=4, max=15)])
    email = StringField('Email Address', validators=[Email(message="Invalid Email"),InputRequired('Email is required'),Length(max=100)])
    password = PasswordField('Password', validators=[InputRequired('Password is required'),Length(min=8, max=80)])
    confirm_password = PasswordField('Confirm Password', validators=[InputRequired('Password Confirmation is required'),Length(min=8, max=80)])

#### Socket IO ####
@socketio.on('clear_document_server')
def handle_clear(dataPackage):
    converted_obj = json.loads(dataPackage)
    if isAllowedInDoc(converted_obj['UID'], converted_obj['room']):
        print('Clear Document Request[ ' + converted_obj['room'] + ' ]')
        user = User.query.filter_by(id=converted_obj['UID']).first()
        socketio.emit('clear_document_client', user.username, room=converted_obj['room'])
    else:
        socketio.emit('error_message', "Not Authorised", room=converted_obj['room'])

@socketio.on('save_document_server')
def handle_save_document_server(dataPackage):
    converted_obj = json.loads(dataPackage)
    print('Save Document Request[ ' + converted_obj['room'] + ' ]')
    doc = Document.query.filter_by(id=converted_obj['room']).first()
    print('DOC [ ' + doc.id + ' ]')
    doc.state = converted_obj['editorState']
    db.session.commit()
    socketio.emit('save_document_server_responce', True, room=converted_obj['room'])

@socketio.on('force_save_document_server')
def handle_force_save_document_server(room):
    socketio.emit('save_document_client', {'room': room}, room=room)

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
            socketio.emit('save_document_client', {'room': converted_obj['room']}, room=converted_obj['room'])
            join_room(converted_obj['room'])
            socketio.emit('load_document', {'data': doc.state, 'room': converted_obj['room']}, room=str(converted_obj['room']))
        else:
            if doc.owner_Id == converted_obj['UID']:
                print('Owner Document | Room:' + str(converted_obj['room']) + ' | State: '+ doc.state)
                socketio.emit('save_document_client', {'room': converted_obj['room']}, room=converted_obj['room'])
                join_room(converted_obj['room'])
                socketio.emit('load_document', {'data': doc.state, 'room': converted_obj['room']}, room=converted_obj['room'])
            else:
                allowed = json.loads(doc.allowed_Ids)
                if str(converted_obj['UID']) in allowed:
                    print('Allowed Document | Room:' + str(converted_obj['room']) + ' | State: '+ doc.state)
                    socketio.emit('save_document_client', {'room': converted_obj['room']}, room=converted_obj['room'])
                    join_room(converted_obj['room'])
                    socketio.emit('load_document', {'data': doc.state, 'room': converted_obj['room']}, room=converted_obj['room'])
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
    socketio.emit('save_document_client', { 'UID': converted_obj['UID'], 'room': converted_obj['room']}, room=converted_obj['room'])
    print('Room ' + converted_obj['room'] + " Left")
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



#### Routes ####

@app.route('/')
def editor(room = None):
    if session.get('logged_in') is None:
        session['logged_in'] = False

    if session.get('UID') is not None:
        if room == None: 
            return render_template('editor.html')
        else:
            if isAllowedInDoc(session.get('UID'), room):
                session['room'] = room
                return render_template('editor.html')
            else:
                return render_template('editor.html', error='noperm')
    else:
        form = LoginForm()
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    form = LoginForm()
    session['logged_in'] = False
    session['UID'] = None
    return render_template('login.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if isAuth():
        print(getUser())
        return redirect(url_for('account', uuid=getUser().id))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            if check_password_hash(user.password, form.password.data):
                session['logged_in'] = True
                session['UID'] = user.id
                return redirect(url_for('account', uuid=user.id))
            else:
                return redirect(url_for('login', error='password'))
        else:
            return redirect(url_for('login', error='username'))
    return render_template('login.html', form=form)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if isAuth():
        return redirect(url_for('account', uuid=getUser().id))
    form = RegisterForm()
    if form.validate_on_submit():
        user_uuid = str(uuid.uuid4())
        username_row = User.query.filter_by(username=form.username.data).count()
        uuid_row = User.query.filter_by(id=user_uuid).count()
        if username_row != 0:
            #err username is taken
            return render_template('signup.html', form=form, error='nameTaken')
        if uuid_row != 0:
            user_uuid = str(uuid.uuid4())

        hashed_pwd = generate_password_hash(form.password.data, method='sha256')
        new_user = User(id=user_uuid,username=form.username.data, email=form.email.data, password=hashed_pwd)
        db.session.add(new_user)
        db.session.commit()

        return 'New User Created'
    return render_template('signup.html', form=form)

@app.route('/account')
def account():
    uuid = request.args.get('uuid')
    if session.get('UID') is not None:
        documents = Document.query.filter_by(owner_Id=uuid).all()
        return render_template('account.html', docs=documents)
    else:
        form = LoginForm()
        return redirect(url_for('login'))
    




def isAllowedInDoc(UID, docID):
    doc = Document.query.filter_by(id=docID).first()
    if doc.owner_Id == UID:
        return True
    else:
        allowed = json.loads(doc.allowed_Ids)
        if UID in allowed:
            return True
        else:
            return False

def isAuth():
    return session.get('logged_in')

def getUUID():
    if isAuth():
        return session.get('UID')
    else:
        raise Exception("User not logged in")

def getUser(UID = None):
    if UID == None:
        return User.query.filter_by(id=getUUID()).first()
    else:
        return User.query.filter_by(id=UID).first()


#### Other ####

if __name__ == "__main__":
    server = WebSocketServer(("", 5000), app)
    server.serve_forever()

