from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Allow CORS for all routes from localhost:8081
CORS(app, resources={r"/*": {"origins": "http://localhost:8081"}}, supports_credentials=True)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:8081"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"  # Allow credentials if needed
    return response

# Handle preflight (OPTIONS) requests properly
@app.route("/api/test/", methods=["OPTIONS"])
def handle_options():
    response = jsonify({"message": "CORS Preflight OK"})
    return add_cors_headers(response)

@app.route("/api/test/", methods=["GET"])
def test():
    return jsonify({"message": "Hello from Flask backend!"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
