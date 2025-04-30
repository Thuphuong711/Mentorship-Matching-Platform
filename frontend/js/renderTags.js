export function renderTags(skillTags, interestTags, advancedFilters, container){
    let finalTags = [];

    // No advanced filters, just show 1st skill and 1st interest
    // not show all the skills and interests

    if(!advancedFilters || advancedFilters.length === 0){
        if(skillTags.length > 0) {
            finalTags.push(skillTags[0].trim());
        }
        if(interestTags.length > 0){
            finalTags.push(interestTags[0].trim());
        }
    } else {
        // with advanced filters
        advancedFilters.forEach(filter => {
            if(filter.value.trim() !== ""){
                finalTags.push(filter.value.trim());
            }
        });
    }

    finalTags.forEach(tag => {
        const element = document.createElement("span");
        element.className = "tag";
        element.textContent = tag;
        container.appendChild(element);
    });
}