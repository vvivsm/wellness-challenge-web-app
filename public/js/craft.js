// ------------------------------
// Helpers
// ------------------------------
function $(id) {
    return document.getElementById(id);
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

function showStatusModal(type, message) {
    var modal = $("statusModal");
    var box = $("statusModalBox");
    var title = $("statusTitle");
    var msg = $("statusMessage");

    if (!modal || !box || !title || !msg) return;

    box.classList.remove("error");

    if (type === "error") {
        title.textContent = "CRAFT FAILED";
        box.classList.add("error");
    } else {
        title.textContent = "CRAFT SUCCESS";
    }

    msg.textContent = message || "";
    modal.classList.add("show");
}

function hideStatusModal() {
    var modal = $("statusModal");
    if (modal) modal.classList.remove("show");
}

function setupModalButtons() {
    var ok = $("statusOkBtn");
    var close = $("statusCloseBtn");
    var modal = $("statusModal");

    if (ok) ok.addEventListener("click", hideStatusModal);
    if (close) close.addEventListener("click", hideStatusModal);

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) hideStatusModal();
        });
    }
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

function getTokenOrRedirect() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return null;
    }
    return token;
}

// ------------------------------
// Icons (visual only)
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
// State
// ------------------------------
var inventoryMap = {}; // ingredient_id -> { name, quantity }
var recipesList = [];  // recipe rows with .requirements attached

// ------------------------------
// Load everything
// ------------------------------
function loadAll() {
    var token = getTokenOrRedirect();
    if (!token) return;

    var userId = getUserIdFromToken(token);
    if (!userId) {
        showStatusModal("error", "Invalid session. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    loadInventory(userId, token, function () {
        loadRecipes(function () {
            loadAllRequirements(function () {

                loadCraftedRecipes(userId, token, function (craftedList) {
                    renderInventoryFromMap();
                    bindSellButtons();
                    renderRecipes();

                    // after recipes are rendered, mark crafted buttons
                    for (var i = 0; i < craftedList.length; i++) {
                        var rid = craftedList[i].recipe_id || craftedList[i].recipeId;
                        if (rid !== undefined && rid !== null) {
                            markRecipeAsCrafted(rid);
                        }
                    }
                });

            });
        });
    });
}

function loadCraftedRecipes(userId, token, done) {
    fetchMethod(currentUrl + "/api/me/crafted", function (status, res) {
        if (status !== 200) {
            // just continue, don't block page
            done([]);
            return;
        }

        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        done(list); // [{recipe_id:1}, ...]
    }, "GET", null, token);
}

// GET /api/users/:user_id/inventory
function loadInventory(userId, token, done) {
    fetchMethod(currentUrl + "/api/me/inventory", function (status, res) {
        if (status !== 200) {
            showStatusModal("error", (res && res.message) ? res.message : "Failed to load inventory.");
            return;
        }

        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        inventoryMap = {};
        for (var i = 0; i < list.length; i++) {
            var row = list[i];

            // depends on your SQL join; handle common shapes:
            var ingId = row.ingredient_id || row.ingredientId || row.id;
            var qty = row.quantity || row.qty || 0;
            var name = row.name || row.ingredient_name || row.ingredientName || "Ingredient";

            if (ingId !== undefined && ingId !== null) {
                inventoryMap[parseInt(ingId)] = {
                    name: name,
                    quantity: parseInt(qty) || 0
                };
            }
        }

        done();
    }, "GET", null, token);
}

// GET /api/recipes
function loadRecipes(done) {
    fetchMethod(currentUrl + "/api/recipes", function (status, res) {
        if (status !== 200) {
            showStatusModal("error", (res && res.message) ? res.message : "Failed to load recipes.");
            return;
        }

        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        recipesList = list;
        done();
    }, "GET", null, null);
}

// GET /api/recipes/:recipe_id/requirements for ALL recipes
function loadAllRequirements(done) {
    var remaining = recipesList.length;
    if (remaining === 0) { done(); return; }

    for (var i = 0; i < recipesList.length; i++) {
        (function (recipe) {
            fetchMethod(currentUrl + "/api/recipes/" + recipe.id + "/requirements", function (status, res) {
                var reqs = [];
                if (status === 200) {
                    if (Array.isArray(res)) reqs = res;
                    else if (Array.isArray(res.data)) reqs = res.data;
                    else if (Array.isArray(res.results)) reqs = res.results;
                }
                recipe.requirements = reqs;

                remaining--;
                if (remaining === 0) done();
            }, "GET", null, null);
        })(recipesList[i]);
    }
}

// ------------------------------
// Render Inventory
// ------------------------------
function renderInventoryFromMap() {
    var grid = $("inventoryGrid");
    if (!grid) return;

    var keys = Object.keys(inventoryMap);
    var html = "";

    for (var i = 0; i < keys.length; i++) {
        var ingId = keys[i];
        var item = inventoryMap[ingId];

        if (item.quantity <= 0) continue;

        var icon = INGREDIENT_ICONS[item.name] || "🥣";

        html += `
            <div class="inventory-item">
                <div class="item-icon">${icon}</div>
                <div class="item-name">${String(item.name).toUpperCase()}</div>
                <div class="item-count">x${item.quantity}</div>

                <button 
                    class="sell-btn" 
                    data-ingredient-id="${ingId}">
                    SELL
                </button>
            </div>
        `;
    }

    grid.innerHTML = html;
}

