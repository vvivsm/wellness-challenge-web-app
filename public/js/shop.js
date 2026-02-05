// ------------------------------
// CONFIG
// ------------------------------
var BASE_URL = "http://localhost:3000"; // Base backend URL (needed for Live Server)
var INGREDIENTS_ENDPOINT = "/api/ingredients"; // Endpoint to list all ingredients


// ------------------------------
// ICONS
// ------------------------------

// Maps ingredient display names to emoji icons for nicer UI
var INGREDIENT_ICONS = {
    "Chamomile Petals": "🌸",
    "Lavender Buds": "🪻",
    "Warm Almond Milk": "🥛",

    "Lean Chicken": "🍗",
    "Fresh Ginger Root": "🫚",
    "Power Carrot": "🥕",

    "Forest Mushroom": "🍄",
    "Focus Spinach": "🥬",
    "Mindful Seaweed": "🌿",

    "Friendly Tomato": "🍅",
    "Golden Sweet Corn": "🌽",
    "Sharing Noodles": "🍜"
};


// ------------------------------
// Helpers
// ------------------------------

// Shorthand helper for document.getElementById
function $(id) {
    return document.getElementById(id);
}

// showStatusModal(type, message)
// - Displays a simple modal used after a purchase attempt
// - type controls styling and title text ("success" or "error")
function showStatusModal(type, message) {
    // type = "success" | "error"
    var modal = $("statusModal");
    var title = $("statusModalTitle");
    var msg = $("statusModalMessage");

    // If modal DOM isn't present, do nothing
    if (!modal || !title || !msg) return;

    // Clear previous state then add new state class
    modal.classList.remove("success", "error");
    modal.classList.add(type);

    // Set the modal title depending on outcome
    title.textContent = (type === "success")
        ? "PURCHASE SUCCESS"
        : "PURCHASE FAILED";

    // Set message text (fallback to empty)
    msg.textContent = message || "";

    // Show the modal (flex used for centering)
    modal.style.display = "flex";
}

// closeStatusModal()
// - Hides the purchase status modal
function closeStatusModal() {
    var modal = $("statusModal");
    if (modal) modal.style.display = "none";
}

// escapeHtml(str)
// - Sanitizes text so it’s safe to insert into innerHTML
// - Prevents HTML injection (e.g., <script> tags) when rendering ingredient names
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// showMessage(text, isError)
// - Shows a top/bottom message bar on the shop page
// - isError controls border color styling
function showMessage(text, isError) {
    var el = $("shopMessage");
    if (!el) return;

    el.style.display = "block";
    el.textContent = text;
    el.style.border = "2px solid " + (isError ? "#ff4d4d" : "#3cff7a");
    el.style.padding = "10px";
    el.style.margin = "10px auto";
    el.style.maxWidth = "900px";
}

// hideMessage()
// - Hides the shop page message bar and clears its text
function hideMessage() {
    var el = $("shopMessage");
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
}

// getTokenOrRedirect()
// - Reads token from localStorage
// - If missing, forces user to login
// - Returns token string or null
function getTokenOrRedirect() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return null;
    }
    return token;
}

// setupLogout()
// - Wires up logout button to clear token and redirect to login
function setupLogout() {
    var btn = $("logoutBtn");
    if (!btn) return;

    btn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
}


// ------------------------------
// Render shop
// ------------------------------

// typeMeta(type)
// - Returns display title for each ingredient type category
function typeMeta(type) {
    var map = {
        sleep: { title: "😴 SLEEP INGREDIENTS 😴" },
        physical: { title: "💪 PHYSICAL INGREDIENTS 💪" },
        mental: { title: "🧠 MENTAL INGREDIENTS 🧠" },
        social: { title: "🫶 SOCIAL INGREDIENTS 🫶" }
    };
    return map[type] || { title: "INGREDIENTS" };
}

