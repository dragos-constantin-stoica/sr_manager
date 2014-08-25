/**
 * 
 * Worker that processes oauth requests for CouchDB
 * - set _security for loreal_app
 * - create new user
 * - set CouchDB.host
 * 
 * @author Dragos STOICA
 * @date 05.03.2014
 */ 
importScripts('couch_http.js',
	 		  '/_utils/script/oauth.js',
              '/_utils/script/json2.js',
              '/_utils/script/sha1.js',
              'oauth_utils.js');
              
self.onmessage = function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER - start : Yes Master!');
	  //self.postMessage(JSON.parse(CouchDB.request("GET", "/").responseText));
      break;

    case 'setCouchDB_host':
    	self.postMessage('WORKER - setCouchDB_host :' + JSON.stringify(data.msg));
    	CouchDB.host = data.msg;
    	break;

    case 'newUser':
	    self.postMessage('WORKER - newUser got:' + JSON.stringify(data.msg));
		var xhr, responseMessage;
		
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_oauth/authorize",oauth_message, oauth_accessor);	  
		//responseMessage = OAuth.decodeForm(xhr.responseText);
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_session", oauth_message, oauth_accessor);

		CouchDB.user_prefix = "org.couchdb.user:";

		CouchDB.prepareUserDoc = function(user_doc, new_password) {
		  user_doc._id = user_doc._id || CouchDB.user_prefix + user_doc.name;
		  if (new_password) {
		    user_doc.password = new_password;
		  }
		  user_doc.type = "user";
		  if (!user_doc.roles) {
		    user_doc.roles = [];
		  }
		  return user_doc;
		};

		//create user in _users
		var userDoc = CouchDB.prepareUserDoc({name: data.msg.username}, data.msg.password); 
		oauth_message.body = userDoc;
		xhr = oauthRequest("PUT", CouchDB.protocol + CouchDB.host + "/_users/" + userDoc._id, oauth_message, oauth_accessor);
		//var output = usersDb.save(userDoc);
		self.postMessage(OAuth.decodeForm(xhr.responseText));

    	break;  

    case 'setPassword':
		self.postMessage('WORKER - setPassword got:' + JSON.stringify(data.msg));
		var xhr, responseMessage;
		
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_oauth/authorize",oauth_message, oauth_accessor);	  
		//responseMessage = OAuth.decodeForm(xhr.responseText);
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_session", oauth_message, oauth_accessor);

		CouchDB.user_prefix = "org.couchdb.user:";

		CouchDB.prepareUserDoc = function(user_doc, new_password) {
		  user_doc._id = user_doc._id || CouchDB.user_prefix + user_doc.name;
		  if (new_password) {
		    user_doc.password = new_password;
		  }
		  user_doc.type = "user";
		  if (!user_doc.roles) {
		    user_doc.roles = [];
		  }
		  return user_doc;
		};

		//get user document
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_users/org.couchdb.user:" + data.msg.username, oauth_message, oauth_accessor);
		var userDoc = JSON.parse(xhr.response);
		userDoc.password = data.msg.password;
		//update user in _users
		oauth_message.body = userDoc;
		xhr = oauthRequest("PUT", CouchDB.protocol + CouchDB.host + "/_users/" + userDoc._id, oauth_message, oauth_accessor);
		//var output = usersDb.save(userDoc);
		self.postMessage(OAuth.decodeForm(xhr.responseText));
    	break;

    case 'setSecurity':
	    self.postMessage('WORKER - setSecurity got:' + JSON.stringify(data.msg));

		var xhr, responseMessage;

		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_oauth/authorize",oauth_message, oauth_accessor);	  
		//responseMessage = OAuth.decodeForm(xhr.responseText);
		xhr = oauthRequest("GET", CouchDB.protocol + CouchDB.host + "/_session", oauth_message, oauth_accessor);

		oauth_message.body = data.msg;
		xhr = oauthRequest("PUT", CouchDB.protocol + CouchDB.host + "/loreal_app/_security", oauth_message, oauth_accessor);
		
		self.postMessage(OAuth.decodeForm(xhr.responseText));  
    	break;

    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg);
      self.close(); // Terminates the worker.
      break;

    default:
      self.postMessage('WORKER - Unknown command ?!? ' + data.msg);
  };
};
