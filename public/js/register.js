document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("registerForm");
    const warningCard = document.getElementById("warningCard");
    const warningText = document.getElementById("warningText");
    const errorBox = document.getElementById("errorMessage")
    
    function showError(msg){
        if(successBox) successBox.classList.add("d-none");
            errorBox.textContent=msg;
            errorBox.classList.remove("d-none")
        
    }
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;

        if (password === confirmPassword) {
            warningCard.classList.add("d-none");

            const data = {
                username: username,
                email: email,
                password: password,
            };

            const callback = (responseStatus, responseData) => {
                if (responseStatus == 200) {
                    if (responseData.token) {
                        localStorage.setItem("token", responseData.token);
                        window.location.href = "login.html";
                    }
                } else {
                    warningCard.classList.remove("d-none");
                    warningText.innerText = responseData.message;
                    showError("Registration Failed, Please Try Again")
                }
            };

            fetchMethod("/api/auth/register", callback, "POST", data);

            signupForm.reset();
        } else {
            warningCard.classList.remove("d-none");
            warningText.innerText = "Passwords do not match";
        }
    });
});
