// Function to inject the navigation bar HTML into the page
function injectNav(id, file, callback) {
  fetch(file)
    .then((res) => res.text())
    .then((html) => {
      document.getElementById(id).innerHTML = html;
      if (typeof callback === "function") {
        callback(); // after injecting the top nav bar, call the callback function (window.logout)
      }
    })
    .catch((err) => console.error(`Error loading ${file}:`, err));
}

// get the user email from the token stored in local storage
// so that it can be used to know which the user profile data (data entry) from the database
// then the user can update their profile data

function getEmailFromToken() {
  const token = localStorage.getItem("token");
  if (token) {
    const payload = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.email;
  }
  return null;
}

async function upLoadImageToImageKit(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:8080/uploadProfileImage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      console.log("Image uploaded successfully:", data);
      return data.url; // Return the URL of the uploaded image so that it can be used in the profile data
    } else {
      console.error("Error uploading image ImageKit:", data.message);
      alert("Error uploading image");
    }
  } catch (err) {
    console.error("Error uploading image to ImageKit:", err);
    alert("Error uploading image");
    return null;
  }
}

// allow user to upload a profile image and preview it before submitting the form
const profileImage = document.getElementById("profileImage");
const imageUpload = document.getElementById("imageUpload");
const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", () => {
  imageUpload.click(); // Trigger the file input click event
});

imageUpload.addEventListener("change", (e) => {
  // console.log("Image upload event triggered");
  const file = e.target.files[0];
  if (file) {
    // console.log(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

//skills handling
const skillInput = document.getElementById("skillInput");
const addSkillBtn = document.getElementById("addSkill");
const skillsList = document.getElementById("skillsList");

let skills = [];

addSkillBtn.addEventListener("click", () => {
  const skill = skillInput.value.trim();
  if (skill && !skills.includes(skill)) {
    skills.push(skill);
    renderSkills();
    skillInput.value = ""; // Clear the input field
  }
});

function renderSkills() {
  skillsList.innerHTML = ""; // Clear the list
  skills.forEach((skill, index) => {
    const skillItem = document.createElement("div");
    skillItem.className = "skill-item";
    skillItem.innerHTML = `${skill} <span class="remove-btn" onclick="removeSkill(${index})">&times;</span>`;
    skillsList.appendChild(skillItem);
  });
}

function removeSkill(index) {
  skills.splice(index, 1); // Remove the skill from the array
  renderSkills(); // Re-render the skills list
}

const interestInput = document.getElementById("interestInput");
const addInterestBtn = document.getElementById("addInterest");
const interestsList = document.getElementById("interestsList");

let interests = [];

addInterestBtn.addEventListener("click", () => {
  const interest = interestInput.value.trim();
  if (interest && !interests.includes(interest)) {
    interests.push(interest);
    renderInterests();
    interestInput.value = ""; // Clear the input field for adding the next interest
  }
});

function renderInterests() {
  // console.log('Rendering interests:', interests);
  interestsList.innerHTML = ""; // Clear the list to render the updated interests
  interests.forEach((interest, index) => {
    const interestItem = document.createElement("div");
    interestItem.className = "interest-item";
    interestItem.innerHTML = `${interest} <span class="remove-btn" onclick="removeInterest(${index})">&times;</span>`;
    interestsList.appendChild(interestItem);
  });
}

function removeInterest(index) {
  interests.splice(index, 1); // Remove the interest from the array
  renderInterests(); // Re-render the interests list
}

const profileForm = document.getElementById("profileForm");

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = imageUpload.files[0];
  let profileImageUrl = "";
  if (file) {
    //get the url from imagekit CDN after uploading the image to imagekit
    // store the url in the profileImageUrl variable
    profileImageUrl = await upLoadImageToImageKit(file);
  }

  const email = getEmailFromToken();
  const profileData = {
    name: document.getElementById("Name").value,
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    role: document.getElementById("role").value,
    skills: skills,
    interests: interests,
    bio: document.getElementById("bio").value,
    profileImageUrl: profileImageUrl,
    email: email,
  };

  try {
    const response = await fetch("http://localhost:8080/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Profile updated successfully!");
      console.log("Profile updated successfully:", data.message);
      window.location.href = "home.html"; // Redirect to the profile page after successful update
    } else {
      alert("Error updating profile");
      console.log("Error updating profile:", data.message);
    }
  } catch (error) {
    console.error("Error updating profile: ", error);
    alert("An error occurred. Please try again later.");
  }
});

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

  async function fetchUserProfile(email) {
    try {
      const response = await fetch(
        `http://localhost:8080/profile?email=${email}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        populateFormWithProfile(data);
      } else {
        console.error("Error fetching profile:", data.message);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  function populateFormWithProfile(data) {
    document.getElementById("Name").value = data.name || "";
    document.getElementById("dob").value = data.dob || "";
    document.getElementById("gender").value = data.gender || "";
    document.getElementById("role").value = data.role || "";
    document.getElementById("bio").value = data.bio || "";
    profileImage.src =
      data.profileImageUrl || "./images/default-profile-image.png";

    skills = data.skills ? data.skills.split(",").map((s) => s.trim()) : [];
    interests = data.interests
      ? data.interests.split(",").map((i) => i.trim())
      : [];

    renderSkills();
    renderInterests();
  }

  const email = getEmailFromToken();
  if (email) {
    fetchUserProfile(email);
  }
});
