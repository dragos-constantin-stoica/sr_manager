function(doc) {
	if (doc.doctype == "event") {
		emit([doc.channel, doc.client, doc.outlet, doc.username, doc.start_date, doc.end_date], 
			doc
		);
	} 
}