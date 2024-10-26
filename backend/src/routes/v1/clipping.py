from flask import Blueprint, jsonify, current_app, request
import json

clipping_bp = Blueprint('clipping', __name__)


@clipping_bp.route('/gallery')
def fetch_gallery():
    return jsonify(["image_1", "image_2"])


@clipping_bp.route('/clipping', methods=['GET'])
def list_clipping():
    clippings = ['clipping_1', 'clipping_2', 'clipping_3']
    """
    List all clippings.
    """
    return jsonify(clippings), 200


@clipping_bp.route('/clipping', methods=['POST'])
def post_clipping():
    """
    Add a new clipping.
    """
    try:
        clipping_data = request.json  # Get JSON data from the request
        if not clipping_data:
            return jsonify({"error": "Invalid input"}), 400

        print('clipping_data: ', clipping_data)

        return jsonify({"message": "Clipping added", "data": clipping_data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clipping_bp.route('/clipping/test', methods=['GET'])
def test():
    return json.dumps(current_app.config.get('services', {}))
