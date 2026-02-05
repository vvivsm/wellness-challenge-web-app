// ---------------- Shared state ----------------
var currentUserId = null;        // filled from GET /api/me
var completionModalInstance = null;
var pendingButton = null;        // the COMPLETE button user clicked


// ---------------- Notifications ----------------
function showNotification(message, type) {
    var notification = document.createElement("div");
    notification.className = "notification " + type;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(function () {
        notification.classList.add("show");
    }, 10);

    setTimeout(function () {
        notification.classList.remove("show");
        setTimeout(function () {
            notification.remove();
        }, 300);
    }, 3000);
}


// ---------------- User helpers ----------------
function getTokenOrNull() {
    return localStorage.getItem("token");
}

// GET /api/me (uses token) to retrieve current user's id/points/username
function loadMe(done) {
    var token = getTokenOrNull();
    if (!token) {
        currentUserId = null;
        if (typeof done === "function") done(null, null);
        return;
    }

    fetchMethod(currentUrl + "/api/me", function (status, data) {
        if (status !== 200 || !data) {
            currentUserId = null;
            if (typeof done === "function") done(status, null);
            return;
        }

        // Normalize response shape
        var user = data.data || data.user || data;

        // Try common id fields (backend dependent)
        var id = null;
        if (user) id = user.id || user.user_id || user.userId || null;

        currentUserId = id;

        if (typeof done === "function") done(200, user);
    }, "GET", null, token);
}

// Loads points from /api/me and updates #playerPoints
function loadUserPoints() {
    loadMe(function (status, user) {
        if (status !== 200 || !user) return;

        if (typeof user.points !== "undefined") {
            var el = document.getElementById("playerPoints");
            if (el) el.textContent = user.points;
        }
    });
}


// ---------------- UI counters ----------------
function updatePlayerPoints(newTotalPoints) {
    var pointsElement = document.getElementById("playerPoints");
    if (!pointsElement) return;

    if (typeof newTotalPoints === "number") {
        pointsElement.textContent = newTotalPoints;
    }
}

function addPlayerPoints(addPoints) {
    var pointsElement = document.getElementById("playerPoints");
    if (!pointsElement) return;

    var currentPoints = parseInt(pointsElement.textContent, 10) || 0;
    pointsElement.textContent = currentPoints + addPoints;
}

function updateCompletedCount() {
    var completedElement = document.getElementById("completedToday");
    if (!completedElement) return;

    var currentCount = parseInt(completedElement.textContent, 10) || 0;
    completedElement.textContent = currentCount + 1;
}


// ---------------- Render helpers ----------------
function getGridIdByType(type) {
    if (type === "sleep") return "grid-sleep";
    if (type === "physical") return "grid-physical";
    if (type === "mental") return "grid-mental";
    if (type === "social") return "grid-social";
    return null;
}

function getIconByType(type) {
    if (type === "sleep") return "🌙";
    if (type === "physical") return "💪";
    if (type === "mental") return "🧠";
    if (type === "social") return "💬";
    return "⭐";
}

function makeChallengeCard(ch) {
    var icon = getIconByType(ch.type);

    var div = document.createElement("div");
    div.className = "challenge-card";
    div.setAttribute("data-id", ch.id);

    var title = (ch.description || "CHALLENGE").toUpperCase();

    div.innerHTML =
        '<div class="challenge-header">' +
        '<div class="challenge-category cat-' + ch.type + '">' + String(ch.type).toUpperCase() + "</div>" +
        "</div>" +
        '<div class="challenge-icon">' + icon + "</div>" +
        '<h3 class="challenge-title">' + title + "</h3>" +
        '<div class="challenge-reward">' +
        '<span class="reward-icon">💰</span>' +
        '<span class="reward-value">+' + ch.points + " POINTS</span>" +
        "</div>" +
        '<button class="challenge-btn start-btn">COMPLETE</button>';

    return div;
}

function clearAllGrids() {
    var ids = ["grid-sleep", "grid-physical", "grid-mental", "grid-social"];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.innerHTML = "";
    }
}

function renderChallenges(challenges) {
    clearAllGrids();

    for (var i = 0; i < challenges.length; i++) {
        var ch = challenges[i];
        var gridId = getGridIdByType(ch.type);
        if (!gridId) continue;

        var grid = document.getElementById(gridId);
        if (!grid) continue;

        grid.appendChild(makeChallengeCard(ch));
    }
}


// ---------------- Completion state ----------------
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

    if (!raw) {
        return { completedCount: 0, completedIds: [] };
    }

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

function saveCompletionState(userId, state) {
    var key = getCompletionStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
}

