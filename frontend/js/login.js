document.getElementById("loginForm").addEventListener("submit", async(e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const errorMessage = document.getElementById("errorMessage");

    if(!email || !password){
        errorMessage.textContent = "Please fill all required fields.";
        return;
    }

    try{
        const response = await fetch("http://localhost:8080/login", {
            method : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        });


        const data = await response.json();
        if(response.ok){
            console.log("User logged in successfully:", data.message);
            window.location.href = "http://localhost:8080/dashboard.html";
        } else {
            console.log("Error logging in:", data.message);
            const errorMessage = document.getElementById("errorMessage");
            errorMessage.textContent = ("Invalid credentials. Please try again.");
        }
    } catch(error){
        console.log("Error logging in: ", error);
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "An error occurred. Please try again later.";
    }
})