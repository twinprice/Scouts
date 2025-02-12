const SHARED_PASSWORD = "secure123";
const DATA_URL = "https://script.google.com/macros/s/AKfycbxpq6e6wtvflHogZkS_EODds5OOhyFdfryLx5bVg2789m7HJvadI-e_JVjLmNFuvz8G/exec"; // Replace with your actual Apps Script URL

// Declare meritBadgeList globally
let meritBadgeList = [];

// Fetch scout data from Google Sheets using provided scout ID
async function fetchScoutData(loginId) {
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

// Initialize page logic after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Attach login event listener
  document.getElementById("login-btn").addEventListener("click", login);

  // Attach change event listener for week selection in the poll section
  document.getElementById("weekSelector").addEventListener("change", function() {
    var explanationBox = document.getElementById("provoExplanation");
    // If "Provo Week" is selected, show the explanation input; otherwise, hide it
    if (this.value === "Provo Week") {
      explanationBox.style.display = "block";
    } else {
      explanationBox.style.display = "none";
    }
  });

  // Attach event listener for submission of the badge selection
  document.getElementById("submit-btn").addEventListener("click", submitSelection);
});

// Login function to validate credentials and load poll section
async function login() {
  const loginId = document.getElementById("login-id").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginError = document.getElementById("login-error");

  // Validate that both fields are filled
  if (!loginId || !password) {
    loginError.textContent = "Please enter both your Scout ID and password.";
    return;
  }

  // Validate password
  if (password !== SHARED_PASSWORD) {
    loginError.textContent = "Incorrect password.";
    return;
  }

  // Clear any previous error
  loginError.textContent = "";

  // Fetch the scout's data
  const scout = await fetchScoutData(loginId);
  if (!scout) {
    loginError.textContent = "Scout not found. Please check your Scout ID.";
    return;
  }

  // Successful login: Hide login section, display poll section
  document.getElementById("login-section").style.display = "none";
  document.getElementById("poll-section").style.display = "block";

  // Populate scout details
  document.getElementById("display-name").textContent = scout.name;
  if (scout.earned.length > 0) {
    document.getElementById("achievements-section").innerHTML = `<h3>Your Achieved Merit Badges:</h3><p>${scout.earned.join(", ")}</p>`;
  } else {
    document.getElementById("achievements-section").innerHTML = "<h3>Your Achieved Merit Badges:</h3><p>None</p>";
  }

  // Populate the merit badge selection based on scout data
  populateBadgeSelection(scout);
}

// Populate merit badge selection based on scout's year and earned badges
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

// Submit the scout's selection
function submitSelection() {
  const provoReason = document.getElementById("provo-reason")?.value || "";
  const selectedWeek = document.getElementById("weekSelector").value;
  const scoutName = document.getElementById("display-name").textContent;
  const loginId = document.getElementById("login-id").value.trim();
  const selections = document.querySelectorAll("#badge-selection select");

  const formData = {
    scoutName: scoutName,
    loginId: loginId,
    selectedWeek: selectedWeek,
    // Include the explanation only if "Provo Week" is selected
    provoReason: selectedWeek === "Provo Week" ? provoReason : "",
    badge1: selections[0] ? selections[0].value : "",
    badge2: selections[1] ? selections[1].value : "",
    badge3: selections[2] ? selections[2].value : "",
    badge4: selections[3] ? selections[3].value : ""
  };

  // Validate that a reason is provided if Provo Week is selected
  if (selectedWeek === "Provo Week" && provoReason.trim() === "") {
    alert("Please provide a reason for selecting Provo Week.");
    return;
  }

  fetch("https://script.google.com/macros/s/AKfycbwx0a_c24marw82303BN1Lm_LodvHjogUg959YpDn5-48DwZpkCOabL9_9D_jcHxPZF/exec", {  // Replace with your actual Apps Script URL for POST
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.text())
  .then(data => {
    document.getElementById("submission-status").textContent = "Selection submitted successfully!";
  })
  .catch(error => {
    console.error("Error submitting selection:", error);
    document.getElementById("submission-status").textContent = "Error submitting selection.";
  });
}
