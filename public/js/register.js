document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("registerForm");
    const warningCard = document.getElementById("warningCard");
    const warningText = document.getElementById("warningText");
    const errorBox = document.getElementById("errorMessage")
    
    function showError(msg){
        if(successBox) successBox.ckassList.add("d-none");
            errorBox.textContent=msg;
            errorBox.classList.remove("d-none")
        
    }
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;
        // Perform signup logic
        if (password === confirmPassword) {
            // Passwords match, proceed with signup
            console.log("Signup successful");
            console.log("registerUsername:", username);
            console.log("registerEmail:", email);
            console.log("registerPassword:", password);
            warningCard.classList.add("d-none");

            const data = {
                username: username,
                email: email,
                password: password,
            };

            const callback = (responseStatus, responseData) => {
                console.log("responseStatus:", responseStatus);
                console.log("responseData:", responseData);
                if (responseStatus == 200) {
                    // Check if signup was successful
                    if (responseData.token) {
                        // Store the token in local storage
                        localStorage.setItem("token", responseData.token);
                        // Redirect or perform further actions for logged-in user
                        window.location.href = "login.html";
                    }
                } else {
                    warningCard.classList.remove("d-none");
                    warningText.innerText = responseData.message;
                    showError("Registration Failed, Please Try Again")
                }
            };

            // Perform signup request
            fetchMethod("/api/auth/register", callback, "POST", data);

            // Reset the form fields
            signupForm.reset();
        } else {
            // Passwords do not match, handle error
            warningCard.classList.remove("d-none");
            warningText.innerText = "Passwords do not match";
        }
    });
});