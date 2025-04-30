import {renderTags} from "./renderTags.js";

export function createUserCard(user) {
    const card = document.createElement("div");
    card.classList.add("user-card");

    //Profile Image
    const img = document.createElement("img");
    img.src = user.profileImageUrl || 'default-profile-image.png'; // default image if not available
    img.alt = user.name;

    //User info
    const userInfo = document.createElement("div");
    userInfo.classList.add("user-info");

    const nameElement = document.createElement("h2");
    nameElement.textContent = user.name;

    const roleElement = document.createElement("p");
    roleElement.textContent = user.role;

    //Tags for skills and interests
    const tagsContainer = document.createElement("div");
    tagsContainer.classList.add("tags");

    // Handle skills and interest (comma-separated strings)
    const skillTags = user.skills ? user.skills.split(', ') : [];
    const interestTags = user.interests ? user.interests.split(', ') : [];
    renderTags(skillTags, interestTags, advancedFilters, tagsContainer); // separate function to render tags

    const connectButton = document.createElement("button");
    connectButton.classList.add("connect-btn");
    connectButton.textContent = "Connect";
    connectButton.addEventListener("click", () => {
        alert(`Connection request sent to ${user.name}`);
    });
}

