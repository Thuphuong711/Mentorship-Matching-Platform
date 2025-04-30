const pendingCard = document.getElementById("pending");
const acceptedCard = document.getElementById("accepted");
const modal = document.getElementById("request-modal");
const closeModal = document.getElementById("close-modal");
const modalBody = document.getElementById("modal-body");
let mentorshipRequests = [];
const userName = JSON.parse(localStorage.getItem("user")).name;
const userId = JSON.parse(localStorage.getItem("user")).userId;

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

//Function for mentor to accept the request
async function handleAccept(id) {
  try {
    const response = await fetch(
      `http://localhost:8080/home/mentorship-requests/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "accepted" }), // Update the status to 'accepted'
      }
    );
    const data = await response.json();
    if (response.ok) {
      alert("Mentorship request accepted successfully!");
      //refresh the page or update the UI to reflect the change
      window.location.reload(); // Refresh the page to see the updated status
    } else {
      alert("Failed to accept mentorship request: " + data.message);
    }
  } catch (error) {
    console.error("Error accepting mentorship request:", error);
    alert("An error occurred while accepting the request.");
  }
}

//Function for mentor to decline the request
async function handleDecline(id) {
  try {
    const response = await fetch(
      `http://localhost:8080/home/mentorship-requests/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "declined" }), // Update the status to 'declined'
      }
    );
    const data = await response.json();
    if (response.ok) {
      alert("Mentorship request declined successfully!");
      //refresh the page or update the UI to reflect the change
      window.location.reload(); // Refresh the page to see the updated status
    } else {
      alert("Failed to decline mentorship request: " + data.message);
    }
  } catch (error) {
    console.error("Error declining mentorship request:", error);
    alert("An error occurred while declining the request.");
  }
}

//Function for mentee to cancel the request
async function handleCancel(id) {
  try {
    const response = await fetch(
      `http://localhost:8080/home/mentorship-requests/${id}/cancel`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      alert("Mentorship request cancelled successfully!");
      //refresh the page or update the UI to reflect the change
      window.location.reload(); // Refresh the page to see the updated status
    } else {
      alert("Failed to decline mentorship request: " + data.message);
    }
  } catch (error) {
    console.error("Error cancelling mentorship request:", error);
    alert("An error occurred while cancelling the request.");
  }
}

//Function to show the modal with the mentorship requests
// This function will be called when the user clicks on the pending or accepted card
function showModal(type) {
  modal.classList.remove("hidden");
  modalBody.innerHTML = "";

  mentorshipRequests.forEach((req) => {
    if (req.status !== type) return;

    const isSender = req.from_user === userId; // check whether the current user is the sender of the request or not
    //if the current user is the sender, then the other user is the receiver and vice versa
    const otherName = isSender ? req.to_user_name : req.from_user_name;

    if (type === "pending") {
      modalBody.innerHTML += isSender
        ? `<div class="request-row">
        <p class="request-text"> You sent a request to ${otherName}</p>
            <button class="cancel-request-btn request-row-btn" onclick="handleCancel(${req.id})">Cancel</button></div><hr/>`
        : `<div class="request-row">
        <p class="request-text"> ${otherName} sent you a request</p>
            <button class="accept-request-btn request-row-btn" onclick="handleAccept(${req.id})">Accept</button>
            <button class="decline-request-btn request-row-btn" onclick="handleDecline(${req.id})">Decline</button></div><hr/> `;
    }

    if (type === "accepted") {
      modalBody.innerHTML += isSender
        ? `<p class="request-text">${otherName} accepted your request</p><hr/>`
        : `<p class="request-text">You accepted ${otherName}'s request</p><hr/>`;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
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

  document.getElementById("discover-btn").addEventListener("click", () => {
    window.location.href = "discovery.html";
  });

  const pendingNumber = document.getElementById("pending-number");
  const acceptedNumber = document.getElementById("accepted-number");

  try {
    const response = await fetch(
      `http://localhost:8080/home/mentorship-requests/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      mentorshipRequests = data;
      const pendingCount = mentorshipRequests.filter(
        (req) => req.status === "pending"
      ).length;
      const acceptedCount = mentorshipRequests.filter(
        (req) => req.status === "accepted"
      ).length;
      pendingNumber.innerText = pendingCount;
      acceptedNumber.innerText = acceptedCount;

      if (pendingCount === 0) {
        modalBody.innerHTML = "<p>No pending requests</p>";
      } else {
        modalBody.innerHTML = "<p>Pending requests</p>";
      }
    } else {
      console.error("Failed to fetch mentorship requests:", data.message);
    }
  } catch (error) {
    console.error("Error fetching mentorship requests:", error);
  }

  pendingCard.addEventListener("click", () => showModal("pending"));
  acceptedCard.addEventListener("click", () => showModal("accepted"));
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));
});
