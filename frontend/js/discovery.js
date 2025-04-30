var advancedFilters = [];
var basicFilters = {};

// Function to inject the navigation bar HTML into the page
function injectNav(id, file, callback) {
  fetch(file)
    .then((res) => res.text())
    .then((html) => {
      document.getElementById(id).innerHTML = html;
      if (typeof callback === "function") {
        callback(); // after injecting the top nav bar, call the callback function (window.logout) for logout functionality
      }
    })
    .catch((err) => console.error(`Error loading ${file}:`, err));
}

function renderTags(skillTags, interestTags, advancedFilters, container) {
  let finalTags = [];

  // No advanced filters, just show 1st skill and 1st interest
  // not show all the skills and interests

  if (!advancedFilters || advancedFilters.length === 0) {
    if (skillTags.length > 0) {
      finalTags.push(skillTags[0].trim());
    }
    if (interestTags.length > 0) {
      finalTags.push(interestTags[0].trim());
    }
  } else {
    // with advanced filters
    advancedFilters.forEach((filter) => {
      if (filter.value.trim() !== "") {
        finalTags.push(filter.value.trim());
      }
    });
  }

  finalTags.forEach((tag) => {
    const element = document.createElement("span");
    element.className = "tag";
    element.textContent = tag;
    container.appendChild(element);
  });
}

function buildSearchFilters() {
  const searchInputValue = document.getElementById("searchInput").value.trim();
  console.log("searchInput value in buildSearchFilters:", searchInputValue);
  const selectedFields = [];

  document.querySelectorAll(".filter-btn.active").forEach((btn) => {
    selectedFields.push(btn.getAttribute("data-field"));
  });


  //Basic search filter
  if (searchInputValue) {
    if (selectedFields.includes("name")) {
      basicFilters.name = searchInputValue;
    }
    if (selectedFields.includes("email")) {
      basicFilters.email = searchInputValue;
    }

    if (selectedFields.includes("role")) {
      const roleButton = document.querySelector(
        ".filter-btn.active[data-field='role']"
      );
      if (roleButton) {
        basicFilters.role = roleButton.getAttribute("data-value");
      }
    }
    if(!selectedFields.includes("name") && !selectedFields.includes("email")){
      basicFilters.name = searchInputValue;
    }
  }

  //Advanced filters
  const filterRows = document.querySelectorAll(".filter-row");

  filterRows.forEach((row) => {
    const selects = row.querySelectorAll("select");
    const connectorSelect = selects[0]; // select connector
    const fieldSelect = selects[1]; // select field (Skill or Interest)
    const inputField = row.querySelector("input[type='text']"); //Select value in the text input

    const connector = connectorSelect.value; // Get the selected connector (AND/OR)
    const field = fieldSelect.value; // Get the selected field (Skill or Interest)
    const value = inputField.value.trim(); // Get the value from the input field

    if (value) {
      advancedFilters.push({
        connector: connector,
        field: field,
        value: value,
      });
    }
  });

  return { basicFilters, advancedFilters };
}

async function searchAndRenderUser(searchData) {
  // send data to the server
  console.log("Search Data sent to server:", searchData);
  console.log("basicFilters", searchData.basicFilters);
  console.log("advancedFilters", searchData.advancedFilters.length);
  try {
    const response = await fetch(
      "http://localhost:8080/discovery/search-users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(searchData),
      }
    );
    const users = await response.json();
    console.log("Response from server:", users);
    // UPDATE THE UI WITH THE RESPONSE DATA
    renderUserCards(users); // Call the function to render user cards
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
}

