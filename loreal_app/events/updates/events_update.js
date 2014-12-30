function(doc, req){	
    //req.method will determine the action
    //PUT = Update existing doc
    //POST = Create new doc
    //DELETE = Delete existing doc
    //response may be
    // data : {
    // }
   

    if(req.method == "DELETE"){
    	//doc['_deleted']=true;
    	if(doc['event_pid'] == "" || doc['event_pid'] != "0") doc['rec_type'] = "none";
    	//all documents having event_pid == _id must have rec_trype to "none"
    	if(doc['event_pid'] == "0") doc['rec_type'] = "none";
    	return [doc, JSON.stringify({"action":"deleted"})];
    }

    if(req.method == "PUT"){
    	var payload = req.form;
    	doc['start_date'] = payload["start_date"];
   		doc['end_date'] = payload["end_date"];
   		doc['text'] = payload["text"];
   		doc['event_pid'] = payload["event_pid"];
   		doc['event_length'] = payload["event_length"];
   		doc['rec_pattern'] = payload["rec_pattern"];
   		doc['rec_type'] = payload["rec_type"];
   		doc['channel'] = payload["channel"];
   		doc['client'] = payload["client"];
   		doc['outlet'] = payload["outlet"];
   		doc['username'] = payload["username"];
   		doc['sr_report'] = JSON.parse(payload["sr_report"]);

    	return [doc,JSON.stringify({"action":"updated"})];
    }

    if(req.method == "POST"){
    	var payload = req.form;
        if(doc === null){
            doc = {};
            doc['_id'] = req['uuid'];
            doc['doctype'] = "event";
            doc['id'] = doc["_id"];
            doc['start_date'] = payload["start_date"];
       		doc['end_date'] = payload["end_date"];
       		doc['text'] = payload["text"];
       		doc['event_pid'] = payload["event_pid"];
       		if(payload["event_pid"] == "" && payload.rec_type.length > 0 && payload.rec_pattern.length > 0){
       			doc['event_pid'] = "0";
       		}
       		doc['event_length'] = payload["event_length"];
       		doc['rec_pattern'] = payload["rec_pattern"];
       		doc['rec_type'] = payload["rec_type"];
       		doc['channel'] = payload["channel"];
       		doc['client'] = payload["client"];
       		doc['outlet'] = payload["outlet"];
       		doc['username'] = payload["username"];
       		doc['sr_report'] = JSON.parse(payload['sr_report']); 
        }else{
            doc['start_date'] = payload["start_date"];
       		doc['end_date'] = payload["end_date"];
       		doc['text'] = payload["text"];
       		doc['event_pid'] = payload["event_pid"];
       		doc['event_length'] = payload["event_length"];
       		doc['rec_pattern'] = payload["rec_pattern"];
       		doc['rec_type'] = payload["rec_type"];
       		doc['channel'] = payload["channel"];
       		doc['client'] = payload["client"];
       		doc['outlet'] = payload["outlet"];
       		doc['username'] = payload["username"];
       		doc['sr_report'] = JSON.parse(payload["sr_report"]); 
        }
    	if(payload["rec_type"] == "none") return [doc, JSON.stringify({"action":"deleted"})];
    	return [doc, JSON.stringify({"action":"inserted", "sid":req.id, "tid":req['uuid']})];
    }

 	//unknown request - send error with request payload
    return [null, JSON.stringify({"action":"error", "req":req})];
}