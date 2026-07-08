document.addEventListener("DOMContentLoaded", function () {
    const callback = (responseStatus, responseData) => {
        if (responseStatus == 200) {
            if (responseData.token) {
                localStorage.setItem("token", responseData.token);
                window.location.href = "index.html";
            }
        } else {
            warningCard.classList.remove("d-none");
            warningText.innerText = responseData.message;
        }
    };

    const loginForm = document.getElementById("loginForm");

    const warningCard = document.getElementById("warningCard");
    const warningText = document.getElementById("warningText");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        if (!username || !password) {
            warningCard.classList.remove("d-none");
            warningText.innerText = "Please enter both username and password";
            return;
        } else {
            warningCard.classList.add("d-none");
        }

        const data = {
            username: username,
            password: password,
        };

        fetchMethod(currentUrl + "/api/auth/login", callback, "POST", data);

        loginForm.reset();

    });
});
