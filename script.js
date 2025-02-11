const SHARED_PASSWORD = "secure123";
const DATA_URL = "https://script.google.com/macros/s/AKfycbwx0a_c24marw82303BN1Lm_LodvHjogUg959YpDn5-48DwZpkCOabL9_9D_jcHxPZF/exec"; // Replace with actual Google Apps Script URL

// Ensure the title remains correct
document.title = "Troop 444 2025 Summer Camp Merit Badge Selection Form";

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

    // Add Scout Camp Week Selection
    const weekSelectionDiv = document.createElement("div");
    weekSelectionDiv.innerHTML = `
        <label for="week-select">Select Scout Camp Week:</label>
        <select id="week-select">
            <option value="Week 1">Week 1 (June 15 - June 21)</option>
            <option value="Provo Week">Provo Week (July 13 - July 19)</option>
        </select>
        <div id="provo-reason-div" style="display: none;">
            <label for="provo-reason">Reason for selecting Provo Week (Required):</label>
            <input type="text" id="provo-reason" placeholder="Enter reason here">
        </div>
    `;
    document.getElementById("poll-section").prepend(weekSelectionDiv);

    // Show text box when "Provo Week" is selected
    document.getElementById("week-select").addEventListener("change", function() {
        const provoReasonDiv = document.getElementById("provo-reason-div");
        if (this.value === "Provo Week") {
            provoReasonDiv.style.display = "block";
            document.getElementById("provo-reason").setAttribute("required", "true");
        } else {
            provoReasonDiv.style.display = "none";
            document.getElementById("provo-reason").removeAttribute("required");
        }
    });

    // Populate Badge Selection
    populateBadgeSelection(scout);
});

// Populate merit badge selection
function populateBadgeSelection(scout) {
    const badgeSelectionDiv = document.getElementById("badge-selection");
    badgeSelectionDiv.innerHTML = "";

    if (scout.year === "1st") {
        badgeSelectionDiv.innerHTML = `
            <h3>Required Merit Badges:</h3>
            <p>Environmental Science, First Aid, Swimming</p>
            <h3>Choose One:</h3>
            <input type="radio" name="optionalBadge" value="Archery"> Archery<br>
            <input type="radio" name="optionalBadge" value="Rifle Shooting"> Rifle Shooting<br>
            <input type="radio" name="optionalBadge" value="Nature"> Nature
        `;
    } else {
        let requiredBadges = [];
        if (!scout.earned.includes("Cooking")) requiredBadges.push("Cooking");
        if (!scout.earned.includes("Emergency Preparedness")) requiredBadges.push("Emergency Preparedness");

        if (requiredBadges.length > 0) {
            badgeSelectionDiv.innerHTML += `<h3>Required Merit Badges:</h3><p>${requiredBadges.join(", ")}</p>`;
        }

        let availableBadges = meritBadgeList.filter(mb => !scout.earned.includes(mb));
        badgeSelectionDiv.innerHTML += `<h3>Select 4 Merit Badges:</h3>`;

        for (let i = 0; i < (4 - requiredBadges.length); i++) {
            const select = document.createElement("select");
            select.name = `badge${i+1}`;
            const defaultOption = document.createElement("option");
            defaultOption.textContent = `Select ${i+1}st Merit Badge`;
            defaultOption.value = "";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

            availableBadges.forEach(badge => {
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

// Ensure required field is filled before submission
function submitSelection() {
    const provoReason = document.getElementById("provo-reason");
    if (document.getElementById("week-select").value === "Provo Week" && provoReason.value.trim() === "") {
        alert("Please enter a reason for selecting Provo Week.");
        return;
    }
    
    // Submission logic
}
