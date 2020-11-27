from flask import Blueprint, render_template

users = Blueprint('users', __name__)

@users.route('/test')
def test():
    return render_template('account.html')