// ---------------- UI helpers ----------------
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

// ---------------- Auth helpers ----------------
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
        '<p class="challenge-description">' + (ch.description || "") + "</p>" +
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
        } else {
            showNotification((data && data.message) ? data.message : "Failed to load challenges", "error");
        }
    };

    fetchMethod(currentUrl + "/api/challenges", callback, "GET", null, null);
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

            if (pendingButton) {
                const card = pendingButton.closest(".challenge-card");
                if (card) card.classList.add("completed");

                pendingButton.textContent = "COMPLETED ✓";
                pendingButton.classList.remove("start-btn");
                pendingButton.classList.add("completed-btn");
                pendingButton.disabled = true;
            }

            // points update (depending on your backend response)
            if (data && typeof data.total_points === "number") {
                updatePlayerPoints(data.total_points);
            } else if (data && typeof data.points_awarded === "number") {
                addPlayerPoints(data.points_awarded);
            }

            updateCompletedCount();
            showNotification("Challenge completed!", "success");
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

// ---------------- Events ----------------
document.addEventListener("DOMContentLoaded", function () {
    console.log("Challenges page loaded!");

    if (typeof fetchMethod !== "function") {
        console.error("fetchMethod not loaded. Make sure queryCmds.js is included before challenges.js");
        return;
    }

    loadChallenges();

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
});