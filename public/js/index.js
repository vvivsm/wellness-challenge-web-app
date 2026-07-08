var currentUserId = null;

function getTodayString() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
}

function getCompletionStorageKey(userId) {
    return "completedState_" + userId + "_" + getTodayString();
}

function loadCompletionState(userId) {
    var key = getCompletionStorageKey(userId);
    var raw = localStorage.getItem(key);

    if (!raw) return { completedCount: 0, completedIds: [] };

    try {
        var parsed = JSON.parse(raw);
        return {
            completedCount: parsed.completedCount || 0,
            completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : []
        };
    } catch (e) {
        return { completedCount: 0, completedIds: [] };
    }
}

function setText(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
}

function setWelcome(username) {
    var el = document.getElementById("welcomeLine");
    if (!el) return;

    if (!username) {
        el.textContent = "WELCOME";
        return;
    }

    el.textContent = "WELCOME, " + String(username).toUpperCase();
}

function updateDailyQuestProgress(completedCount) {
    var fill = document.getElementById("dailyQuestFill");
    var txt = document.getElementById("dailyQuestText");
    var status = document.getElementById("dailyQuestStatus");
    if (!fill || !txt || !status) return;

    var target = 3;
    var capped = completedCount > target ? target : completedCount;
    var pct = (capped / target) * 100;

    fill.style.width = pct + "%";
    txt.textContent = capped + " / " + target;

    if (capped >= target) {
        status.textContent = "WELL DONE!";
    } else {
        status.textContent = "KEEP GOING!";
    }
}

function renderCraftedRecipes(list) {
    var grid = document.getElementById("craftedGrid");
    var empty = document.getElementById("craftedEmpty");
    if (!grid || !empty) return;

    grid.innerHTML = "";

    if (!list || list.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    for (var i = 0; i < list.length; i++) {
        var r = list[i] || {};

        var title =
            r.recipe_name ||
            r.recipeName ||
            r.name ||
            r.title ||
            ("RECIPE #" + (r.recipe_id || r.id || (i + 1)));

        var craftedOn =
            r.crafted_at ||
            r.craftedAt ||
            r.created_at ||
            r.createdAt ||
            r.date ||
            "";

        var card = document.createElement("div");
        card.className = "crafted-card";

        card.innerHTML =
            '<div class="crafted-title">' + String(title).toUpperCase() + "</div>" +
            '<div class="crafted-meta">' +
            (craftedOn ? ("Crafted: " + craftedOn) : "Crafted: (date not provided)") +
            "</div>";

        grid.appendChild(card);
    }
}

function loadInventoryCount() {
    var token = localStorage.getItem("token");
    if (!token) {
        setText("ingredientsOwned", 0);
        return;
    }

    var callback = function (status, data) {
        if (status !== 200 || !data) {
            setText("ingredientsOwned", 0);
            return;
        }

        var list = Array.isArray(data) ? data : (data.data || data.inventory || data.results || []);

        var total = 0;
        for (var i = 0; i < list.length; i++) {
            var q = parseInt(list[i].quantity, 10);
            if (!isNaN(q)) total += q;
        }

        setText("ingredientsOwned", total);
    };

    fetchMethod(currentUrl + "/api/me/inventory", callback, "GET", null, token);
}

function loadMe(done) {
    var token = localStorage.getItem("token");
    if (!token) {
        currentUserId = null;
        setWelcome(null);
        setText("playerPoints", 0);
        if (typeof done === "function") done(0, null);
        return;
    }

    var callback = function (status, data) {
        if (status === 401 || status === 403) {
            currentUserId = null;
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (status !== 200 || !data) {
            currentUserId = null;
            if (typeof done === "function") done(status, null);
            return;
        }

        var user = data.data || data.user || data;

        currentUserId = user ? (user.id || user.user_id || user.userId || null) : null;

        setWelcome(user && user.username ? user.username : null);

        if (user && typeof user.points !== "undefined") {
            setText("playerPoints", user.points);
        }

        if (typeof done === "function") done(200, user);
    };

    fetchMethod(currentUrl + "/api/me", callback, "GET", null, token);
}

function loadCrafted() {
    var token = localStorage.getItem("token");
    if (!token) {
        renderCraftedRecipes([]);
        setText("craftedSoups", 0);
        return;
    }

    var callback = function (status, data) {
        if (status !== 200 || !data) {
            renderCraftedRecipes([]);
            setText("craftedSoups", 0);
            return;
        }

        var list = Array.isArray(data) ? data : (data.data || data.crafted || data.recipes || []);
        renderCraftedRecipes(list);
        setText("craftedSoups", list.length);
    };

    fetchMethod(currentUrl + "/api/me/crafted", callback, "GET", null, token);
}

function loadDailyChallengeProgress() {
    if (!currentUserId) {
        setText("completedChallenges", 0);
        updateDailyQuestProgress(0);
        return;
    }

    var state = loadCompletionState(currentUserId);

    setText("completedChallenges", state.completedCount);
    updateDailyQuestProgress(state.completedCount);
}

function setUpdateMsg(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;

    if (!msg) {
        el.style.display = "none";
        el.textContent = "";
        return;
    }

    el.textContent = msg;
    el.style.display = "block";
}

function setupUpdateUsername() {
    var btn = document.getElementById("updateUsernameBtn");
    var input = document.getElementById("newUsernameInput");
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
        updateUsername();
    });
}

function updateUsername() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    var btn = document.getElementById("updateUsernameBtn");
    var input = document.getElementById("newUsernameInput");

    if (!btn || !input) return;

    var newUsername = String(input.value || "").trim();

    setUpdateMsg("updateUsernameError", "");
    setUpdateMsg("updateUsernameSuccess", "");

    if (!newUsername) {
        setUpdateMsg("updateUsernameError", "Please enter a username.");
        return;
    }

    if (newUsername.length < 3) {
        setUpdateMsg("updateUsernameError", "Username must be at least 3 characters.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "UPDATING...";

    var body = { username: newUsername };

    var callback = function (status, data) {
        btn.disabled = false;
        btn.textContent = "UPDATE";

        if (status === 200 && data) {
            var user = data.data || data.user || data;

            if (user && user.username) {
                setWelcome(user.username);
            } else {
                setWelcome(newUsername);
            }

            currentUserId = user ? (user.id || user.user_id || user.userId || currentUserId) : currentUserId;

            setUpdateMsg("updateUsernameSuccess", "Username updated successfully!");
            input.value = "";
            return;
        }

        if (status === 401 || status === 403) {
            setUpdateMsg("updateUsernameError", "Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        var msg = (data && data.message) ? data.message : ("Failed to update (HTTP " + status + ")");
        setUpdateMsg("updateUsernameError", msg);
    };

    fetchMethod(currentUrl + "/api/me", callback, "PUT", body, token);
}

document.addEventListener("DOMContentLoaded", function () {
    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not loaded. Ensure queryCmds.js is loaded before index.js");
        return;
    }

    loadMe(function () {
        loadDailyChallengeProgress();
    });

    loadCrafted();
    loadInventoryCount();

    setupUpdateUsername();

    var note = document.getElementById("statsNote");
    if (note) note.style.display = "block";
});
