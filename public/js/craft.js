// ------------------------------
// Helpers
// ------------------------------

// Shorthand helper: get an element by its id (saves typing document.getElementById everywhere)
function $(id) {
    return document.getElementById(id);
}

// Reads token from localStorage
// - if missing, alerts user and redirects to login
// - returns token string or null
function getTokenOrRedirect() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return null;
    }
    return token;
}

// Loads current user from backend using token
// - If token invalid/expired, redirects to login
// - done(status, user)
function loadMe(done) {
    var token = getTokenOrRedirect();
    if (!token) return;

    fetchMethod(currentUrl + "/api/me", function (status, data) {
        if (status === 200 && data) {
            var user = data.data || data.user || data;
            if (typeof done === "function") done(200, user);
            return;
        }

        // If session invalid, force relogin
        if (status === 401 || status === 403) {
            showStatusModal("error", "Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Other failures: still block page because we can’t load user context safely
        showStatusModal("error", "Failed to verify session (HTTP " + status + ").");
        if (typeof done === "function") done(status, null);
    }, "GET", null, token);
}

// Wires up the logout button:
// - clears the JWT token from localStorage
// - redirects user back to login page
function setupLogout() {
    var btn = $("logoutBtn"); // find logout button
    if (!btn) return; // if not on this page, do nothing

    btn.addEventListener("click", function (e) {
        e.preventDefault(); // stop default link/button behavior
        localStorage.removeItem("token"); // remove saved login token (logs user out)
        window.location.href = "login.html"; // send user to login page
    });
}

// Shows a custom status modal (success or error) with a message:
// - updates title text (SUCCESS / FAILED)
// - toggles the "error" class for styling
// - displays the modal by adding the "show" class
function showStatusModal(type, message) {
    var modal = $("statusModal");       // outer modal overlay
    var box = $("statusModalBox");      // modal content box
    var title = $("statusTitle");       // title element inside modal
    var msg = $("statusMessage");       // message element inside modal

    if (!modal || !box || !title || !msg) return; // safety check for missing elements

    box.classList.remove("error"); // reset any previous "error" styling

    // If it's an error, show FAILED and add error styling; otherwise show SUCCESS
    if (type === "error") {
        title.textContent = "FAILED";
        box.classList.add("error");
    } else {
        title.textContent = "SUCCESS";
    }

    // Set message text (fallback to empty string)
    msg.textContent = message || "";
    // Make modal visible
    modal.classList.add("show");
}

// Hides the status modal by removing the "show" class
function hideStatusModal() {
    var modal = $("statusModal");
    if (modal) modal.classList.remove("show");
}

// Connects the modal buttons and overlay behavior:
// - OK button closes modal
// - X/close button closes modal
// - clicking outside the modal box (on the overlay) closes modal
function setupModalButtons() {
    var ok = $("statusOkBtn");       // OK button
    var close = $("statusCloseBtn"); // Close/X button
    var modal = $("statusModal");    // overlay

    if (ok) ok.addEventListener("click", hideStatusModal);
    if (close) close.addEventListener("click", hideStatusModal);

    // Click-to-close when user clicks on the overlay background (not the inner content)
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) hideStatusModal();
        });
    }
}


// ------------------------------
// Icons (visual only)
// ------------------------------

// Maps ingredient names to emojis for nicer UI display
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
// State
// ------------------------------

// Stores inventory in a convenient lookup form:
// key = ingredient_id, value = { name, quantity }
var inventoryMap = {}; // ingredient_id -> { name, quantity }

// Stores recipes returned by backend
// Each recipe later gets a .requirements array attached
var recipesList = [];  // recipe rows with .requirements attached


// ------------------------------
// Load everything
// ------------------------------

