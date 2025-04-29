function buildSearchQuery(basicFilters, advancedFilters){
    let query = `SELECT * FROM user`;

    let basicParts = [];
    let advancedParts = [];
    let queryParams = [];

    //Basic Filters
    if(basicFilters){
        //name
        if(basicFilters.name){
            basicParts.push(`name LIKE ?`);
            queryParams.push(`%${basicFilters.name}%`)
        }
        //email
        if(basicFilters.email){
            basicParts.push(`email LIKE ?`);
            queryParams.push(`%${basicFilters.email}%`)
        }
        //role
        if(basicFilters.role){
            basicParts.push(`role = ?`);
            queryParams.push(basicFilters.role)
        }
    }

    //Advanced Filters  
    if(advancedFilters && advancedFilters.length > 0){ // if there are advanced filters
        advancedFilters.forEach((filter, index) => { // loop through each filter in advanced filters
            if(!filter.field || !filter.value) return; // if field or value is not present, skip this filter
            
            const fieldName = filter.field; // get the field name from the filter

            const condition = `${fieldName} LIKE ?`; // create the condition for the query

            if(index === 0){
                // if it's the first filter, just add the condition,
                // the connector will be checked later to join with the basic parts
                advancedParts.push(condition); 
            } else {
                advancedParts.push(`${filter.connector} ${condition}`); // for other filters, add the connector and condition
            }
            queryParams.push(`%${filter.value}%`); // add the value to the query parameters
        });
    }

    //final WHERE clause in query
    const whereParts = [];

    if(basicParts.length > 0){
        whereParts.push(basicParts.join(" AND ")) // basic filters are always AND
    }

    // if there are advanced filters (skills and interests), add them to the where parts
    if(advancedParts.length > 0){
        const advancedWhere = "(" + advancedParts.join(" ") + ")"; // put in the brackets to group the advanced filters
        // if there is basic filters, join with the advanced filters with the first connector of the advanced filters
        if(basicParts.length > 0){
            // check the connector of the first advanced filter
            const firstConnector = advancedFilters[0].connector; // get the connector of the first advanced filter
            whereParts.push(firstConnector + " " + advancedWhere); // add the connector and the advanced filters to the where parts
        } else { // if there are no basic filters, just add the advanced filters
            whereParts.push(advancedWhere); // if there are no basic filters, just add the advanced filters
        }
    }

    // if there is basic and advanced filters, add WHERE clause to the query
    // if there are no filters, just return the query all data entries in the db
    if(whereParts.length > 0){
        query += " WHERE " + whereParts.join(" ");
    }

    return {query, queryParams};
}

module.exports = buildSearchQuery;