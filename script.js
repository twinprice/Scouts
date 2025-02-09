const SHARED_PASSWORD = "secure123";
const DATA_URL = "https://twinprice.github.io/Scouts/scouts_v2.json";  // URL to your JSON file

// Function to get query parameter from URL
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Fetch scout data from JSON file
async function fetchScoutData() {
    try {
        const response = await fetch(DATA_URL);
        const data = await response.json();
        return data.scouts;
    } catch (error) {
        console.error("Error fetching scout data:", error);
        return [];
    }
}

// Initialize page logic
document.addEventListener("DOMContentLoaded", async () => {
    const loginId = getQueryParam("id");
    if (!loginId) {
        document.getElementById("container").innerHTML = "<p>Invalid or missing scout identifier.</p>";
        return;
    }

    const scouts = await fetchScoutData();
    const scout = scouts.find(s => s.login_id === loginId);

    if (!scout) {
        document.getElementById("container").innerHTML = "<p>Scout not found.</p>";
        return;
    }

    document.getElementById("scout-name").textContent = `Scout: ${scout.name}`;

    document.getElementById("login-btn").addEventListener("click", () => {
        const enteredPassword = document.getElementById("password").value;
        if (enteredPassword !== SHARED_PASSWORD) {
            document.getElementById("login-error").textContent = "Incorrect password. Please try again.";
            return;
        }

        document.getElementById("login-section").style.display = "none";
        document.getElementById("poll-section").style.display = "block";
        document.getElementById("display-name").textContent = scout.name;

        populateAchievements(scout);
        populateBadgeSelection(scout);
    });
});

// Populate earned merit badges (hide for first-year scouts)
function populateAchievements(scout) {
    const achievementsSection = document.getElementById("achievements-section");
    const achievementsDiv = document.getElementById("achievements");
    if (scout.year === "1st") {
        achievementsSection.style.display = "none";
        achievementsDiv.style.display = "none";
        return;
    }
    achievementsDiv.innerHTML = scout.earned.length > 0 ? scout.earned.join(", ") : "None";
}

// Populate merit badge selection
function populateBadgeSelection(scout) {
    const badgeSelectionDiv = document.getElementById("badge-selection");
    badgeSelectionDiv.innerHTML = "";

    if (scout.year === "1st") {
        badgeSelectionDiv.innerHTML = `
            <h3>Required Merit Badges:</h3>
            <ul>
                <li>${scout.required.join("</li><li>")}</li>
            </ul>
            <h3>Choose One:</h3>
            <input type="radio" name="optionalBadge" value="${scout.optional[0]}"> ${scout.optional[0]}<br>
            <input type="radio" name="optionalBadge" value="${scout.optional[1]}"> ${scout.optional[1]}
        `;
    } else {
        badgeSelectionDiv.innerHTML = "<h3>Select 4 Merit Badges:</h3>";
        for (let i = 0; i < 4; i++) {
            const select = document.createElement("select");
            select.name = `badge${i+1}`;
            const defaultOption = document.createElement("option");
            defaultOption.textContent = `Select ${i+1}st Merit Badge`;
            defaultOption.value = "";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            scout.available.forEach(badge => {
                const option = document.createElement("option");
                option.value = badge;
                option.textContent = badge;
                select.appendChild(option);
            });
            badgeSelectionDiv.appendChild(select);
            badgeSelectionDiv.appendChild(document.createElement("br"));
        }
    }
}
