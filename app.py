from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
from sqlalchemy import Column, Text

app = Flask(__name__)
app.config.from_object({
    'SECRET_KEY': 'default_secret_key',
    'SQLALCHEMY_DATABASE_URI': 'sqlite:///example.db'
})

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)

class FormTemplate(db.Model):
    __tablename__ = 'form_templates'
    name = db.Column(db.String(120), primary_key=True)
    schema = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {"name": self.name, "schema": json.loads(self.schema)}

# Routes
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json(force=True) or {}
    name = data.get('name')
    email = data.get('email')
    if not name or not email:
        return jsonify({"success": False, "message": "name and email required"}), 400
    user = User.query.get(name)
    if not user:
        user = User(name=name, email=email)
        db.session.add(user)
    else:
        user.email = email
    db.session.commit()
    return jsonify({"success": True, "name": name}), 201

@app.route('/api/users/<name>', methods=['GET'])
def get_user(name):
    user = User.query.get(name)
    if not user:
        return jsonify({"success": False, "message": "not found"}), 404
    return jsonify({"success": True, "user": user.to_dict()})
@app.route('/api/forms', methods=['POST'])
def save_form_template():
    data = request.get_json(force=True) or {}
    name = data.get('name')
    schema = data.get('schema')
    if not name or not schema:
        return jsonify({"success": False, "message": "name and schema required"}), 400
    tpl = FormTemplate.query.get(name)
    if not tpl:
        tpl = FormTemplate(name=name, schema=json.dumps(schema), created_at=datetime.datetime.utcnow().isoformat()+'Z')
        db.session.add(tpl)
    else:
        tpl.schema = json.dumps(schema)
    db.session.commit()
    return jsonify({"success": True, "name": name}), 201

@app.route('/api/forms/<name>', methods=['GET'])
def get_form_template(name):
    tpl = FormTemplate.query.get(name)
    if not tpl:
        return jsonify({"success": False, "message": "not found"}), 404
    return jsonify({"success": True, "template": tpl.to_dict()})