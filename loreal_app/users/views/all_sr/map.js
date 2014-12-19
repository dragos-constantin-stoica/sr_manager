function(doc) {
	if (doc.doc_type == "user") {
		if(doc.roles_sr && doc.active){
			emit([doc.username], 
				{
					"username":doc.username
				}
			);
		}
	} 
}