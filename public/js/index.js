// ------------------------------
// In-memory session state
// ------------------------------
var currentUserId = null; // set after /api/me succeeds (NOT stored in localStorage)

// ------------------------------
// completion state (same scheme as challenges.js)
// ------------------------------

// getTodayString()
// - Returns today's date as YYYY-MM-DD
// - Used so completion state resets daily (new key each day)
function getTodayString() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
}

// getCompletionStorageKey(userId)
// - Builds localStorage key that is unique per user AND per day
// - Matches the key format used in challenges.js so both pages share progress
function getCompletionStorageKey(userId) {
    return "completedState_" + userId + "_" + getTodayString();
}

// loadCompletionState(userId)
// - Reads today's completion progress from localStorage
// - Returns an object with completedCount and completedIds
// - If missing or invalid JSON, returns safe defaults
function loadCompletionState(userId) {
    var key = getCompletionStorageKey(userId);
    var raw = localStorage.getItem(key);

    // If nothing stored for today, return empty state
    if (!raw) return { completedCount: 0, completedIds: [] };

    try {
        // Parse saved JSON string
        var parsed = JSON.parse(raw);
        // Normalize fields (ensure count is number-like and ids is an array)
        return {
            completedCount: parsed.completedCount || 0,
            completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : []
        };
    } catch (e) {
        // If storage value is corrupted, reset to defaults
        return { completedCount: 0, completedIds: [] };
    }
}


// ------------------------------
// UI helpers
// ------------------------------

// setText(id, value)
// - Finds an element by id and sets its textContent
// - Safe: does nothing if element doesn't exist
function setText(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
}

// setWelcome(username)
// - Updates the welcome line at the top of the homepage
// - If username is missing, shows a generic "WELCOME"
// - Otherwise shows "WELCOME, USERNAME" in uppercase
function setWelcome(username) {
    var el = document.getElementById("welcomeLine");
    if (!el) return;

    if (!username) {
        el.textContent = "WELCOME";
        return;
    }

    el.textContent = "WELCOME, " + String(username).toUpperCase();
}

// updateDailyQuestProgress(completedCount)
// - Updates a progress bar + text for daily quest
// - Daily quest target is 3 challenges (hard-coded design requirement)
// - Caps progress at 3 so bar never exceeds 100%
// - Changes status text based on whether target is met
function updateDailyQuestProgress(completedCount) {
    var fill = document.getElementById("dailyQuestFill");
    var txt = document.getElementById("dailyQuestText");
    var status = document.getElementById("dailyQuestStatus");
    if (!fill || !txt || !status) return;

    // daily quest target is 3 (design requirement)
    var target = 3;
    // Cap the displayed count at the target (prevents overflow)
    var capped = completedCount > target ? target : completedCount;
    // Convert completion fraction to percentage for width
    var pct = (capped / target) * 100;

    // Visually fill the progress bar
    fill.style.width = pct + "%";
    // Update progress text like "1 / 3"
    txt.textContent = capped + " / " + target;

    // Update encouragement text
    if (capped >= target) {
        status.textContent = "WELL DONE!";
    } else {
        status.textContent = "KEEP GOING!";
    }
}

// renderCraftedRecipes(list)
// - Renders a list of crafted recipes into #craftedGrid
// - Shows/hides an empty state message (#craftedEmpty)
// - Each crafted item becomes a "crafted-card" with title + crafted date
// - Tries multiple possible field names for recipe title/date from SQL joins
function renderCraftedRecipes(list) {
    var grid = document.getElementById("craftedGrid");
    var empty = document.getElementById("craftedEmpty");
    if (!grid || !empty) return;

    // Clear current UI
    grid.innerHTML = "";

    // If no crafted recipes, show empty message and stop
    if (!list || list.length === 0) {
        empty.style.display = "block";
        return;
    }

    // Otherwise hide empty message
    empty.style.display = "none";

    // Create a card for each crafted recipe
    for (var i = 0; i < list.length; i++) {
        var r = list[i] || {};

        // try common name fields from joins
        var title =
            r.recipe_name ||
            r.recipeName ||
            r.name ||
            r.title ||
            ("RECIPE #" + (r.recipe_id || r.id || (i + 1)));

        // try common timestamp fields from joins
        var craftedOn =
            r.crafted_at ||
            r.craftedAt ||
            r.created_at ||
            r.createdAt ||
            r.date ||
            "";

        // Create card container
        var card = document.createElement("div");
        card.className = "crafted-card";

        // Fill card HTML with uppercase title and a meta line with date fallback
        card.innerHTML =
            '<div class="crafted-title">' + String(title).toUpperCase() + "</div>" +
            '<div class="crafted-meta">' +
            (craftedOn ? ("Crafted: " + craftedOn) : "Crafted: (date not provided)") +
            "</div>";

        // Add to grid
        grid.appendChild(card);
    }
}


