(function () {

    var NAV_ITEMS = [
        { text: "Home", href: "index.html" },
        { text: "Challenges", href: "challenges.html" },
        { text: "Shop", href: "shop.html" },
        { text: "Craft", href: "craft.html" }
    ];

    function isLoggedIn() {
        return localStorage.getItem("token") !== null;
    }

    function renderNavbar() {
        var linksHTML = "";
        for (var i = 0; i < NAV_ITEMS.length; i++) {
            linksHTML += '<a class="nav-link" href="' + NAV_ITEMS[i].href + '">' + NAV_ITEMS[i].text + '</a>';
        }

        if (isLoggedIn()) {
            linksHTML += '<a href="#" class="nav-link logout" id="logoutLink">Logout</a>';
        } else {
            linksHTML += '<a class="nav-link" href="login.html">Login</a>';
            linksHTML += '<a class="nav-link" href="register.html">Register</a>';
        }

        return (
            '<nav class="navbar">' +
            '<div class="nav-container">' +
            '<a class="nav-brand" href="index.html">' +
            '<div class="soup-logo"><div class="mini-bowl"></div></div>' +
            '<span>SOULSIP</span>' +
            '</a>' +

            '<button class="nav-toggle" id="navToggle" type="button" aria-label="Menu">' +
            '<span class="nav-toggle-bar"></span>' +
            '<span class="nav-toggle-bar"></span>' +
            '<span class="nav-toggle-bar"></span>' +
            '</button>' +

            '<div class="nav-links" id="navLinks">' +
            linksHTML +
            '</div>' +
            '</div>' +
            '</nav>'
        );
    }

    function renderFooter() {
        return (
            '<footer class="footer">' +
            '<p>Â© 2026 SOULSIP Vivian Tan. All rights reserved.</p>' +
            '</footer>'
        );
    }

    function toggleMenu() {
        var links = document.getElementById("navLinks");
        if (!links) return;

        if (links.classList.contains("open")) {
            links.classList.remove("open");
        } else {
            links.classList.add("open");
        }
    }

    function closeMenu() {
        var links = document.getElementById("navLinks");
        if (links) links.classList.remove("open");
    }

    document.addEventListener("DOMContentLoaded", function () {
        var navRoot = document.getElementById("navbar-root");
        if (navRoot) navRoot.innerHTML = renderNavbar();

        var footerRoot = document.getElementById("footerMount");
        if (footerRoot) footerRoot.innerHTML = renderFooter();

        var toggleBtn = document.getElementById("navToggle");
        if (toggleBtn) toggleBtn.addEventListener("click", toggleMenu);

        var navLinks = document.querySelectorAll(".nav-link");
        for (var i = 0; i < navLinks.length; i++) {
            navLinks[i].addEventListener("click", closeMenu);
        }

        var logoutLink = document.getElementById("logoutLink");
        if (logoutLink) {
            logoutLink.addEventListener("click", function (e) {
                e.preventDefault();
                localStorage.removeItem("token");
                window.location.href = "login.html";
            });
        }

        window.addEventListener("resize", closeMenu);
    });

})();