function applyCompletionStateToUI(userId) {
    if (!userId) return;

    var state = loadCompletionState(userId);

    // set completed count
    var completedEl = document.getElementById("completedToday");
    if (completedEl) {
        completedEl.textContent = state.completedCount;
    }

    // mark completed buttons
    for (var i = 0; i < state.completedIds.length; i++) {
        var id = state.completedIds[i];
        var card = document.querySelector('.challenge-card[data-id="' + id + '"]');
        if (!card) continue;

        card.classList.add("completed");

        var btn = card.querySelector(".challenge-btn");
        if (!btn) continue;

        btn.textContent = "COMPLETED ✓";
        btn.classList.remove("start-btn");
        btn.classList.add("completed-btn");
        btn.disabled = true;
    }
}

function recordCompletion(userId, challengeId) {
    if (!userId) return;

    var state = loadCompletionState(userId);
    var cid = parseInt(challengeId, 10);

    // only add if not already completed
    if (state.completedIds.indexOf(cid) === -1) {
        state.completedIds.push(cid);
        state.completedCount = state.completedCount + 1;
        saveCompletionState(userId, state);
    }
}


// ---------------- API calls ----------------
function loadChallenges() {
    var token = getTokenOrNull();

    var callback = function (status, data) {
        console.log("GET /api/challenges status:", status);
        console.log("GET /api/challenges data:", data);

        if (status === 200 && data) {
            // backend may return array or wrap in { data: [...] }
            var list = Array.isArray(data) ? data : (data.data || data.challenges || []);
            renderChallenges(list);

            // After rendering, apply completion state if we know the user
            if (currentUserId) {
                applyCompletionStateToUI(currentUserId);
            } else {
                // If not yet known, fetch /api/me then apply
                loadMe(function () {
                    if (currentUserId) applyCompletionStateToUI(currentUserId);
                });
            }
        } else {
            showNotification((data && data.message) ? data.message : "Failed to load challenges", "error");
        }
    };

    fetchMethod(currentUrl + "/api/challenges", callback, "GET", null, token);
}


// ---------------- Modal handling + completion ----------------
function openCompletionModal(challengeId, button) {
    var token = getTokenOrNull();
    if (!token) {
        alert("Please login to complete challenges!");
        window.location.href = "login.html";
        return;
    }

    // store which challenge is being completed
    var idEl = document.getElementById("completionChallengeId");
    var detailsEl = document.getElementById("completionDetails");
    if (idEl) idEl.value = challengeId;
    if (detailsEl) detailsEl.value = "";

    pendingButton = button;

    var modalEl = document.getElementById("completionModal");
    completionModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    completionModalInstance.show();
}

function getPointsFromCard(button) {
    if (!button) return 0;

    var card = button.closest(".challenge-card");
    if (!card) return 0;

    var rewardEl = card.querySelector(".reward-value");
    if (!rewardEl) return 0;

    var text = rewardEl.textContent;
    var match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function submitCompletion() {
    var token = getTokenOrNull();
    if (!token) {
        alert("Please login to complete challenges!");
        window.location.href = "login.html";
        return;
    }

    var challengeIdEl = document.getElementById("completionChallengeId");
    var detailsEl = document.getElementById("completionDetails");

    var challengeId = challengeIdEl ? challengeIdEl.value : null;
    var details = detailsEl ? detailsEl.value : "";

    if (!challengeId) {
        showNotification("Missing challenge id", "error");
        return;
    }

    // require non-empty details
    if (!details || String(details).trim().length === 0) {
        showNotification("Please enter some details.", "error");
        return;
    }

    // lock UI
    var submitBtn = document.getElementById("submitCompletion");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "SUBMITTING...";
    }

    if (pendingButton) {
        pendingButton.disabled = true;
        pendingButton.textContent = "COMPLETING...";
    }

    var postData = {
        details: details
    };

    var callback = function (status, data) {
        console.log("POST /api/challenges/:id status:", status);
        console.log("POST /api/challenges/:id data:", data);

        // unlock submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "SUBMIT";
        }

        if (status === 201 || status === 200) {
            // close modal
            if (completionModalInstance) completionModalInstance.hide();

            // success message (use points from UI card)
            var pts = getPointsFromCard(pendingButton);
            openSuccessModal("You earned +" + pts + " points!");

            // mark card/button as completed
            if (pendingButton) {
                var card = pendingButton.closest(".challenge-card");
                if (card) card.classList.add("completed");

                pendingButton.textContent = "COMPLETED ✓";
                pendingButton.classList.remove("start-btn");
                pendingButton.classList.add("completed-btn");
                pendingButton.disabled = true;
            }

            // Update points display:
            // - Prefer server truth if provided, else add the points shown on the card
            if (data && typeof data.total_points === "number") {
                updatePlayerPoints(data.total_points);
            } else if (data && typeof data.points_awarded === "number") {
                addPlayerPoints(data.points_awarded);
            } else {
                addPlayerPoints(pts);
            }

            // Update completed count UI and localStorage state
            // Ensure we have currentUserId (fetch /api/me if needed)
            updateCompletedCount();

            if (currentUserId) {
                recordCompletion(currentUserId, challengeId);
                applyCompletionStateToUI(currentUserId);
            } else {
                loadMe(function () {
                    if (currentUserId) {
                        recordCompletion(currentUserId, challengeId);
                        applyCompletionStateToUI(currentUserId);
                    }
                });
            }

            return;
        }

        // fail
        if (pendingButton) {
            pendingButton.disabled = false;
            pendingButton.textContent = "COMPLETE";
        }

        showNotification((data && data.message) ? data.message : "Failed to complete", "error");
    };

    fetchMethod(currentUrl + "/api/challenges/" + challengeId, callback, "POST", postData, token);
}