// ------------------------------
// Inventory count
// ------------------------------

// loadInventoryCount()
// - Calls GET /api/me/inventory
// - Sums up all ingredient quantities to show "ingredientsOwned"
// - If not logged in or request fails, sets count to 0
function loadInventoryCount() {
    var token = localStorage.getItem("token");
    if (!token) {
        // Not logged in: show 0
        setText("ingredientsOwned", 0);
        return;
    }

    var callback = function (status, data) {
        console.log("GET inventory status:", status);
        console.log("GET inventory data:", data);

        // If request fails, show 0
        if (status !== 200 || !data) {
            setText("ingredientsOwned", 0);
            return;
        }

        // sendResponse wrapper usually: { message, data: [...] }
        var list = Array.isArray(data) ? data : (data.data || data.inventory || data.results || []);

        // Sum up quantities from each inventory row
        var total = 0;
        for (var i = 0; i < list.length; i++) {
            var q = parseInt(list[i].quantity, 10);
            if (!isNaN(q)) total += q;
        }

        // Update the UI with total number of ingredients owned
        setText("ingredientsOwned", total);
    };

    // Authenticated GET request
    fetchMethod(currentUrl + "/api/me/inventory", callback, "GET", null, token);
}


// ------------------------------
// API calls
// ------------------------------

// loadMe(done)
// - Calls GET /api/me using token
// - Updates welcome username + points on homepage
// - Stores currentUserId in memory (NOT localStorage) for daily progress key
// - done(status, user)
function loadMe(done) {
    var token = localStorage.getItem("token");
    if (!token) {
        // Not logged in: show generic welcome + 0 points
        currentUserId = null;
        setWelcome(null);
        setText("playerPoints", 0);
        if (typeof done === "function") done(0, null);
        return;
    }

    var callback = function (status, data) {
        console.log("GET /api/me status:", status);
        console.log("GET /api/me data:", data);

        // If session expired, force relogin
        if (status === 401 || status === 403) {
            currentUserId = null;
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Only proceed on success
        if (status !== 200 || !data) {
            currentUserId = null;
            if (typeof done === "function") done(status, null);
            return;
        }

        // Support different response shapes
        var user = data.data || data.user || data;

        // Save user id into memory for completion-state key usage
        currentUserId = user ? (user.id || user.user_id || user.userId || null) : null;

        // Update welcome line using username if available
        setWelcome(user && user.username ? user.username : null);

        // Update points display if points exists
        if (user && typeof user.points !== "undefined") {
            setText("playerPoints", user.points);
        }

        if (typeof done === "function") done(200, user);
    };

    // Authenticated GET request to retrieve logged-in user's profile data
    fetchMethod(currentUrl + "/api/me", callback, "GET", null, token);
}

// loadCrafted()
// - Calls GET /api/me/crafted using token
// - Renders crafted recipes list in the UI
// - Updates craftedSoups count (list length)
// - If no token or request fails, shows empty list and 0
function loadCrafted() {
    var token = localStorage.getItem("token");
    if (!token) {
        // Not logged in: show empty crafted list
        renderCraftedRecipes([]);
        setText("craftedSoups", 0);
        return;
    }

    var callback = function (status, data) {
        console.log("GET /api/me/crafted status:", status);
        console.log("GET /api/me/crafted data:", data);

        // On fail, reset UI to empty state
        if (status !== 200 || !data) {
            renderCraftedRecipes([]);
            setText("craftedSoups", 0);
            return;
        }

        // Normalize response into an array
        var list = Array.isArray(data) ? data : (data.data || data.crafted || data.recipes || []);
        // Render cards
        renderCraftedRecipes(list);
        // Set count
        setText("craftedSoups", list.length);
    };

    // Authenticated GET request to get crafted recipes for current user
    fetchMethod(currentUrl + "/api/me/crafted", callback, "GET", null, token);
}


// ------------------------------
// Daily challenge progress 
// ------------------------------

// loadDailyChallengeProgress()
// - Reads today's completion progress from localStorage (NOT from backend)
// - Uses currentUserId from /api/me 
// - Updates completedChallenges number and the daily quest progress bar
function loadDailyChallengeProgress() {
    // If we don’t know user yet, show 0 for now
    if (!currentUserId) {
        setText("completedChallenges", 0);
        updateDailyQuestProgress(0);
        return;
    }

    // Load completion state saved by challenges page
    var state = loadCompletionState(currentUserId);

    // Update number display + progress bar
    setText("completedChallenges", state.completedCount);
    updateDailyQuestProgress(state.completedCount);
}


// ------------------------------
// Username update UI helpers
// ------------------------------

// setUpdateMsg(id, msg)
// - Shows or hides an update message area (error or success)
// - If msg is empty -> hides the element
// - If msg exists -> displays element and sets its text
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

// setupUpdateUsername()
// - Finds update button and input field for username updates
// - When button is clicked, calls updateUsername()
function setupUpdateUsername() {
    var btn = document.getElementById("updateUsernameBtn");
    var input = document.getElementById("newUsernameInput");
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
        updateUsername();
    });
}

