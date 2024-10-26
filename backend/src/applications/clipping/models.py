from datetime import datetime
from . import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    files = db.relationship('File', backref='owner', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'


class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bucket_name = db.Column(db.String(100), nullable=False)
    object_key = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    tag = db.Column(db.String(50), nullable=True)
    created_datetime = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated_datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    user = db.Column(db.String(80), db.ForeignKey('user.username'), nullable=True)  # Add the `user` column

    def __repr__(self):
        return f'<File {self.object_key}>'
