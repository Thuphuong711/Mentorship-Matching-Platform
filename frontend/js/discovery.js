document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openAdvancedFiltersBtn");
  const modal = document.getElementById("advancedFiltersModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const applyBtn = document.getElementById("applyBtn");
  const addFilterBtn = document.getElementById("addFilterBtn");
  const filterContainer = document.getElementById("filterContainer");

  //function to open the modal
  openModalBtn.addEventListener("click", () => {
    console.log("Open modal button clicked");
    modal.classList.remove("hidden");
  });

  //function to close and cancel the modal
  const closeModal = () => {
    modal.classList.add("hidden");
  };

  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Function to create a new filter

  const createFilterRow = () => {
    const row = document.createElement("div");
    row.classList.add("filter-row");

    //Field selector (Skill or Interest)
    const fieldSelect = document.createElement("select");
    const skillOption = document.createElement("option");
    skillOption.value = "skills";
    skillOption.textContent = "Skill";
    const interestOption = document.createElement("option");
    interestOption.value = "interests";
    interestOption.textContent = "Interest";
    fieldSelect.appendChild(skillOption);
    fieldSelect.appendChild(interestOption);

    // Value input
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Enter value";

    //AND or OR selector
    
      const connectorSelect = document.createElement("select");
      const andOption = document.createElement("option");
      andOption.value = "AND";
      andOption.textContent = "AND";

      const orOption = document.createElement("option");
      orOption.value = "OR";
      orOption.textContent = "OR";
      connectorSelect.appendChild(andOption);
      connectorSelect.appendChild(orOption);
      


    //Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.classList.add("delete-filter");
    deleteBtn.addEventListener("click", () => {
      filterContainer.removeChild(row);
    });

    //Append elements to the row
    row.appendChild(connectorSelect);
    row.appendChild(fieldSelect);
    row.appendChild(valueInput);
    row.appendChild(deleteBtn);
    

    //Apend the row to filter container
    filterContainer.appendChild(row);
  };

  //Add initial filter row
  createFilterRow();
  //Add new filter row on button click
  addFilterBtn.addEventListener("click", createFilterRow);

  applyBtn.addEventListener("click", async () => {
    const searchInputValue = document.getElementById("searchInput").value.trim();
    const selectedFields = [];

    document.querySelectorAll(".filter-btn.active").forEach(btn => {
        selectedFields.push(btn.getAttribute("data-field"));
    });

    //Basic search filter
    const basicFilters = {};
    if(searchInputValue) {
      if(selectedFields.includes("name")){
        basicFilters.name = searchInputValue;
      }
      if(selectedFields.includes("email")){
        basicFilters.email = searchInputValue;
      }

      if(selectedFields.includes("role")){
        const roleButton = document.querySelector(".filter-btn.active[data-field='role']");
        if(roleButton){
            basicFilters.role = roleButton.getAttribute("data-value");
        }
      }
    }

    //Advanced filters
    const advancedFilters = [];
    const filterRows = document.querySelectorAll(".filter-row");

    filterRows.forEach(row => {
        const selects = row.querySelectorAll("select");
        const connectorSelect = selects[0]; // select connector
        const fieldSelect = selects[1]; // select field (Skill or Interest)
        const inputField = row.querySelector("input[type='text']"); //Select value in the text input

        const connector = connectorSelect.value; // Get the selected connector (AND/OR)
        const field = fieldSelect.value; // Get the selected field (Skill or Interest)
        const value = inputField.value.trim(); // Get the value from the input field

        if(value) {
            advancedFilters.push({
                connector: connector,
                field: field,
                value: value
            });
        }
    });

    // Send the filters in JSON format to the server
    const searchData = {
        basicFilters: basicFilters,
        advancedFilters: advancedFilters
    }

    console.log("Search Data sent to server:", searchData); 

    // send data to the server 
    try{
        const response = await fetch("http://localhost:8080/discovery/search-users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(searchData)
        });

        const users = await response.json();
        console.log("Response from server:", users);
        // UPDATE THE UI WITH THE RESPONSE DATA

    } catch(error){
        console.error("Error sending data to server:", error);
    }

  })
});
