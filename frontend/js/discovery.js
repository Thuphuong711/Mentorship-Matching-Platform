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
  let filterCount = 0;
  const createFilterRow = () => {
    const row = document.createElement("div");
    row.classList.add("filter-row");

    //Field selector (Skill or Interest)
    const fieldSelect = document.createElement("select");
    const skillOption = document.createElement("option");
    skillOption.value = "skill";
    skillOption.textContent = "Skill";
    const interestOption = document.createElement("option");
    interestOption.value = "interest";
    interestOption.textContent = "Interest";
    fieldSelect.appendChild(skillOption);
    fieldSelect.appendChild(interestOption);

    // Value input
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Enter value";

    //AND or OR selector
    if (filterCount > 0) {
      const connectorSelect = document.createElement("select");
      const andOption = document.createElement("option");
      andOption.value = "and";
      andOption.textContent = "AND";

      const orOption = document.createElement("option");
      orOption.value = "or";
      orOption.textContent = "OR";
      connectorSelect.appendChild(andOption);
      connectorSelect.appendChild(orOption);
      row.appendChild(connectorSelect);
    } else {
      // Dummy connector to keep layout aligned
      const dummyDiv = document.createElement("div");
      dummyDiv.classList.add("connector-placeholder");
      row.appendChild(dummyDiv);
    }

    //Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.classList.add("delete-filter");
    deleteBtn.addEventListener("click", () => {
      filterContainer.removeChild(row);
      filterCount--;
    });

    //Append elements to the row
    row.appendChild(fieldSelect);
    row.appendChild(valueInput);
    row.appendChild(deleteBtn);

    //Apend the row to filter container
    filterContainer.appendChild(row);
    filterCount++;
  };

  //Add initial filter row
  createFilterRow();
  //Add new filter row on button click
  addFilterBtn.addEventListener("click", createFilterRow);
});