// Main "page loader" function that loads everything in order:
// 1) verify session (GET /api/me)
// 2) inventory
// 3) recipes
// 4) each recipe's requirements
// 5) crafted recipes list (to lock crafted buttons)
// Then renders inventory + recipes, binds buttons, applies crafted states
function loadAll() {
    var token = getTokenOrRedirect(); // ensure user is logged in
    if (!token) return;

    // First verify session with backend (CA2-safe: do NOT decode token on frontend)
    loadMe(function (status, user) {
        if (status !== 200 || !user) return;

        // Nested callbacks ensure correct sequence:
        // need inventory + recipes + requirements + crafted list before rendering fully
        loadInventory(token, function () {
            loadRecipes(function () {
                loadAllRequirements(function () {
                    loadCraftedRecipes(token, function (craftedList) {
                        // Now that data is ready, render UI
                        renderInventoryFromMap();
                        bindSellButtons();
                        renderRecipes();

                        // After recipes render, mark crafted recipes so user can't craft again
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

// Loads list of recipes the user has already crafted:
// - used to disable craft button and show "CRAFTED ✓"
function loadCraftedRecipes(token, done) {
    fetchMethod(currentUrl + "/api/me/crafted", function (status, res) {
        if (status !== 200) {
            // just continue, don't block page if crafted list fails
            if (typeof done === "function") done([]);
            return;
        }

        // Normalize response shape into an array
        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        if (typeof done === "function") done(list); // [{recipe_id:1}, ...]
    }, "GET", null, token);
}

// GET /api/me/inventory
// Loads inventory from backend and converts it into inventoryMap for fast lookup
function loadInventory(token, done) {
    fetchMethod(currentUrl + "/api/me/inventory", function (status, res) {
        if (status !== 200) {
            // Show error modal and stop loading (no done() call here)
            showStatusModal("error", (res && res.message) ? res.message : "Failed to load inventory.");
            return;
        }

        // Normalize response into an array
        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        // Reset map then build it from list rows
        inventoryMap = {};
        for (var i = 0; i < list.length; i++) {
            var row = list[i];

            // depends on your SQL join; handle common shapes:
            var ingId = row.ingredient_id || row.ingredientId || row.id;
            var qty = row.quantity || row.qty || 0;
            var name = row.name || row.ingredient_name || row.ingredientName || "Ingredient";

            // Only store if an id exists
            if (ingId !== undefined && ingId !== null) {
                inventoryMap[parseInt(ingId, 10)] = {
                    name: name,
                    quantity: parseInt(qty, 10) || 0
                };
            }
        }

        // Signal "inventory done" so next step can continue
        if (typeof done === "function") done();
    }, "GET", null, token);
}

// GET /api/recipes
// Loads recipes list from backend into recipesList
function loadRecipes(done) {
    fetchMethod(currentUrl + "/api/recipes", function (status, res) {
        if (status !== 200) {
            // Show error modal and stop loading
            showStatusModal("error", (res && res.message) ? res.message : "Failed to load recipes.");
            return;
        }

        // Normalize response into an array
        var list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.results)) list = res.results;

        // Save list for later rendering and requirements fetching
        recipesList = list;
        if (typeof done === "function") done();
    }, "GET", null, null);
}

// Helper to fetch requirements for ONE recipe (avoids IIFE usage)
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

// GET /api/recipes/:recipe_id/requirements for ALL recipes
// Fetches each recipe's requirements and attaches them to recipe.requirements
function loadAllRequirements(done) {
    var remaining = recipesList.length;
    if (remaining === 0) { if (typeof done === "function") done(); return; }

    function oneDone() {
        remaining--;
        if (remaining === 0 && typeof done === "function") done();
    }

    // Loop recipes and fetch requirements for each (no IIFE needed)
    for (var i = 0; i < recipesList.length; i++) {
        loadRequirementsForRecipe(recipesList[i], oneDone);
    }
}


// ------------------------------
// Render Inventory
// ------------------------------

// Builds inventory UI from inventoryMap and inserts it into #inventoryGrid
// - skips items with quantity <= 0
// - adds SELL buttons with data-ingredient-id
function renderInventoryFromMap() {
    var grid = $("inventoryGrid");
    if (!grid) return;

    var keys = Object.keys(inventoryMap); // list of ingredient ids in the map
    var html = "";

    for (var i = 0; i < keys.length; i++) {
        var ingId = keys[i];
        var item = inventoryMap[ingId];

        // Don't show items that are zero
        if (item.quantity <= 0) continue;

        // Pick icon based on ingredient name; default to bowl emoji
        var icon = INGREDIENT_ICONS[item.name] || "🥣";

        // Template literal creates each inventory "card"
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

    // Insert all inventory items at once for efficiency
    grid.innerHTML = html;
}

// Attaches a single click listener to inventoryGrid (event delegation)
// - prevents binding multiple times using grid.dataset.sellBound
function bindSellButtons() {
    var grid = $("inventoryGrid");
    if (!grid) return;

    // If already bound once, do not bind again
    if (grid.dataset.sellBound === "true") return;
    grid.dataset.sellBound = "true";

    // Listen for clicks on sell buttons inside the grid
    grid.addEventListener("click", function (e) {
        var btn = e.target;
        if (!btn.classList.contains("sell-btn")) return;

        var ingredientId = btn.getAttribute("data-ingredient-id");
        if (!ingredientId) return;

        // Call delete endpoint to sell/remove the ingredient
        sellIngredient(ingredientId, btn);
    });
}

// Sells (deletes) an ingredient from inventory through the backend
// - disables button while request runs
// - on success: shows modal and reloads everything (inventory + recipes updated)
function sellIngredient(ingredientId, buttonEl) {
    var token = getTokenOrRedirect();
    if (!token) return;

    // lock UI
    buttonEl.disabled = true;
    buttonEl.textContent = "SELLING...";

    fetchMethod(
        currentUrl + "/api/me/inventory/" + ingredientId,
        function (status, res) {
            if (status === 200) {
                // show success modal
                showStatusModal(
                    "success",
                    res && res.message ? res.message : "Ingredient sold!"
                );

                // Refresh inventory + recipes after selling
                loadAll();
                return;
            }

            // unlock button if failed
            buttonEl.disabled = false;
            buttonEl.textContent = "SELL";

            // show error modal
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

// Renders all recipes into #recipesContainer
// - marks cards as locked/unlocked based on inventory requirements
// - shows each requirement with have vs need and missing styling
// - adds craft button with disabled state when not enough ingredients
function renderRecipes() {
    var container = $("recipesContainer");
    if (!container) return;

    // If no recipes loaded, show empty message
    if (!recipesList || recipesList.length === 0) {
        container.innerHTML = '<div class="recipes-empty">No recipes found.</div>';
        return;
    }

    var html = "";

    // Build HTML for each recipe card
    for (var i = 0; i < recipesList.length; i++) {
        var r = recipesList[i];
        var reqs = r.requirements || [];
        var canCraft = checkCanCraft(reqs); // determine if user has enough ingredients

        html += '<div class="recipe-card ' + (canCraft ? "unlocked" : "locked") + '">';
        html += '  <div class="recipe-icon">🍲</div>';
        html += '  <h3 class="recipe-name">' + String(r.name || "RECIPE").toUpperCase() + "</h3>";
        html += '  <p class="recipe-effect">' + (r.description || "") + "</p>";

        html += '  <div class="recipe-ingredients">';

        // If requirements missing, show a warning row
        if (reqs.length === 0) {
            html += '<div class="recipe-ingredient missing"><span>❌</span><span>No requirements found</span></div>';
        } else {
            // Render each required ingredient line
            for (var j = 0; j < reqs.length; j++) {
                var req = reqs[j];

                // Pull ingredient id and required quantity (support different key names)
                var ingId = req.ingredient_id || req.ingredientId;
                var need = req.required_qty || req.requiredQty || 0;

                // requirement route might JOIN ingredient name; handle both:
                var reqName = req.name || req.ingredient_name || req.ingredientName || "Ingredient";
                // Look up inventory for how many user has
                var inv = inventoryMap[parseInt(ingId, 10)];
                var have = inv ? inv.quantity : 0;

                // Pick icon using requirement name first; fall back to inventory name if needed
                var icon = INGREDIENT_ICONS[reqName] || (inv ? (INGREDIENT_ICONS[inv.name] || "🥣") : "🥣");

                // ok indicates whether user has enough of this ingredient
                var ok = have >= need;

                // Add CSS class "missing" when not enough ingredients
                html += '<div class="recipe-ingredient ' + (ok ? "" : "missing") + '">';
                html += '  <span>' + icon + "</span>";
                html += '  <span>' + String(reqName).toUpperCase() + "</span>";
                // Show need and current inventory count
                html += '  <span>x' + need + " (You: " + have + ")</span>";
                html += "</div>";
            }
        }

        html += "  </div>";

        // Craft button:
        // - disabled attribute when user can't craft
        // - text changes based on canCraft
        html += '  <button class="quick-craft-btn" data-recipe-id="' + r.id + '" ' + (canCraft ? "" : "disabled") + ">";
        html += canCraft ? "CRAFT" : "NOT ENOUGH";
        html += "  </button>";

        html += "</div>";
    }

    // Insert recipe cards and bind craft button click handler
    container.innerHTML = html;
    bindCraftButtons();
}

// Returns true if user has enough of every required ingredient
function checkCanCraft(reqs) {
    if (!reqs || reqs.length === 0) return false;

    for (var i = 0; i < reqs.length; i++) {
        var ingId = reqs[i].ingredient_id || reqs[i].ingredientId;
        var need = reqs[i].required_qty || reqs[i].requiredQty || 0;

        // Look up current inventory quantity
        var inv = inventoryMap[parseInt(ingId, 10)];
        var have = inv ? inv.quantity : 0;

        // If any requirement not met, cannot craft
        if (have < need) return false;
    }
    // All requirements met
    return true;
}


// ------------------------------
// Craft button events
// ------------------------------

// Binds one click handler to #recipesContainer (event delegation)
// - prevents double-binding using container.dataset.bound
// - when a craft button is clicked, calls craftRecipe()
function bindCraftButtons() {
    var container = $("recipesContainer");
    if (!container) return;

    // Prevent binding multiple times on re-render
    if (container.dataset.bound === "true") return;
    container.dataset.bound = "true";

    container.addEventListener("click", function (e) {
        var btn = e.target;
        if (!btn) return;

        // Only proceed if the clicked element has a recipe id attribute
        var recipeId = btn.getAttribute("data-recipe-id");
        if (!recipeId) return;

        // If button is disabled, ignore click
        if (btn.disabled) return;

        // Attempt crafting this recipe
        craftRecipe(recipeId, btn);
    });
}

// Updates a specific recipe craft button to show crafted state
// - disables it so it can't be crafted again
// - adds CSS class for styling
function markRecipeAsCrafted(recipeId) {
    var btn = document.querySelector('.quick-craft-btn[data-recipe-id="' + recipeId + '"]');
    if (!btn) return;

    btn.textContent = "CRAFTED ✓";
    btn.disabled = true;
    btn.classList.add("crafted-btn");
}

// Sends craft request to backend:
// - requires login (token exists)
// - disables button while request runs
// - on success: shows success modal and reloads all data so inventory updates
// NOTE: CA2-safe: does NOT decode token or include user_id anywhere
function craftRecipe(recipeId, buttonEl) {
    var token = getTokenOrRedirect();
    if (!token) return;

    // lock craft button UI
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = "CRAFTING...";
    }

    // POST craft request (backend will deduct ingredients + mark recipe crafted)
    fetchMethod(currentUrl + "/api/me/recipes/" + recipeId + "/craft",
        function (status, res) {
            if (status === 201 || status === 200) {
                // success message
                showStatusModal("success", (res && res.message) ? res.message : "Recipe crafted successfully!");

                // Refresh everything so inventory + buttons update
                loadAll();
                return;
            }

            // If session expired, force relogin
            if (status === 401 || status === 403) {
                showStatusModal("error", "Session expired. Please login again.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            // unlock button if failed
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.textContent = "CRAFT";
            }

            // show error message
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

// Runs after the HTML is loaded
// - checks that fetchMethod exists (your shared request helper)
// - sets up logout and modal buttons
// - triggers loadAll() to fetch + render inventory/recipes
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