function bindSellButtons() {
    var grid = $("inventoryGrid");
    if (!grid) return;

    if (grid.dataset.sellBound === "true") return;
    grid.dataset.sellBound = "true";

    grid.addEventListener("click", function (e) {
        var btn = e.target;
        if (!btn.classList.contains("sell-btn")) return;

        var ingredientId = btn.getAttribute("data-ingredient-id");
        if (!ingredientId) return;

        sellIngredient(ingredientId, btn);
    });
}

function sellIngredient(ingredientId, buttonEl) {
    var token = getTokenOrRedirect();
    if (!token) return;

    buttonEl.disabled = true;
    buttonEl.textContent = "SELLING...";

    fetchMethod(
        currentUrl + "/api/me/inventory/" + ingredientId,
        function (status, res) {
            if (status === 200) {
                showStatusModal(
                    "success",
                    res && res.message ? res.message : "Ingredient sold!"
                );

                // Refresh inventory + recipes
                loadAll();
                return;
            }

            buttonEl.disabled = false;
            buttonEl.textContent = "SELL";

            showStatusModal(
                "error",
                res && res.message ? res.message : ("Sell failed (HTTP " + status + ")")
            );
        },
        "DELETE",
        null,
        token
    );
}

// ------------------------------
// Render Recipes
// ------------------------------
function renderRecipes() {
    var container = $("recipesContainer");
    if (!container) return;

    if (!recipesList || recipesList.length === 0) {
        container.innerHTML = '<div class="recipes-empty">No recipes found.</div>';
        return;
    }

    var html = "";

    for (var i = 0; i < recipesList.length; i++) {
        var r = recipesList[i];
        var reqs = r.requirements || [];
        var canCraft = checkCanCraft(reqs);

        html += '<div class="recipe-card ' + (canCraft ? "unlocked" : "locked") + '">';
        html += '  <div class="recipe-icon">🍲</div>';
        html += '  <h3 class="recipe-name">' + String(r.name || "RECIPE").toUpperCase() + "</h3>";
        html += '  <p class="recipe-effect">' + (r.description || "") + "</p>";

        html += '  <div class="recipe-ingredients">';

        if (reqs.length === 0) {
            html += '<div class="recipe-ingredient missing"><span>❌</span><span>No requirements found</span></div>';
        } else {
            for (var j = 0; j < reqs.length; j++) {
                var req = reqs[j];

                var ingId = req.ingredient_id || req.ingredientId;
                var need = req.required_qty || req.requiredQty || 0;

                // requirement route might JOIN ingredient name; handle both:
                var reqName = req.name || req.ingredient_name || req.ingredientName || "Ingredient";
                var inv = inventoryMap[parseInt(ingId)];
                var have = inv ? inv.quantity : 0;
                var icon = INGREDIENT_ICONS[reqName] || (inv ? (INGREDIENT_ICONS[inv.name] || "🥣") : "🥣");

                var ok = have >= need;

                html += '<div class="recipe-ingredient ' + (ok ? "" : "missing") + '">';
                html += '  <span>' + icon + "</span>";
                html += '  <span>' + String(reqName).toUpperCase() + "</span>";
                html += '  <span>x' + need + " (You: " + have + ")</span>";
                html += "</div>";
            }
        }

        html += "  </div>";

        html += '  <button class="quick-craft-btn" data-recipe-id="' + r.id + '" ' + (canCraft ? "" : "disabled") + ">";
        html += canCraft ? "CRAFT" : "NOT ENOUGH";
        html += "  </button>";

        html += "</div>";
    }

    container.innerHTML = html;
    bindCraftButtons();
}

function checkCanCraft(reqs) {
    if (!reqs || reqs.length === 0) return false;

    for (var i = 0; i < reqs.length; i++) {
        var ingId = reqs[i].ingredient_id || reqs[i].ingredientId;
        var need = reqs[i].required_qty || reqs[i].requiredQty || 0;

        var inv = inventoryMap[parseInt(ingId)];
        var have = inv ? inv.quantity : 0;

        if (have < need) return false;
    }
    return true;
}

// ------------------------------
// Craft button events
// ------------------------------
function bindCraftButtons() {
    var container = $("recipesContainer");
    if (!container) return;

    if (container.dataset.bound === "true") return;
    container.dataset.bound = "true";

    container.addEventListener("click", function (e) {
        var btn = e.target;
        if (!btn) return;

        var recipeId = btn.getAttribute("data-recipe-id");
        if (!recipeId) return;

        if (btn.disabled) return;

        craftRecipe(recipeId, btn);
    });
}

function markRecipeAsCrafted(recipeId) {
    var btn = document.querySelector('.quick-craft-btn[data-recipe-id="' + recipeId + '"]');
    if (!btn) return;

    btn.textContent = "CRAFTED ✓";
    btn.disabled = true;
    btn.classList.add("crafted-btn");
}

function craftRecipe(recipeId, buttonEl) {
    var token = getTokenOrRedirect();
    if (!token) return;

    var userId = getUserIdFromToken(token);
    if (!userId) {
        showStatusModal("error", "Invalid session. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "CRAFTING...";
    }

    fetchMethod(currentUrl + "/api/me/recipes/" + recipeId + "/craft",
        function (status, res) {
            if (status === 201 || status === 200) {
                showStatusModal("success", (res && res.message) ? res.message : "Recipe crafted successfully!");

                // Refresh everything so inventory + buttons update
                loadAll();
                return;
            }

            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.textContent = "CRAFT";
            }

            showStatusModal("error", (res && res.message) ? res.message : ("Craft failed (HTTP " + status + ")"));
        },
        "POST",
        {},
        token
    );
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener("DOMContentLoaded", function () {
    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not found. Ensure queryCmds.js loads before craft.js");
        return;
    }

    setupLogout();
    setupModalButtons();

    // load everything and render
    loadAll();
});