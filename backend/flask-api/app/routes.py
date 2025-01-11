from flask import Blueprint, jsonify, request
from .services.face_verification import verify_face, authorize_face

main = Blueprint('main', __name__)

@main.route('/authenticate', methods=['POST'])
def authenticate():
    return verify_face(request)

@main.route('/authorize', methods=['POST'])
def authorize():
    return authorize_face(request)
