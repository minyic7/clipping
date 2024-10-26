import os
from flask import Flask, jsonify
from omegaconf import OmegaConf
from src.applications.clipping import db


def create_app():
    app = Flask(__name__)

    # create a homepage for testing
    @app.route('/')
    def home():
        return jsonify(message="Welcome to the Clipping Backend"), 200

    # Load YAML Configuration using OmegaConf
    try:
        app_config = OmegaConf.load("src/app_config.yml")
        app.config.update(OmegaConf.to_container(app_config, resolve=True))
    except Exception as e:
        print(f"Error loading configuration: {e}")

    # Create a directory for the database if it doesn't exist
    basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    db_path = os.path.join(basedir, 'db')
    os.makedirs(db_path, exist_ok=True)

    # Configure the SQLAlchemy part of the app instance
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(db_path, 'app_database.sqlite')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the SQLAlchemy instance with the app
    db.init_app(app)

    # Import the models to ensure they are registered with SQLAlchemy
    with app.app_context():
        from src.applications.clipping import models  # Import models here to register them with SQLAlchemy
        db.create_all()

    # Import and register your blueprints
    from src.routes.v1.clipping import clipping_bp
    app.register_blueprint(clipping_bp, url_prefix='/api/v1')

    return app