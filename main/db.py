from flask import Flask, render_template, url_for, request, redirect, session, Blueprint
from flask_sqlalchemy import SQLAlchemy
from app import db
# db = SQLAlchemy()

#### Database ####

# class Todo(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     content = db.Column(db.String(200), nullable=False)
#     completed = db.Column(db.Integer, default=0)
#     date_created = db.Column(db.DateTime, default=datetime.utcnow)

#     def __repr__(self):
#         return '<Task %r>' % self.id

class User(db.Model):
    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String(200), nullable=False, unique=True)
    email = db.Column(db.String(200), nullable=False, unique=True)
    password = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return 'ID: %r' % self.id

class Document(db.Model):
    id = db.Column(db.String, primary_key=True)
    state = db.Column(db.Text, nullable=False)
    owner_Id = db.Column(db.String,db.ForeignKey('user.id'), nullable=False)
    allowed_Ids = db.Column(db.String, nullable=True)

    def __repr__(self):
        return 'ID: %r' % self.id