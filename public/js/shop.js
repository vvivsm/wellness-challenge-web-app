// ------------------------------
// CONFIG
// ------------------------------
var BASE_URL = "http://localhost:3000"; // IMPORTANT if you use Live Server
var INGREDIENTS_ENDPOINT = "/api/ingredients";
var BUY_ENDPOINT_PREFIX = "/api/ingredientsPIGAIGR??"; // <-- REMOVE THIS LINE IF YOU HAVE IT (ignore)
var BUY_PREFIX = "/api/ingredients/"; // + id + "/buy"

// ------------------------------
// Helpers
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

function $(id) {
    return document.getElementById(id);
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

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ------------------------------
// XHR method
// ------------------------------
function xhrMethod(url, method, data, token, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    xhr.setRequestHeader("Content-Type", "application/json");
    if (token) {
        xhr.setRequestHeader("Authorization", "Bearer " + token);
    }

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var responseData = {};
            try {
                if (xhr.responseText) responseData = JSON.parse(xhr.responseText);
            } catch (e) {
                console.log("❌ JSON parse failed for:", url);
                console.log("Status:", xhr.status);
                console.log("Raw response:", xhr.responseText);
                responseData = { message: "Invalid JSON response" };
            }
            callback(xhr.status, responseData);
        }
    };

    xhr.send(data ? JSON.stringify(data) : null);
}

// ------------------------------
// Auth
// ------------------------------
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
    html += '<span class="rarity-badge">' + meta.title + '</span>';
    html += "  </h2>";
    html += '  <div class="items-grid">';

    for (var i = 0; i < items.length; i++) {
        var ing = items[i];

        var id = ing.id;
        var name = ing.name || "Unknown";
        var cost = ing.cost || 0;

        html += '<div class="item-card type-' + type + '">';
        var icon = INGREDIENT_ICONS[name] || "🥣";
        html += '      <div class="item-icon">' + icon + '</div>';
        html += '      <h3 class="item-name">' + escapeHtml(name.toUpperCase()) + "</h3>";
        html += '      <p class="item-description">Type: ' + escapeHtml(type) + "</p>";
        html += '      <div class="item-price">';
        html += '        <span class="price-icon">💰</span>';
        html += '        <span class="price-value">' + cost + "</span>";
        html += "      </div>";

        html += '      <button class="add-to-cart-btn" id="buyBtn-' + id + '" data-buy-id="' + id + '">BUY</button>';
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
}


function bindBuyButtons() {
    var container = $("shopContent");
    if (!container) return;

    container.addEventListener("click", function (e) {
        var target = e.target;
        if (!target) return;

        var id = target.getAttribute("data-buy-id");
        if (id) {
            buyIngredient(id, target);
        }
    });
}

function buyIngredient(ingredientId, buttonEl) {
    hideMessage();

    var token = getTokenOrRedirect();
    if (!token) return;

    if (qtyInput) {
        qty = parseInt(qtyInput.value, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
    }

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "BUYING...";
    }

    var url = BASE_URL + BUY_PREFIX + ingredientId + "/buy";
    var data = {};

    xhrMethod(url, "POST", data, token, function (status, res) {
        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.textContent = "BUY";
        }

        if (status === 200 || status === 201) {
            showMessage(res.message || "Ingredient purchased successfully!", false);
            // If backend returns updated points, show it:
            if (res.points !== undefined && $("playerPoints")) {
                $("playerPoints").textContent = res.points;
            }
            return;
        }

        if (status === 401 || status === 403) {
            showMessage("Session expired. Please login again.", true);
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        showMessage(res.message || ("Purchase failed (HTTP " + status + ")"), true);
    });
}

// ------------------------------
// Load ingredients
// ------------------------------
function loadIngredients(token) {
    var url = BASE_URL + INGREDIENTS_ENDPOINT;

    xhrMethod(url, "GET", null, token, function (status, res) {
        if (status === 200) {
            // Your backend likely returns { message, data }
            // OR { ingredients: [...] }
            // OR just [...]
            var list = [];

            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res.ingredients)) list = res.ingredients;
            else if (Array.isArray(res.data)) list = res.data;
            else if (Array.isArray(res.results)) list = res.results;

            if (!list || list.length === 0) {
                showMessage("No ingredients found. Your /api/ingredients returned empty.", true);
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

        showMessage(res.message || ("Failed to load ingredients (HTTP " + status + ")"), true);
    });
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener("DOMContentLoaded", function () {
    setupLogout();

    var token = getTokenOrRedirect();
    if (!token) return;

    // If you do not have a points endpoint yet, just show a placeholder:
    if ($("playerPoints")) $("playerPoints").textContent = "—";

    loadIngredients(token);
});
