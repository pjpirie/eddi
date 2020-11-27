from flask import Flask, render_template, url_for, request, redirect, session, Blueprint
from flask_sqlalchemy import SQLAlchemy

user_db = SQLAlchemy()

class User(user_db.Model):
    id = user_db.Column(user_db.Integer, primary_key=True)
    username = user_db.Column(user_db.String(200), nullable=False, unique=True)
    email = user_db.Column(user_db.String(200), nullable=False, unique=True)
    password = user_db.Column(user_db.String(200), nullable=False)

    def __repr__(self):
        return 'ID: %r' % self.id