async function createUserCard(user) {
  const card = document.createElement("div");
  card.classList.add("user-card");

  //Profile Image
  const img = document.createElement("img");
  img.src = user.profileImageUrl || "default-profile-image.png"; // default image if not available
  img.alt = user.name;
  card.appendChild(img);

  //User info
  const userInfo = document.createElement("div");
  userInfo.classList.add("user-info");

  const nameElement = document.createElement("h2");
  nameElement.textContent = user.name;

  const roleElement = document.createElement("p");
  roleElement.textContent = user.role;

  //append name and role to userInfo and append userInfo to card
  userInfo.appendChild(nameElement);
  userInfo.appendChild(roleElement);
  card.appendChild(userInfo);

  //Tags for skills and interests
  const tagsContainer = document.createElement("div");
  tagsContainer.classList.add("tags");

  // Handle skills and interest (comma-separated strings)
  const skillTags = user.skills ? user.skills.split(", ") : [];
  const interestTags = user.interests ? user.interests.split(", ") : [];
  renderTags(skillTags, interestTags, advancedFilters, tagsContainer); // separate function to render tags

  card.appendChild(tagsContainer); // Append tags to the card

  //Connect button
  const connectButton = document.createElement("button");
  connectButton.classList.add("connect-btn");
  connectButton.textContent = "Connect";
  console.log("Connection request sent to:", user.name);
  console.log("User ID:", user.userId);

  connectButton.addEventListener("click", async () => {
    alert(`You send connection request to ${user.name}`);

    try {
      const response = await fetch(
        "http://localhost:8080/discovery/mentorship-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },

          body: JSON.stringify({
            from_user: JSON.parse(localStorage.getItem("user")).userId,
            to_user: user.userId,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Connection request sent successfully:", data.message);
        alert(`Connection request has been successfully sent to ${user.name}`);
        connectButton.textContent = "Request Sent"; // Change button text to indicate request sent
        connectButton.disabled = true; // Disable button after sending request to prevent multiple clicks when the request is sent and in pending status
        connectButton.classList.add("disabled"); // Add a class to style the disabled button
      } else {
        console.error("Error sending connection request:", data.message);
        alert(`Error sending connection request: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Error sending connection request. Please try again later.");
    }
  });

  // Append connect button to card
  card.appendChild(connectButton);
  return card;
}

function renderUserCards(users) {
  const userList = document.getElementById("userList");

  userList.innerHTML = ""; // Clear previous results
  const noResultsMessage = document.getElementById("noResultsMessage");
  noResultsMessage.classList.add("hidden"); // Hide no results message
  if (users.length === 0 || !users) {
    noResultsMessage.classList.remove("hidden"); // Show no results message
    return;
  }
  users.forEach(async (user) => {
    const card = await createUserCard(user, advancedFilters); // Create user card using the imported function
    userList.appendChild(card);
  });
}

function createFilterRow() {
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
}

document.addEventListener("DOMContentLoaded", () => {
  injectNav("top-nav", "topNavBar.html", () => {
    console.log("Top navigation bar loaded successfully.");
    window.logout = function () {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      console.log("Removed user data from local storage");
      window.location.href = "login.html";
    };
  });

  injectNav("bottom-nav", "bottomNavBar.html");
  
 // Handle clicking on filter buttons
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.getAttribute("data-field") === "role") {
      const wasActive = button.classList.contains("active");

      // Deactivate all role buttons
      document.querySelectorAll(".filter-btn[data-field='role']").forEach((btn) =>
        btn.classList.remove("active")
      );

      // Reactivate only if it wasn't already active
      if (!wasActive) {
        button.classList.add("active");
      }
    } else {
      // Other filter buttons (name/email/skills) toggle freely
      button.classList.toggle("active");
    }
  });
});


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

  //Add initial filter row
  createFilterRow();
  //Add new filter row on button click
  addFilterBtn.addEventListener("click", createFilterRow);

  const searchInput = document.getElementById("searchInput");

  // When user presses Enter in the search box
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const filters = buildSearchFilters(); // Get the filters from the modal
      searchAndRenderUser(filters);
      advancedFilters = []; // Reset advanced filters after search
      basicFilters = {}; // Reset basic filters after search
    }
  });

  applyBtn.addEventListener("click", async () => {
    const filters = buildSearchFilters(); // Get the filters from the modal
    searchAndRenderUser(filters); // Call the function to search and render users
    advancedFilters = []; // Reset advanced filters after search
    basicFilters = {}; // Reset basic filters after search
    modal.classList.add("hidden"); // Close the modal after applying filters
  });
});