// buildSectionHtml(type, items)
// - Builds the HTML for one category section (e.g., sleep/mental)
// - Creates a grid of item cards, each with a BUY button
function buildSectionHtml(type, items) {
    var meta = typeMeta(type);
    var html = "";

    html += '<div class="shop-section type-' + type + '">';
    html += '  <h2 class="section-title">';
    html += '    <span class="type-badge">' + meta.title + "</span>";
    html += "  </h2>";
    html += '  <div class="items-grid">';

    // Build one "item card" per ingredient
    for (var i = 0; i < items.length; i++) {
        var ing = items[i];
        var id = ing.id;
        var name = ing.name || "Unknown";
        var cost = ing.cost || 0;
        var icon = INGREDIENT_ICONS[name] || "🥣";

        html += '    <div class="item-card type-' + type + '">';
        html += '      <div class="item-icon">' + icon + "</div>";
        html += '      <h3 class="item-name">' + escapeHtml(name.toUpperCase()) + "</h3>";
        html += '      <div class="item-price">';
        html += '        <span class="price-icon">💰</span>';
        html += '        <span class="price-value">' + cost + "</span>";
        html += "      </div>";
        // BUY button stores ingredient id and cost using data-* attributes
        html += '      <button class="buy-btn" data-buy-id="' + id + '" data-cost="' + cost + '">BUY</button>';
        html += "    </div>";
    }

    html += "  </div>";
    html += "</div>";

    return html;
}

// renderShop(ingredients)
// - Groups ingredients by type
// - Builds sections in a fixed order (sleep, physical, mental, social, other)
// - Inserts HTML into #shopContent and binds BUY button clicks
function renderShop(ingredients) {
    var container = $("shopContent");
    if (!container) return;

    // Group ingredients by type
    var groups = {};
    for (var i = 0; i < ingredients.length; i++) {
        var t = ingredients[i].type || "other";
        if (!groups[t]) groups[t] = [];
        groups[t].push(ingredients[i]);
    }

    // Render in a preferred order
    var order = ["sleep", "physical", "mental", "social", "other"];
    var html = "";

    // Add sections in the known order first
    for (var j = 0; j < order.length; j++) {
        var key = order[j];
        if (groups[key] && groups[key].length > 0) {
            html += buildSectionHtml(key, groups[key]);
        }
    }

    // If there are any unknown types, render them after the known ones
    for (var type in groups) {
        if (groups.hasOwnProperty(type)) {
            var inOrder = false;
            for (var k = 0; k < order.length; k++) if (order[k] === type) inOrder = true;
            if (!inOrder) html += buildSectionHtml(type, groups[type]);
        }
    }

    // Insert rendered HTML
    container.innerHTML = html;

    // Hook up click handler for BUY buttons
    bindBuyButtons();
}


// ------------------------------
// Bind buy buttons (event delegation)
// ------------------------------

// bindBuyButtons()
// - Uses event delegation on #shopContent
// - Only binds once using container.dataset.buyBound
function bindBuyButtons() {
    var container = $("shopContent");
    if (!container) return;

    // Prevent multiple bindings if renderShop is called again
    if (container.dataset.buyBound === "true") return;
    container.dataset.buyBound = "true";

    container.addEventListener("click", function (e) {
        var target = e.target;
        if (!target) return;

        // BUY button stores ingredient id in data-buy-id
        var id = target.getAttribute("data-buy-id");
        if (id) {
            buyIngredient(id, target);
        }
    });
}


// ------------------------------
// BUY (uses fetchMethod)
// ------------------------------

