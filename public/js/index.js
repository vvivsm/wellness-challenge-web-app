// ===============================
// HOME PAGE (index.js)
// - Loads /api/me and /api/me/crafted using token
// - Shows welcome username
// - Shows points and crafted count
// - Daily quest progress is based on today's completed challenges
//   (pulled from the same localStorage key used in challenges.js)
// ===============================

// ---------- JWT helpers ----------
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function getUserIdFromToken(token) {
    const payload = parseJwt(token);
    if (!payload) return null;
    return payload.user_id || payload.userId || payload.id || payload.userid || payload.sub || null;
}

// ---------- completion state (same scheme as challenges.js) ----------
function getTodayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
}

function getCompletionStorageKey(userId) {
    return "completedState_" + userId + "_" + getTodayString();
}

function loadCompletionState(userId) {
    const key = getCompletionStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return { completedCount: 0, completedIds: [] };

    try {
        const parsed = JSON.parse(raw);
        return {
            completedCount: parsed.completedCount || 0,
            completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : []
        };
    } catch (e) {
        return { completedCount: 0, completedIds: [] };
    }
}

// ---------- UI helpers ----------
function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
}

function setWelcome(username) {
    const el = document.getElementById("welcomeLine");
    if (!el) return;

    if (!username) {
        el.textContent = "WELCOME";
        return;
    }

    el.textContent = "WELCOME, " + String(username).toUpperCase();
}

function updateDailyQuestProgress(completedCount) {
    const fill = document.getElementById("dailyQuestFill");
    const txt = document.getElementById("dailyQuestText");
    const status = document.getElementById("dailyQuestStatus");
    if (!fill || !txt || !status) return;

    // daily quest target is 3 (design requirement)
    const target = 3;
    const capped = completedCount > target ? target : completedCount;
    const pct = (capped / target) * 100;

    fill.style.width = pct + "%";
    txt.textContent = capped + " / " + target;

    if (capped >= target) {
        status.textContent = "WELL DONE!";
    } else {
        status.textContent = "KEEP GOING!";
    }
}

function renderCraftedRecipes(list) {
    const grid = document.getElementById("craftedGrid");
    const empty = document.getElementById("craftedEmpty");
    if (!grid || !empty) return;

    grid.innerHTML = "";

    if (!list || list.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    for (let i = 0; i < list.length; i++) {
        const r = list[i] || {};

        // try common name fields from joins
        const title =
            r.recipe_name ||
            r.recipeName ||
            r.name ||
            r.title ||
            ("RECIPE #" + (r.recipe_id || r.id || (i + 1)));

        const craftedOn =
            r.crafted_at ||
            r.craftedAt ||
            r.created_at ||
            r.createdAt ||
            r.date ||
            "";

        const card = document.createElement("div");
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
    const token = localStorage.getItem("token");
    if (!token) {
        setText("ingredientsOwned", 0);
        return;
    }

    const callback = (status, data) => {
        console.log("GET inventory status:", status);
        console.log("GET inventory data:", data);

        if (status !== 200 || !data) {
            setText("ingredientsOwned", 0);
            return;
        }

        // sendResponse wrapper usually: { message, data: [...] }
        const list = Array.isArray(data) ? data : (data.data || data.inventory || data.results || []);

        let total = 0;
        for (let i = 0; i < list.length; i++) {
            const q = parseInt(list[i].quantity, 10);
            if (!isNaN(q)) total += q;
        }

        setText("ingredientsOwned", total);
    };

    fetchMethod(currentUrl + "/api/me/inventory", callback, "GET", null, token);
}

// ---------- API calls ----------
function loadMe() {
    const token = localStorage.getItem("token");
    if (!token) {
        setWelcome(null);
        setText("playerPoints", 0);
        return;
    }

    const callback = (status, data) => {
        console.log("GET /api/me status:", status);
        console.log("GET /api/me data:", data);

        if (status !== 200 || !data) return;

        const user = data.data || data.user || data;

        setWelcome(user && user.username ? user.username : null);

        if (user && typeof user.points !== "undefined") {
            setText("playerPoints", user.points);
        }
    };

    fetchMethod(currentUrl + "/api/me", callback, "GET", null, token);
}

function loadCrafted() {
    const token = localStorage.getItem("token");
    if (!token) {
        renderCraftedRecipes([]);
        setText("craftedSoups", 0);
        return;
    }

    const callback = (status, data) => {
        console.log("GET /api/me/crafted status:", status);
        console.log("GET /api/me/crafted data:", data);

        if (status !== 200 || !data) {
            renderCraftedRecipes([]);
            setText("craftedSoups", 0);
            return;
        }

        const list = Array.isArray(data) ? data : (data.data || data.crafted || data.recipes || []);
        renderCraftedRecipes(list);
        setText("craftedSoups", list.length);
    };

    fetchMethod(currentUrl + "/api/me/crafted", callback, "GET", null, token);
}

function loadDailyChallengeProgress() {
    const token = localStorage.getItem("token");
    if (!token) {
        setText("completedChallenges", 0);
        updateDailyQuestProgress(0);
        return;
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
        setText("completedChallenges", 0);
        updateDailyQuestProgress(0);
        return;
    }

    const state = loadCompletionState(userId);
    setText("completedChallenges", state.completedCount);
    updateDailyQuestProgress(state.completedCount);
}

function setUpdateMsg(id, msg) {
    const el = document.getElementById(id);
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
    const btn = document.getElementById("updateUsernameBtn");
    const input = document.getElementById("newUsernameInput");
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
        updateUsername();
    });
}

function updateUsername() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const btn = document.getElementById("updateUsernameBtn");
    const input = document.getElementById("newUsernameInput");

    if (!btn || !input) return;

    const newUsername = (input.value || "").trim();

    setUpdateMsg("updateUsernameError", "");
    setUpdateMsg("updateUsernameSuccess", "");

    if (!newUsername) {
        setUpdateMsg("updateUsernameError", "Please enter a username.");
        return;
    }

    // basic client-side rules (backend still enforces real rules)
    if (newUsername.length < 3) {
        setUpdateMsg("updateUsernameError", "Username must be at least 3 characters.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "UPDATING...";

    const body = { username: newUsername };

    const callback = (status, data) => {
        console.log("PUT /api/me status:", status);
        console.log("PUT /api/me data:", data);

        btn.disabled = false;
        btn.textContent = "UPDATE";

        if (status === 200 && data) {
            const user = data.data || data.user || data;

            // update welcome line immediately
            if (user && user.username) {
                setWelcome(user.username);
            } else {
                setWelcome(newUsername);
            }

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

        const msg = (data && data.message) ? data.message : ("Failed to update (HTTP " + status + ")");
        setUpdateMsg("updateUsernameError", msg);
    };

    fetchMethod(currentUrl + "/api/me", callback, "PUT", body, token);
}


document.addEventListener("DOMContentLoaded", function () {
    console.log("Home page loaded!");

    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not loaded. Ensure queryCmds.js is loaded before index.js");
        return;
    }

    // These two are fully API-driven (no hard-coded user values)
    loadMe();
    loadCrafted();

    // This is driven by real completion actions today (stored by your challenges page)
    loadDailyChallengeProgress();
    loadInventoryCount();
    setupUpdateUsername();

    // Ingredients owned endpoint not provided yet -> keep as 0 but show a small note
    const note = document.getElementById("statsNote");
    if (note) note.style.display = "block";
});
