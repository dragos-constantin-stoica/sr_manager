function (head, req) {
    // specify that we're providing a JSON response
    provides('json', function() {
        // create an array for our result set
        var results = [];
        var request = req.query;
        // we search for request.username and request.roles      
        while (row = getRow()) {
            if(request.roles == "admin"){
                results.push({
                    _id: row.value._id,
                    _rev: row.value._rev,
    				username: row.value.username,
    				name:row.value.name,
    				surname:row.value.surname,
    				boss_asm:row.value.boss_asm,
                    roles_admin: row.value.roles_admin,
                    roles_guest: row.value.roles_guest,
                    roles_asm: row.value.roles_asm,
                    roles_sr: row.value.roles_sr,
                    active: row.value.active
                });
            }
            if(request.roles == "asm"){
                if(request.username == row.value.username || request.username == row.value.boss_asm){
                    results.push({
                        _id: row.value._id,
                        _rev: row.value._rev,
                        username: row.value.username,
                        name:row.value.name,
                        surname:row.value.surname,
                        boss_asm:row.value.boss_asm,
                        roles_admin: row.value.roles_admin,
                        roles_guest: row.value.roles_guest,
                        roles_asm: row.value.roles_asm,
                        roles_sr: row.value.roles_sr,
                        active: row.value.active
                    });       
                }
            }
            if(request.roles == "sr" || request.roles == "guest"){
                if(request.username == row.value.username){
                    results.push({
                        _id: row.value._id,
                        _rev: row.value._rev,
                        username: row.value.username,
                        name:row.value.name,
                        surname:row.value.surname,
                        boss_asm:row.value.boss_asm,
                        roles_admin: row.value.roles_admin,
                        roles_guest: row.value.roles_guest,
                        roles_asm: row.value.roles_asm,
                        roles_sr: row.value.roles_sr,
                        active: row.value.active
                    });   
                }
            }
        }

        // make sure to stringify the results :)
        send(JSON.stringify(results));
    });
}