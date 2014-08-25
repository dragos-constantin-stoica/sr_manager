var usersDb = new CouchDB("_users");
var authorization_url = "/_oauth/request_token";
var signatureMethods = "HMAC-SHA1";

//TODO - change consumer and token + secrets
var oauth_message = {
	parameters: {
		oauth_signature_method: signatureMethods,
		oauth_consumer_key: "loreal",
		oauth_token: "badge",
		oauth_version: "1.0"
	}
};
var oauth_accessor = {
	consumerSecret: "romania",
	tokenSecret: "corporatie"
};

function oauthRequest(method, path, message, accessor) {
	message.action = path;
	message.method = method || 'GET';
	OAuth.SignatureMethod.sign(message, accessor);
	var parameters = message.parameters;
	if (method == "POST" || method == "GET") {
		if (method == "GET") {
			return CouchDB.request("GET", OAuth.addToURL(path, parameters));
		} else {
			return CouchDB.request("POST", path, {
				headers: {"Content-Type": "application/x-www-form-urlencoded"},
				body: OAuth.formEncode(parameters)
			});
		}
	} else {
		return CouchDB.request(method, path, {
			headers: {Authorization: OAuth.getAuthorizationHeader('', parameters)},
			body: JSON.stringify(message.body)
		});
	}
}