function $(id) {
    return document.getElementById(id);
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

function loadMe(done) {
    var token = getTokenOrRedirect();
    if (!token) return;

    fetchMethod(currentUrl + "/api/me", function (status, data) {
        if (status === 200 && data) {
            var user = data.data || data.user || data;
            if (typeof done === "function") done(200, user);
            return;
        }

        if (status === 401 || status === 403) {
            showStatusModal("error", "Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        showStatusModal("error", "Failed to verify session (HTTP " + status + ").");
        if (typeof done === "function") done(status, null);
    }, "GET", null, token);
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
        title.textContent = "FAILED";
        box.classList.add("error");
    } else {
        title.textContent = "SUCCESS";
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

var inventoryMap = {};

var recipesList = [];

function loadAll() {
    var token = getTokenOrRedirect();
    if (!token) return;

    loadMe(function (status, user) {
        if (status !== 200 || !user) return;

        loadInventory(token, function () {
            loadRecipes(function () {
                loadAllRequirements(function () {
                    loadCraftedRecipes(token, function (craftedList) {
                        renderInventoryFromMap();
                        bindSellButtons();
                        renderRecipes();

                        for (var i = 0; i < craftedList.length; i++) {
                            var rid = craftedList[i].recipe_id || craftedList[i].recipeId || craftedList[i].id;
                            if (rid !== undefined && rid !== null) {
                                markRecipeAsCrafted(rid);
                            }
                        }
                    });
                });
            });
        });
    });
}

function loadCraftedRecipes(token, done) {
    fetchMethod(currentUrl + "/api/me/crafted", function (status, res) {
        if (status !== 200) {
            if (typeof done === "function") done([]);
            return;
        }

        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        if (typeof done === "function") done(list);
    }, "GET", null, token);
}

function loadInventory(token, done) {
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

            var ingId = row.ingredient_id || row.ingredientId || row.id;
            var qty = row.quantity || row.qty || 0;
            var name = row.name || row.ingredient_name || row.ingredientName || "Ingredient";

            if (ingId !== undefined && ingId !== null) {
                inventoryMap[parseInt(ingId, 10)] = {
                    name: name,
                    quantity: parseInt(qty, 10) || 0
                };
            }
        }

        if (typeof done === "function") done();
    }, "GET", null, token);
}

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
        if (typeof done === "function") done();
    }, "GET", null, null);
}

function loadRequirementsForRecipe(recipe, doneOne) {
    fetchMethod(currentUrl + "/api/recipes/" + recipe.id + "/requirements", function (status, res) {
        var reqs = [];
        if (status === 200) {
            if (Array.isArray(res)) reqs = res;
            else if (Array.isArray(res.data)) reqs = res.data;
            else if (Array.isArray(res.results)) reqs = res.results;
        }
        recipe.requirements = reqs;
        if (typeof doneOne === "function") doneOne();
    }, "GET", null, null);
}

function loadAllRequirements(done) {
    var remaining = recipesList.length;
    if (remaining === 0) { if (typeof done === "function") done(); return; }

    function oneDone() {
        remaining--;
        if (remaining === 0 && typeof done === "function") done();
    }

    for (var i = 0; i < recipesList.length; i++) {
        loadRequirementsForRecipe(recipesList[i], oneDone);
    }
}

function renderInventoryFromMap() {
    var grid = $("inventoryGrid");
    if (!grid) return;

    var keys = Object.keys(inventoryMap);
    var html = "";

    for (var i = 0; i < keys.length; i++) {
        var ingId = keys[i];
        var item = inventoryMap[ingId];

        if (item.quantity <= 0) continue;

        var icon = INGREDIENT_ICONS[item.name] || "ðŸ¥£";

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
        html += '  <div class="recipe-icon">ðŸ²</div>';
        html += '  <h3 class="recipe-name">' + String(r.name || "RECIPE").toUpperCase() + "</h3>";
        html += '  <p class="recipe-effect">' + (r.description || "") + "</p>";

        html += '  <div class="recipe-ingredients">';

        if (reqs.length === 0) {
            html += '<div class="recipe-ingredient missing"><span>âŒ</span><span>No requirements found</span></div>';
        } else {
            for (var j = 0; j < reqs.length; j++) {
                var req = reqs[j];

                var ingId = req.ingredient_id || req.ingredientId;
                var need = req.required_qty || req.requiredQty || 0;

                var reqName = req.name || req.ingredient_name || req.ingredientName || "Ingredient";
                var inv = inventoryMap[parseInt(ingId, 10)];
                var have = inv ? inv.quantity : 0;

                var icon = INGREDIENT_ICONS[reqName] || (inv ? (INGREDIENT_ICONS[inv.name] || "ðŸ¥£") : "ðŸ¥£");

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

        var inv = inventoryMap[parseInt(ingId, 10)];
        var have = inv ? inv.quantity : 0;

        if (have < need) return false;
    }
    return true;
}

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

    btn.textContent = "CRAFTED âœ“";
    btn.disabled = true;
    btn.classList.add("crafted-btn");
}

function craftRecipe(recipeId, buttonEl) {
    var token = getTokenOrRedirect();
    if (!token) return;

    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "CRAFTING...";
    }

    fetchMethod(currentUrl + "/api/me/recipes/" + recipeId + "/craft",
        function (status, res) {
            if (status === 201 || status === 200) {
                showStatusModal("success", (res && res.message) ? res.message : "Recipe crafted successfully!");

                loadAll();
                return;
            }

            if (status === 401 || status === 403) {
                showStatusModal("error", "Session expired. Please login again.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
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

document.addEventListener("DOMContentLoaded", function () {
    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not found. Ensure queryCmds.js loads before craft.js");
        return;
    }

    setupLogout();
    setupModalButtons();

    loadAll();
});
