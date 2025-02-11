const SHARED_PASSWORD = "secure123";
const DATA_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL"; // Replace with actual Google Apps Script URL

// Ensure the title remains correct
document.title = "Troop 444 2025 Summer Camp Merit Badge Selection Form";

// Declare meritBadgeList globally
let meritBadgeList = [];

// Function to get query parameter from URL
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Fetch scout data from Google Sheets
async function fetchScoutData() {
    const loginId = getQueryParam("id");
    try {
        const response = await fetch(`${DATA_URL}?id=${loginId}`);
        const data = await response.json();
        if (data.error) {
            console.error("Scout not found.");
            return null;
        }
        
        // Store available merit badges
        if (data.availableBadges) {
            meritBadgeList = data.availableBadges;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching scout data:", error);
        return null;
    }
}

// Initialize page logic
document.addEventListener("DOMContentLoaded", async () => {
    const loginId = getQueryParam("id");
    if (!loginId) {
        document.getElementById("container").innerHTML = "<p>Invalid or missing scout identifier.</p>";
        return;
    }

    const scout = await fetchScoutData();
    if (!scout) {
        document.getElementById("container").innerHTML = "<p>Scout not found.</p>";
        return;
    }

    document.getElementById("display-name").textContent = scout.name;

    function handleLogin() {
        const enteredPassword = document.getElementById("password").value;
        if (enteredPassword !== SHARED_PASSWORD) {
            document.getElementById("login-error").textContent = "Incorrect password. Please try again.";
            return;
        }

        document.getElementById("login-section").style.display = "none";
        document.getElementById("poll-section").style.display = "block";
        document.getElementById("display-name").textContent = scout.name;
        populateBadgeSelection(scout);
    }

    document.getElementById("login-btn").addEventListener("click", handleLogin);
    document.getElementById("password").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent accidental form submission
            handleLogin();
        }
    });

    // Populate Badge Selection
    populateBadgeSelection(scout);
});