// updateUsername()
// - Validates user is logged in
// - Validates new username (non-empty, at least 3 chars)
// - Sends PUT /api/me with { username: newUsername }
// - On success: updates welcome line immediately and shows success message
// - On auth error: clears token and redirects to login
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

    // Read and sanitize input
    var newUsername = String(input.value || "").trim();

    // Clear previous messages
    setUpdateMsg("updateUsernameError", "");
    setUpdateMsg("updateUsernameSuccess", "");

    // Validate required input
    if (!newUsername) {
        setUpdateMsg("updateUsernameError", "Please enter a username.");
        return;
    }

    // basic client-side rules (backend still enforces real rules)
    if (newUsername.length < 3) {
        setUpdateMsg("updateUsernameError", "Username must be at least 3 characters.");
        return;
    }

    // lock UI so user can’t click multiple times
    btn.disabled = true;
    btn.textContent = "UPDATING...";

    // Request payload
    var body = { username: newUsername };

    var callback = function (status, data) {
        console.log("PUT /api/me status:", status);
        console.log("PUT /api/me data:", data);

        // unlock UI
        btn.disabled = false;
        btn.textContent = "UPDATE";

        // Success: update UI immediately
        if (status === 200 && data) {
            var user = data.data || data.user || data;

            // update welcome line immediately (prefer server returned username)
            if (user && user.username) {
                setWelcome(user.username);
            } else {
                setWelcome(newUsername);
            }

            // Also refresh /api/me id in case backend changes something
            currentUserId = user ? (user.id || user.user_id || user.userId || currentUserId) : currentUserId;

            // Show success message and clear input
            setUpdateMsg("updateUsernameSuccess", "Username updated successfully!");
            input.value = "";
            return;
        }

        // If token is invalid/expired, force re-login
        if (status === 401 || status === 403) {
            setUpdateMsg("updateUsernameError", "Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other errors: show backend message if available
        var msg = (data && data.message) ? data.message : ("Failed to update (HTTP " + status + ")");
        setUpdateMsg("updateUsernameError", msg);
    };

    // Authenticated PUT request to update profile
    fetchMethod(currentUrl + "/api/me", callback, "PUT", body, token);
}


// ------------------------------
// Init
// ------------------------------

// Runs when homepage DOM is ready:
// - checks fetchMethod exists
// - loads user profile + crafted soups
// - AFTER loadMe finishes, loads daily progress (needs currentUserId)
// - loads inventory count
// - sets up username update button
// - shows stats note block if it exists
document.addEventListener("DOMContentLoaded", function () {
    console.log("Home page loaded!");

    // Safety check: your request helper must be loaded before index.js
    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not loaded. Ensure queryCmds.js is loaded before index.js");
        return;
    }

    // Load user first so we can safely read daily completion key using currentUserId
    loadMe(function () {
        loadDailyChallengeProgress();
    });

    // API-driven blocks
    loadCrafted();
    loadInventoryCount();

    // Username update button
    setupUpdateUsername();

    // Show stats note if it exists
    var note = document.getElementById("statsNote");
    if (note) note.style.display = "block";
});
