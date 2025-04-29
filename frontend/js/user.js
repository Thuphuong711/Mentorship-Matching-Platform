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
}