// buyIngredient(ingredientId, buttonEl)
// - Checks user logged in (token exists)
// - Checks user has enough points (using #playerPoints on the page)
// - Calls POST /api/me/ingredients/:id/buy with token
// - On success: shows modal + updates points immediately
// CA2-safe:
// ✅ DOES NOT decode token
// ✅ DOES NOT send userId in request body
function buyIngredient(ingredientId, buttonEl) {
    hideMessage();

    // Must be logged in
    var token = getTokenOrRedirect();
    if (!token) return;

    // Check points before calling backend
    var cost = parseInt(buttonEl.getAttribute("data-cost"), 10) || 0;
    var currentPts = parseInt($("playerPoints") ? $("playerPoints").textContent : "0", 10) || 0;

    // Block purchase if user does not have enough points
    if (currentPts < cost) {
        showStatusModal("error", "Not enough points to buy this ingredient.");
        return;
    }

    // lock BUY button UI during request
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "BUYING...";
    }

    // Purchase endpoint for current user (backend infers user from token)
    var url = BASE_URL + "/api/me/ingredients/" + ingredientId + "/buy";

    fetchMethod(url, function (status, res) {

        // ✅ SUCCESS
        if (status === 200 || status === 201) {
            showStatusModal(
                "success",
                (res && res.message) ? res.message : "Ingredient purchased successfully!"
            );

            // Update points immediately on UI (client-side)
            if ($("playerPoints")) {
                $("playerPoints").textContent = currentPts - cost;
            }

            // allow buying again
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.textContent = "BUY";
            }
            return; // stop here so it won't show error modal
        }

        // Unauthorized (token invalid/expired)
        if (status === 401 || status === 403) {
            showStatusModal("error", (res && res.message) ? res.message : "Unauthorized. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other errors
        showStatusModal("error", (res && res.message) ? res.message : ("Purchase failed (HTTP " + status + ")"));

        // unlock button after error
        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.textContent = "BUY";
        }

    }, "POST", {}, token);
}


// ------------------------------
// Load ingredients (uses fetchMethod)
// ------------------------------

// loadIngredients()
// - Calls GET /api/ingredients
// - Normalizes response into an array
// - Renders the shop sections and cards
function loadIngredients() {
    var token = getTokenOrRedirect();
    if (!token) return;

    var url = BASE_URL + INGREDIENTS_ENDPOINT;

    fetchMethod(url, function (status, res) {
        if (status === 200) {
            var list = [];

            // Normalize response shapes into list
            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res.ingredients)) list = res.ingredients;
            else if (Array.isArray(res.data)) list = res.data;
            else if (Array.isArray(res.results)) list = res.results;

            // If backend returned an empty list, show message
            if (!list || list.length === 0) {
                showMessage("No ingredients found from /api/ingredients", true);
                return;
            }

            // Render shop UI
            renderShop(list);
            return;
        }

        // Unauthorized (token invalid/expired)
        if (status === 401 || status === 403) {
            showMessage("Session expired. Please login again.", true);
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other errors
        showMessage((res && res.message) ? res.message : ("Failed to load ingredients (HTTP " + status + ")"), true);
    }, "GET", null, token);
}


// ------------------------------
// Load user points (GET /api/me) (uses fetchMethod)
// ------------------------------

// loadUserPoints()
// - Calls GET /api/me to retrieve the user's current points
// - Updates #playerPoints textContent
// CA2-safe:
// ✅ DOES NOT decode token
function loadUserPoints() {
    var token = getTokenOrRedirect();
    if (!token) return;

    fetchMethod(BASE_URL + "/api/me", function (status, res) {
        if (status === 200 && res) {
            var user = res.data || res.user || res;
            if (user && user.points !== undefined && $("playerPoints")) {
                $("playerPoints").textContent = user.points;
            }
            return;
        }

        // If session expired, force relogin
        if (status === 401 || status === 403) {
            showMessage("Session expired. Please login again.", true);
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other failures: show placeholder
        if ($("playerPoints")) $("playerPoints").textContent = "0";
    }, "GET", null, token);
}


// ------------------------------
// Init
// ------------------------------

// Runs when the shop page loads:
// - sets up logout button
// - shows placeholder points while loading
// - loads user points first, then loads ingredient list
document.addEventListener("DOMContentLoaded", function () {
    setupLogout();

    // placeholder while loading points
    if ($("playerPoints")) $("playerPoints").textContent = "—";

    loadUserPoints();
    loadIngredients();
});
