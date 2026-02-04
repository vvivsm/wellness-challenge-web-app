function loadLayout() {
    fetch("navbar.html")
        .then(function (res) { return res.text(); })
        .then(function (html) {
            var temp = document.createElement("div");
            temp.innerHTML = html;

            var navTpl = temp.querySelector("#tpl-navbar");
            var footTpl = temp.querySelector("#tpl-footer");

            var navMount = document.getElementById("navbarMount");
            var footMount = document.getElementById("footerMount");

            if (navTpl && navMount) navMount.innerHTML = navTpl.innerHTML;
            if (footTpl && footMount) footMount.innerHTML = footTpl.innerHTML;

            setActiveNav();
            setupLogout();
        })
        .catch(function (err) {
            console.error("Failed to load navbar.html", err);
        });
}

function setActiveNav() {
    var page = window.location.pathname.split("/").pop();
    if (!page) page = "index.html";

    var links = document.querySelectorAll(".nav-link[data-nav]");
    for (var i = 0; i < links.length; i++) {
        var target = links[i].getAttribute("data-nav");
        if (target === page) links[i].classList.add("active");
        else links[i].classList.remove("active");
    }
}

function setupLogout() {
    var logout = document.getElementById("logoutLink");
    if (!logout) return;

    logout.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", function () {
    loadLayout();
});
