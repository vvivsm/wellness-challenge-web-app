function loadUserPoints() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const userId = getUserIdFromToken(token);
    if (!userId) return;

    const callback = (status, data) => {
        console.log("GET /api/users/:id status:", status);
        console.log("GET /api/users/:id data:", data);

        if (status === 200 && data) {
            // your sendResponse() might wrap in different ways
            // try common shapes:
            const user = data.data || data.user || data;

            if (user && typeof user.points !== "undefined") {
                document.getElementById("playerPoints").textContent = user.points;
            }
        }
    };

    fetchMethod(currentUrl + "/api/me", callback, "GET", null, token);
}

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = "notification " + type;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add("show"), 10);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updatePlayerPoints(newTotalPoints) {
    const pointsElement = document.getElementById("playerPoints");
    if (!pointsElement) return;

    if (typeof newTotalPoints === "number") {
        pointsElement.textContent = newTotalPoints;
    }
}

function addPlayerPoints(addPoints) {
    const pointsElement = document.getElementById("playerPoints");
    if (!pointsElement) return;

    const currentPoints = parseInt(pointsElement.textContent) || 0;
    pointsElement.textContent = currentPoints + addPoints;
}

function updateCompletedCount() {
    const completedElement = document.getElementById("completedToday");
    if (!completedElement) return;

    const currentCount = parseInt(completedElement.textContent) || 0;
    completedElement.textContent = currentCount + 1;
}

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

    // support common key names
    return payload.user_id || payload.id || payload.userId || payload.userid || payload.sub || null;
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
    const icon = getIconByType(ch.type);

    const div = document.createElement("div");
    div.className = "challenge-card";
    div.setAttribute("data-id", ch.id);

    const title = (ch.description || "CHALLENGE").toUpperCase();

    div.innerHTML =
        '<div class="challenge-header">' +
        '<div class="challenge-category cat-' + ch.type + '">' + ch.type.toUpperCase() + "</div>" +
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
    const ids = ["grid-sleep", "grid-physical", "grid-mental", "grid-social"];
    for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i]);
        if (el) el.innerHTML = "";
    }
}

function renderChallenges(challenges) {
    clearAllGrids();

    for (let i = 0; i < challenges.length; i++) {
        const ch = challenges[i];
        const gridId = getGridIdByType(ch.type);
        if (!gridId) continue;

        const grid = document.getElementById(gridId);
        if (!grid) continue;

        grid.appendChild(makeChallengeCard(ch));
    }
}

// ---------------- API calls ----------------
function loadChallenges() {
    const callback = (status, data) => {
        console.log("GET /api/challenges status:", status);
        console.log("GET /api/challenges data:", data);

        if (status === 200 && data) {
            // your backend returns: { message: "Success", data: [...] }
            const list = Array.isArray(data) ? data : (data.data || data.challenges || []);
            console.log("Rendering challenges count:", list.length);
            renderChallenges(list);

            const token = localStorage.getItem("token");
            const userId = token ? getUserIdFromToken(token) : null;
            if (userId) applyCompletionStateToUI(userId);
        } else {
            showNotification((data && data.message) ? data.message : "Failed to load challenges", "error");
        }
    };

    const token = localStorage.getItem("token");
    fetchMethod(currentUrl + "/api/challenges", callback, "GET", null, token);
}

// ---------------- Modal handling + completion ----------------
var completionModalInstance = null;
var pendingButton = null; // the button user clicked (so we can update it after success)

function openCompletionModal(challengeId, button) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to complete challenges!");
        window.location.href = "login.html";
        return;
    }

    // store which challenge is being completed
    document.getElementById("completionChallengeId").value = challengeId;
    document.getElementById("completionDetails").value = "";

    pendingButton = button;

    const modalEl = document.getElementById("completionModal");
    completionModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    completionModalInstance.show();
}

