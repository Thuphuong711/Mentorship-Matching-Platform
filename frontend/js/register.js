document.getElementById("registerForm").addEventListener("submit", async(e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    if(!email || !password || !confirmPassword){
        errorMessage.textContent = " Please fill all required fields.";
        return;
    }

    if(password !== confirmPassword){
        errorMessage.textContent = " Passwords do not match.";
        return;
    }

    try{
        const response = await fetch("http://localhost:8080/register", {
            method : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        })

        const data = await response.json();

        if(response.ok){
            console.log("User registered successfully:", data.message);
            localStorage.setItem("token", data.token); // Store the token in local storage
            window.location.href = "profileSetup.html"; // Redirect to profile setup page
        } else {
            const errorMessage = document.getElementById("errorMessage");
            errorMessage.textContent = data.message;
        }
    } catch(error){
        console.error("Error registration: ", data.message);
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "An error occurred. Please try again later.";
    }
})