// ---------------- Create Challenge ----------------
function setCreateChallengeError(msg) {
    var el = document.getElementById("createChallengeError");
    if (!el) return;

    if (!msg) {
        el.style.display = "none";
        el.textContent = "";
        return;
    }

    el.textContent = msg;
    el.style.display = "block";
}

function appendChallengeToUI(ch) {
    var gridId = getGridIdByType(ch.type);
    if (!gridId) return;

    var grid = document.getElementById(gridId);
    if (!grid) return;

    grid.appendChild(makeChallengeCard(ch));
}

var MAX_CHALLENGE_POINTS = 20;

function createChallenge() {
    var token = getTokenOrNull();
    if (!token) {
        alert("Please login to create challenges!");
        window.location.href = "login.html";
        return;
    }

    setCreateChallengeError("");

    var descEl = document.getElementById("newChallengeDesc");
    var ptsEl = document.getElementById("newChallengePoints");
    var typeEl = document.getElementById("newChallengeType");
    var btnEl = document.getElementById("createChallengeBtn");

    if (!descEl || !ptsEl || !typeEl || !btnEl) return;

    var description = String(descEl.value || "").trim();
    var points = parseInt(ptsEl.value, 10);
    var type = typeEl.value;

    if (!description) {
        setCreateChallengeError("Please enter a description.");
        return;
    }

    if (isNaN(points) || points < 1) {
        setCreateChallengeError("Points must be at least 1.");
        return;
    }

    if (points > MAX_CHALLENGE_POINTS) {
        setCreateChallengeError("Maximum points allowed is " + MAX_CHALLENGE_POINTS + ".");
        return;
    }

    // lock UI
    btnEl.disabled = true;
    btnEl.textContent = "CREATING...";

    var postData = {
        description: description,
        points: points,
        type: type
    };

    var callback = function (status, data) {
        console.log("POST /api/challenges status:", status);
        console.log("POST /api/challenges data:", data);

        // unlock UI
        btnEl.disabled = false;
        btnEl.textContent = "CREATE CHALLENGE";

        if (status === 201 && data) {
            var created = data.data || data.challenge || data;

            if (!created || typeof created.id === "undefined") {
                showNotification("Created, but response shape is unexpected.", "error");
                return;
            }

            appendChallengeToUI(created);

            // reset form
            descEl.value = "";
            ptsEl.value = 5;
            typeEl.value = "sleep";

            openSuccessModal("Challenge created successfully!");
            showNotification("Challenge created!", "success");
            return;
        }

        var msg = (data && data.message) ? data.message : "Failed to create challenge";
        setCreateChallengeError(msg);
        showNotification(msg, "error");
    };

    fetchMethod(currentUrl + "/api/challenges", callback, "POST", postData, token);
}


// ---------------- Success modal ----------------
function openSuccessModal(message) {
    var el = document.getElementById("successModal");
    var msgEl = document.getElementById("successModalMessage");
    if (!el) return;

    if (msgEl) msgEl.textContent = message;
    var inst = bootstrap.Modal.getOrCreateInstance(el);
    inst.show();
}


// ---------------- Events ----------------
document.addEventListener("DOMContentLoaded", function () {
    console.log("Challenges page loaded!");

    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not loaded. Make sure queryCmds.js is included before challenges.js");
        return;
    }

    // Load /api/me once so we have currentUserId for completion state key
    loadMe(function () {
        // Load the page data after user info is known (or null if not logged in)
        loadChallenges();
        loadUserPoints();

        if (currentUserId) applyCompletionStateToUI(currentUserId);
    });

    // Submit button inside modal
    var submitBtn = document.getElementById("submitCompletion");
    if (submitBtn) {
        submitBtn.addEventListener("click", function () {
            submitCompletion();
        });
    }

    // Event delegation for COMPLETE buttons
    document.body.addEventListener("click", function (e) {
        var btn = e.target;
        if (!btn || !btn.classList) return;
        if (!btn.classList.contains("challenge-btn")) return;

        // ignore already completed
        if (btn.classList.contains("completed-btn")) return;

        var card = btn.closest(".challenge-card");
        var challengeId = card ? card.getAttribute("data-id") : null;
        if (!challengeId) return;

        openCompletionModal(challengeId, btn);
    });

    // Create Challenge form
    var createForm = document.getElementById("createChallengeForm");
    if (createForm) {
        createForm.addEventListener("submit", function (e) {
            e.preventDefault();
            createChallenge();
        });
    }
});