function submitCompletion() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to complete challenges!");
        window.location.href = "login.html";
        return;
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
        alert("Invalid session. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    const challengeId = document.getElementById("completionChallengeId").value;
    const details = document.getElementById("completionDetails").value;

    if (!challengeId) {
        showNotification("Missing challenge id", "error");
        return;
    }

    // optionally require non-empty details:
    if (!details || details.trim().length === 0) {
        showNotification("Please enter some details.", "error");
        return;
    }

    // lock UI
    const submitBtn = document.getElementById("submitCompletion");
    submitBtn.disabled = true;
    submitBtn.textContent = "SUBMITTING...";

    if (pendingButton) {
        pendingButton.disabled = true;
        pendingButton.textContent = "COMPLETING...";
    }

    const postData = {
        user_id: userId,
        details: details
    };

    const callback = (status, data) => {
        console.log("POST /api/challenges/:id status:", status);
        console.log("POST /api/challenges/:id data:", data);

        // unlock submit button
        submitBtn.disabled = false;
        submitBtn.textContent = "SUBMIT";

        if (status === 201 || status === 200) {
            // close modal
            if (completionModalInstance) completionModalInstance.hide();

            // show success modal
            openSuccessModal("You earned +" + getPointsFromCard(pendingButton) + " points!");

            if (pendingButton) {
                const card = pendingButton.closest(".challenge-card");
                if (card) card.classList.add("completed");

                pendingButton.textContent = "COMPLETED ✓";
                pendingButton.classList.remove("start-btn");
                pendingButton.classList.add("completed-btn");
                pendingButton.disabled = true;
            }

            const pts = getPointsFromCard(pendingButton || button);
            addPlayerPoints(pts);
            // points update (depending on your backend response)
            if (data && typeof data.total_points === "number") {
                updatePlayerPoints(data.total_points);
            } else if (data && typeof data.points_awarded === "number") {
                addPlayerPoints(data.points_awarded);
            }

            updateCompletedCount();
            recordCompletion(userId, challengeId);
            applyCompletionStateToUI(userId);
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

function getPointsFromCard(button) {
    const card = button.closest(".challenge-card");
    if (!card) return 0;

    const rewardEl = card.querySelector(".reward-value");
    if (!rewardEl) return 0;

    const text = rewardEl.textContent;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

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
    if (!raw) {
        return { completedCount: 0, completedIds: [] };
    }

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

function saveCompletionState(userId, state) {
    const key = getCompletionStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
}

function applyCompletionStateToUI(userId) {
    const state = loadCompletionState(userId);

    // set completed count
    const completedEl = document.getElementById("completedToday");
    if (completedEl) {
        completedEl.textContent = state.completedCount;
    }

    // mark completed buttons
    for (let i = 0; i < state.completedIds.length; i++) {
        const id = state.completedIds[i];
        const card = document.querySelector('.challenge-card[data-id="' + id + '"]');
        if (!card) continue;

        card.classList.add("completed");

        const btn = card.querySelector(".challenge-btn");
        if (!btn) continue;

        btn.textContent = "COMPLETED ✓";
        btn.classList.remove("start-btn");
        btn.classList.add("completed-btn");
        btn.disabled = true;
    }
}

function recordCompletion(userId, challengeId) {
    const state = loadCompletionState(userId);
    const cid = parseInt(challengeId);

    // only add if not already completed
    if (state.completedIds.indexOf(cid) === -1) {
        state.completedIds.push(cid);
        state.completedCount = state.completedCount + 1;
        saveCompletionState(userId, state);
    }
}

function setCreateChallengeError(msg) {
    const el = document.getElementById("createChallengeError");
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
    const gridId = getGridIdByType(ch.type);
    if (!gridId) return;

    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.appendChild(makeChallengeCard(ch));
}

const MAX_CHALLENGE_POINTS = 20;
function createChallenge() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to create challenges!");
        window.location.href = "login.html";
        return;
    }

    setCreateChallengeError("");

    const descEl = document.getElementById("newChallengeDesc");
    const ptsEl = document.getElementById("newChallengePoints");
    const typeEl = document.getElementById("newChallengeType");
    const btnEl = document.getElementById("createChallengeBtn");

    if (!descEl || !ptsEl || !typeEl || !btnEl) return;

    const description = (descEl.value || "").trim();
    const points = parseInt(ptsEl.value, 10);
    const type = typeEl.value;

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

    const postData = {
        description: description,
        points: points,
        type: type
    };

    const callback = (status, data) => {
        console.log("POST /api/challenges status:", status);
        console.log("POST /api/challenges data:", data);

        // unlock UI
        btnEl.disabled = false;
        btnEl.textContent = "CREATE CHALLENGE";

        if (status === 201 && data) {
            const created = data.data || data.challenge || data;

            if (!created || typeof created.id === "undefined") {
                showNotification("Created, but response shape is unexpected.", "error");
                return;
            }

            // add to UI immediately
            appendChallengeToUI(created);

            // reset form
            descEl.value = "";
            ptsEl.value = 5;
            typeEl.value = "sleep";

            openSuccessModal("Challenge created successfully!");
            showNotification("Challenge created!", "success");
            return;
        }

        // show server-side error
        const msg = (data && data.message) ? data.message : "Failed to create challenge";
        setCreateChallengeError(msg);
        showNotification(msg, "error");
    };

    fetchMethod(currentUrl + "/api/challenges", callback, "POST", postData, token);
}

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

    loadChallenges();
    loadUserPoints();

    // Submit button inside modal
    const submitBtn = document.getElementById("submitCompletion");
    if (submitBtn) {
        submitBtn.addEventListener("click", function () {
            submitCompletion();
        });
    }

    // Event delegation for COMPLETE buttons
    document.body.addEventListener("click", function (e) {
        const btn = e.target;
        if (!btn.classList) return;
        if (!btn.classList.contains("challenge-btn")) return;

        if (btn.classList.contains("completed-btn")) return;

        const card = btn.closest(".challenge-card");
        const challengeId = card ? card.getAttribute("data-id") : null;
        if (!challengeId) return;

        openCompletionModal(challengeId, btn);
    });

    // Create Challenge form
    const createForm = document.getElementById("createChallengeForm");
    if (createForm) {
        createForm.addEventListener("submit", function (e) {
            e.preventDefault();
            createChallenge();
        });
    }
});