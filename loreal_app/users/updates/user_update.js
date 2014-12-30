function(doc, req){
    var payload = JSON.parse(req.body);
	if (!doc){
        if ('username' in payload){
            // create new document
            return [
				{
					'_id': req['uuid'],
					'username':payload['username'], 
					'name':payload['name'], 
					'surname':payload['surname'],
					'boss_asm':payload['boss_asm'],
					'roles_admin':payload['roles_admin'],
					'roles_guest':payload['roles_guest'],
					'roles_asm':payload['roles_asm'],
					'roles_sr':payload['roles_sr'],
					'active':payload['active'], 
					'doctype':'user'
				}, JSON.stringify({"message":"Created"})]
        }
        // change nothing in database
        return [null, JSON.stringify({"error":"Task not created!"})]
    }
	
	doc['name'] = payload['name']; 
	doc['surname'] = payload['surname'];
	doc['boss_asm'] = payload['boss_asm'];
	doc['roles_admin'] = payload['roles_admin'];
	doc['roles_guest'] = payload['roles_guest'];
	doc['roles_asm'] = payload['roles_asm'];
	doc['roles_sr'] = payload['roles_sr'];
	doc['active'] = payload['active'];
	
    return [doc, JSON.stringify({"message":"Saved"})]
}