const SHARED_PASSWORD = "secure123";
const DATA_URL = "https://script.google.com/macros/s/AKfycbxFn_h-tezcMaf0HgtHLWYeG_A-kc5Pdb6oeuVO6tOxUd4bnsC6GrRiMvGYr8UfM1qE/exec"; // Replace with your actual Apps Script URL
const CAMP_BADGES = [
  "Amer. Heritage", "Animation", "Archery", "Art", "Astronomy", "Basketry", "Camping", 
  "Canoeing", "Chemistry", "Chess", "Cit. in Comm.", "Cit. in Nation", "Cit. in World", 
  "Climbing", "Communication", "Cooking", "Emergency Preparedness", "Engineering", 
  "Enviro. Science", "First Aid", "Fish and Wildlife", "Fishing/Fly Fishing", "Forestry", 
  "Geocaching", "Geology", "Graphic Arts", "Indian Lore", "Insect Study", "Kayaking", 
  "Leatherwork", "Medicine", "Metal Working/Blacksmith", "Mining in Society", "Moviemaking", 
  "Nature", "Nuclear Science", "Oceanography", "Orienteering", "Pers. Fitness", "Photography", 
  "Pioneering", "Pottery", "Programming", "Radio", "Reptile & Amphibian Study", "Rifle Shooting",
  "Robotics", "Rowing", "Shotgun Shooting", "Signs, Signals, and Codes", "Small-Boat Sailing", 
  "Space Exploration", "Swimming", "Weather", "Welding", "Wilderness Survival", "Wood Carving"
];

// Declare meritBadgeList globally
let meritBadgeList = [];
let currentScout = null;

// Fetch scout data from Google Sheets using provided scout ID and password
// JSONP version to bypass CORS
function fetchScoutDataJSONP(loginId, password, callback) {
  const script = document.createElement('script');
  const callbackName = 'jsonpCallback_' + Math.floor(Math.random() * 1000000);
  
  // Define the global callback
  window[callbackName] = function(data) {
    clearTimeout(timeout);
    callback(data);
    // Schedule cleanup after a short delay
    setTimeout(() => {
      delete window[callbackName];
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }, 0);
  };

  // Set a timeout for the JSONP request
  const timeout = setTimeout(() => {
    // If the callback hasn’t been called, call it with an error
    callback({ error: "Timeout occurred while fetching data" });
    // Clean up the callback and script
    if (window[callbackName]) {
      delete window[callbackName];
    }
    if (document.body.contains(script)) {
      document.body.removeChild(script);
    }
  }, 10000); // 10-second timeout
  
  // Append the script with the callback parameter
  script.src = `${DATA_URL}?id=${loginId}&password=${password}&callback=${callbackName}`;
  document.body.appendChild(script);
}


// Initialize page logic after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Attach login event listener
  document.getElementById("login-btn").addEventListener("click", login);

  // Enable Enter key to trigger login
  document.getElementById("login-id").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      login();
    }
  });
  document.getElementById("password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      login();
    }
  });

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
function login() {
  const loginError = document.getElementById("login-error");
  const spinner = document.getElementById("spinner");

  // Show processing message and spinner
  loginError.textContent = "Processing...";
  spinner.style.display = "block";
  
  const loginId = document.getElementById("login-id").value.trim();
  const password = document.getElementById("password").value.trim();

  // Validate input fields
  if (!loginId || !password) {
    loginError.textContent = "Please enter both your Scout ID and password.";
    spinner.style.display = "none";
    return;
  }

  if (password !== SHARED_PASSWORD) {
    loginError.textContent = "Incorrect password.";
    spinner.style.display = "none";
    return;
  }

  // Clear previous error
  loginError.textContent = "";

  // Use JSONP to fetch the data
  fetchScoutDataJSONP(loginId, password, function(scout) {
    if (!scout || scout.error) {
      loginError.textContent = scout && scout.error
        ? scout.error + " Please check your Scout ID."
        : "Scout not found. Please check your Scout ID.";
      spinner.style.display = "none";
      return;
    }
    
    // Successful login – hide spinner and update UI
    spinner.style.display = "none";
    document.getElementById("login-section").style.display = "none";
    document.getElementById("poll-section").style.display = "block";
    document.getElementById("display-name").textContent = scout.name;
    if (scout.earned && scout.earned.length > 0) {
      document.getElementById("achievements-section").innerHTML =
        `<h3>Your Achieved Merit Badges:</h3><p>${scout.earned.join(", ")}</p>`;
    } else {
      document.getElementById("achievements-section").innerHTML =
        "<h3>Your Achieved Merit Badges:</h3><p>None</p>";
    }
// Update global meritBadgeList from the returned data (filtered to camp badges)
currentScout = scout;
meritBadgeList = (scout.availableBadges || []).filter(badge => CAMP_BADGES.includes(badge));
console.log("Filtered camp badges:", meritBadgeList);

// Then populate the dropdowns
populateBadgeSelection(scout);
  });
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

  let numDropdowns = 4 - requiredBadges.length;
let availableBadges = meritBadgeList.filter(mb => !scout.earned.includes(mb));
badgeSelectionDiv.innerHTML += `<h3>Select ${numDropdowns} Merit Badge${numDropdowns > 1 ? 's' : ''}:</h3>`;
for (let i = 0; i < numDropdowns; i++) {
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
  
  let finalBadges = [];
  
  if (currentScout) {
    if (currentScout.year === "1st") {
      // For 1st years, add the required badges...
      finalBadges = ["Environmental Science", "First Aid", "Swimming"];
      // And then add the optional badge from the radio buttons (if any)
      const optionalRadio = document.querySelector('input[name="optionalBadge"]:checked');
      if (optionalRadio && optionalRadio.value) {
        finalBadges.push(optionalRadio.value);
      }
    } else {
      // For older scouts, determine required badges (e.g. Cooking and Emergency Preparedness if not earned)
      let requiredBadges = [];
      if (!currentScout.earned.includes("Cooking")) requiredBadges.push("Cooking");
      if (!currentScout.earned.includes("Emergency Preparedness")) requiredBadges.push("Emergency Preparedness");
      
      // Start the final list with the required badges.
      finalBadges = requiredBadges.slice();
      
      // Get additional selections from the dropdowns.
      const selections = document.querySelectorAll("#badge-selection select");
      selections.forEach(select => {
        if (select.value) {
          finalBadges.push(select.value);
        }
      });
    }
  }
  
  // Build the form data object.
  const formData = {
    scoutName: scoutName,
    loginId: loginId,
    selectedWeek: selectedWeek,
    provoReason: selectedWeek === "Provo Week" ? provoReason : "",
    finalBadges: finalBadges  // send the final badge array
  };
  
  // Validate that a reason is provided if Provo Week is selected.
  if (selectedWeek === "Provo Week" && provoReason.trim() === "") {
    alert("Please provide a reason for selecting Provo Week.");
    return;
  }
  
  fetch(DATA_URL, {
    method: "POST",
    mode: "no-cors",  // Using no-cors since our endpoint is not setting CORS headers.
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
  .then(() => {
    document.getElementById("submission-status").textContent = "Selection submitted successfully!";
  })
  .catch(error => {
    console.error("Error submitting selection:", error);
    document.getElementById("submission-status").textContent = "Error submitting selection.";
  });
}
