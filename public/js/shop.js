var BASE_URL = "http://localhost:3000";
var INGREDIENTS_ENDPOINT = "/api/ingredients";

var INGREDIENT_ICONS = {
    "Chamomile Petals": "ðŸŒ¸",
    "Lavender Buds": "ðŸª»",
    "Warm Almond Milk": "ðŸ¥›",

    "Lean Chicken": "ðŸ—",
    "Fresh Ginger Root": "ðŸ«š",
    "Power Carrot": "ðŸ¥•",

    "Forest Mushroom": "ðŸ„",
    "Focus Spinach": "ðŸ¥¬",
    "Mindful Seaweed": "ðŸŒ¿",

    "Friendly Tomato": "ðŸ…",
    "Golden Sweet Corn": "ðŸŒ½",
    "Sharing Noodles": "ðŸœ"
};

function $(id) {
    return document.getElementById(id);
}

function showStatusModal(type, message) {
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

function typeMeta(type) {
    var map = {
        sleep: { title: "ðŸ˜´ SLEEP INGREDIENTS ðŸ˜´" },
        physical: { title: "ðŸ’ª PHYSICAL INGREDIENTS ðŸ’ª" },
        mental: { title: "ðŸ§  MENTAL INGREDIENTS ðŸ§ " },
        social: { title: "ðŸ«¶ SOCIAL INGREDIENTS ðŸ«¶" }
    };
    return map[type] || { title: "INGREDIENTS" };
}

function buildSectionHtml(type, items) {
    var meta = typeMeta(type);
    var html = "";

    html += '<div class="shop-section type-' + type + '">';
    html += '  <h2 class="section-title">';
    html += '    <span class="type-badge">' + meta.title + "</span>";
    html += "  </h2>";
    html += '  <div class="items-grid">';

    for (var i = 0; i < items.length; i++) {
        var ing = items[i];
        var id = ing.id;
        var name = ing.name || "Unknown";
        var cost = ing.cost || 0;
        var icon = INGREDIENT_ICONS[name] || "ðŸ¥£";

        html += '    <div class="item-card type-' + type + '">';
        html += '      <div class="item-icon">' + icon + "</div>";
        html += '      <h3 class="item-name">' + escapeHtml(name.toUpperCase()) + "</h3>";
        html += '      <div class="item-price">';
        html += '        <span class="price-icon">ðŸ’°</span>';
        html += '        <span class="price-value">' + cost + "</span>";
        html += "      </div>";
        html += '      <button class="buy-btn" data-buy-id="' + id + '" data-cost="' + cost + '">BUY</button>';
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

function buyIngredient(ingredientId, buttonEl) {
    hideMessage();

    var token = getTokenOrRedirect();
    if (!token) return;

    var cost = parseInt(buttonEl.getAttribute("data-cost"), 10) || 0;
    var currentPts = parseInt($("playerPoints") ? $("playerPoints").textContent : "0", 10) || 0;

    if (currentPts < cost) {
        showStatusModal("error", "Not enough points to buy this ingredient.");
        return;
    }

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "BUYING...";
    }

    var url = BASE_URL + "/api/me/ingredients/" + ingredientId + "/buy";

    fetchMethod(url, function (status, res) {

        if (status === 200 || status === 201) {
            showStatusModal(
                "success",
                (res && res.message) ? res.message : "Ingredient purchased successfully!"
            );

            if ($("playerPoints")) {
                $("playerPoints").textContent = currentPts - cost;
            }

            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.textContent = "BUY";
            }
            return;
        }

        if (status === 401 || status === 403) {
            showStatusModal("error", (res && res.message) ? res.message : "Unauthorized. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        showStatusModal("error", (res && res.message) ? res.message : ("Purchase failed (HTTP " + status + ")"));

        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.textContent = "BUY";
        }

    }, "POST", {}, token);
}

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

        if (status === 401 || status === 403) {
            showMessage("Session expired. Please login again.", true);
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if ($("playerPoints")) $("playerPoints").textContent = "0";
    }, "GET", null, token);
}

document.addEventListener("DOMContentLoaded", function () {
    setupLogout();

    if ($("playerPoints")) $("playerPoints").textContent = "â€”";

    loadUserPoints();
    loadIngredients();
});
