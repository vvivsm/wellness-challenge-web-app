// ------------------------------
// CONFIG
// ------------------------------
var BASE_URL = "http://localhost:3000"; // Live Server needs this
var INGREDIENTS_ENDPOINT = "/api/ingredients"; // list all ingredients
var BUY_PREFIX = "/api/users/"; // + userId + "/ingredients/" + ingredientId + "/buy"

// ------------------------------
// ICONS
// ------------------------------
var INGREDIENT_ICONS = {
    "Chamomile Petals": "🫖",
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
function $(id) {
    return document.getElementById(id);
}
function showStatusModal(type, message) {
    // type = "success" | "error"
    var modal = $("statusModal");
    var title = $("statusModalTitle");
    var msg = $("statusModalMessage");

    if (!modal || !title || !msg) return;

    modal.classList.remove("success", "error");
    modal.classList.add(type);

    title.textContent = (type === "success")
        ? "PURCHASE SUCCESS"
        : "PURCHASE FAILED";

    msg.textContent = message || "";

    modal.style.display = "flex";
}

function closeStatusModal() {
    var modal = $("statusModal");
    if (modal) modal.style.display = "none";
}


function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

function hideMessage() {
    var el = $("shopMessage");
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
}

function getTokenOrRedirect() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return null;
    }
    return token;
}

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
// JWT helpers
// ------------------------------
function parseJwt(token) {
    try {
        var base64Url = token.split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(
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
    var payload = parseJwt(token);
    if (!payload) return null;
    return payload.userId || payload.user_id || payload.id || null;
}

// ------------------------------
// Render shop
// ------------------------------
function typeMeta(type) {
    var map = {
        sleep: { title: "😴 SLEEP INGREDIENTS 😴" },
        physical: { title: "💪 PHYSICAL INGREDIENTS 💪" },
        mental: { title: "🧠 MENTAL INGREDIENTS 🧠" },
        social: { title: "🫶 SOCIAL INGREDIENTS 🫶" }
    };
    return map[type] || { title: "INGREDIENTS" };
}

function buildSectionHtml(type, items) {
    var meta = typeMeta(type);
    var html = "";

    html += '<div class="shop-section type-' + type + '">';
    html += '  <h2 class="section-title">';
    html += '    <span class="rarity-badge">' + meta.title + "</span>";
    html += "  </h2>";
    html += '  <div class="items-grid">';

    for (var i = 0; i < items.length; i++) {
        var ing = items[i];
        var id = ing.id;
        var name = ing.name || "Unknown";
        var cost = ing.cost || 0;
        var icon = INGREDIENT_ICONS[name] || "🥣";

        html += '    <div class="item-card type-' + type + '">';
        html += '      <div class="item-icon">' + icon + "</div>";
        html += '      <h3 class="item-name">' + escapeHtml(name.toUpperCase()) + "</h3>";
        html += '      <p class="item-description">Type: ' + escapeHtml(type) + "</p>";
        html += '      <div class="item-price">';
        html += '        <span class="price-icon">💰</span>';
        html += '        <span class="price-value">' + cost + "</span>";
        html += "      </div>";
        html += '      <button class="add-to-cart-btn" data-buy-id="' + id + '" data-cost="' + cost + '">BUY</button>';
        html += "    </div>";
    }

    html += "  </div>";
    html += "</div>";

    return html;
}

function renderShop(ingredients) {
    var container = $("shopContent");
    if (!container) return;

    var groups = {};
    for (var i = 0; i < ingredients.length; i++) {
        var t = ingredients[i].type || "other";
        if (!groups[t]) groups[t] = [];
        groups[t].push(ingredients[i]);
    }

    var order = ["sleep", "physical", "mental", "social", "other"];
    var html = "";

    for (var j = 0; j < order.length; j++) {
        var key = order[j];
        if (groups[key] && groups[key].length > 0) {
            html += buildSectionHtml(key, groups[key]);
        }
    }

    for (var type in groups) {
        if (groups.hasOwnProperty(type)) {
            var inOrder = false;
            for (var k = 0; k < order.length; k++) if (order[k] === type) inOrder = true;
            if (!inOrder) html += buildSectionHtml(type, groups[type]);
        }
    }

    container.innerHTML = html;

    bindBuyButtons();
}

// ------------------------------
// Bind buy buttons (event delegation)
// ------------------------------
function bindBuyButtons() {
    var container = $("shopContent");
    if (!container) return;

    if (container.dataset.buyBound === "true") return;
    container.dataset.buyBound = "true";

    container.addEventListener("click", function (e) {
        var target = e.target;
        if (!target) return;

        var id = target.getAttribute("data-buy-id");
        if (id) {
            buyIngredient(id, target);
        }
    });
}

// ------------------------------
// BUY (uses fetchMethod)
// ------------------------------
function buyIngredient(ingredientId, buttonEl) {
    hideMessage();

    var token = getTokenOrRedirect();
    if (!token) return;

    var userId = getUserIdFromToken(token);
    if (!userId) {
        showStatusModal("error", "Invalid session. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    // Check points before calling backend
    var cost = parseInt(buttonEl.getAttribute("data-cost")) || 0;
    var currentPts = parseInt($("playerPoints") ? $("playerPoints").textContent : "0") || 0;

    if (currentPts < cost) {
        showStatusModal("error", "Not enough points to buy this ingredient.");
        return;
    }

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "BUYING...";
    }

    var url = BASE_URL + BUY_PREFIX + userId + "/ingredients/" + ingredientId + "/buy";

    fetchMethod(url, function (status, res) {

        // ✅ SUCCESS
        if (status === 200 || status === 201) {
            showStatusModal(
                "success",
                (res && res.message) ? res.message : "Ingredient purchased successfully!"
            );

            // Update points immediately
            if ($("playerPoints")) {
                $("playerPoints").textContent = currentPts - cost;
            }

            // allow buying again
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.textContent = "BUY";
            }
            return; // IMPORTANT: stop here so it won't show error modal
        }
        
        // Unauthorized
        if (status === 401 || status === 403) {
            showStatusModal("error", (res && res.message) ? res.message : "Unauthorized. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other errors
        showStatusModal("error", (res && res.message) ? res.message : ("Purchase failed (HTTP " + status + ")"));

    }, "POST", {}, token);
}


// ------------------------------
// Load ingredients (uses fetchMethod)
// ------------------------------
function loadIngredients() {
    var token = getTokenOrRedirect();
    if (!token) return;

    var url = BASE_URL + INGREDIENTS_ENDPOINT;

    fetchMethod(url, function (status, res) {
        if (status === 200) {
            var list = [];

            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res.ingredients)) list = res.ingredients;
            else if (Array.isArray(res.data)) list = res.data;
            else if (Array.isArray(res.results)) list = res.results;

            if (!list || list.length === 0) {
                showMessage("No ingredients found from /api/ingredients", true);
                return;
            }

            renderShop(list);
            return;
        }

        if (status === 401 || status === 403) {
            showMessage("Session expired. Please login again.", true);
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        showMessage((res && res.message) ? res.message : ("Failed to load ingredients (HTTP " + status + ")"), true);
    }, "GET", null, token);
}

// ------------------------------
// Load user points (GET /api/users/:id) (uses fetchMethod)
// ------------------------------
function loadUserPoints() {
    var token = getTokenOrRedirect();
    if (!token) return;

    var userId = getUserIdFromToken(token);
    if (!userId) return;

    fetchMethod(BASE_URL + "/api/me", function (status, res) {
        if (status === 200 && res) {
            var user = res.data || res.user || res;
            if (user && user.points !== undefined && $("playerPoints")) {
                $("playerPoints").textContent = user.points;
            }
        }
    }, "GET", null, token);
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener("DOMContentLoaded", function () {
    setupLogout();

    if ($("playerPoints")) $("playerPoints").textContent = "—";

    loadUserPoints();
    loadIngredients();
});
