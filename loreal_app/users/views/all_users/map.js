function(doc) {
  if (doc.doc_type == "user") {
    emit([doc.username], 
		{
			"id": doc._id,
			"rev": doc._rev,
			"username":doc.username, 
			"name": doc.name, 
			"surname":doc.surname, 
			"boss_asm": doc.boss_asm, 
			"roles_admin":doc.roles_admin, 
			"roles_guest":doc.roles_guest,
			"roles_asm":doc.roles_asm,
			"roles_sr":doc.roles_sr,
			"active":doc.active
		}
	);
  } 
}