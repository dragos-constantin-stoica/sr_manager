function (head, req) {
    // specify that we're providing a JSON response
    provides('json', function() {
        // create an array for our result set
        var results = {};
        results.data = [];
        // we search for request.username and request.roles      
        while (row = getRow()) {
            var eventDoc = row.value;
            eventDoc.id = row.value._id;
            results.data.push(eventDoc);
        }

        // make sure to stringify the results :)
        send(JSON.stringify(results));
    });
}