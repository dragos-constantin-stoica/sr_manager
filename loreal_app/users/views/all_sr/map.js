function(doc) {
	if (doc.doctype == "user") {
		if(doc.roles_sr && doc.active){
			emit([doc.username], 
				{
					"username":doc.username
				}
			);
		}
	} 
}