const SHARED_PASSWORD = "troop444_camp";
const DATA_URL = "https://script.google.com/macros/s/AKfycbyT7VXahaW_SXLPVNtymGxIfrrn05Em0lelHUYL9Z_xb_IHSI9uQJ0dKI9bJEuxHRVl/exec"; // Replace with your actual Apps Script URL
const CAMP_BADGES = [
  "Amer. Heritage", "Animation", "Archery", "Art", "Astronomy", "Basketry", "Camping*", 
  "Canoeing", "Chemistry", "Chess", "Cit. in Nation*", "Cit. in World*", 
  "Climbing", "Cooking*", "Emergency Prep*", "Engineering", 
  "Enviro. Science*", "First Aid*", "Fish and Wildlife", "Fishing/Fly Fishing", "Forestry", 
  "Geocaching", "Geology", "Graphic Arts", "Indian Lore", "Insect Study", "Kayaking", 
  "Leatherwork", "Medicine", "Metal Working/Blacksmith", "Mining in Society", "Moviemaking", 
  "Nature", "Nuclear Science", "Oceanography", "Orienteering", "Pers. Fitness", "Photography", 
  "Pioneering", "Pottery", "Programming", "Radio", "Reptile & Amphibian Study", "Rifle Shooting",
  "Robotics", "Rowing", "Shotgun Shooting", "Signs, Signals, and Codes", "Small-Boat Sailing", 
  "Space Exploration", "Swimming*", "Weather", "Welding", "Wilderness Survival", "Wood Carving"
];

// Declare meritBadgeList globally
let meritBadgeList = [];
let currentScout = null;
function getOrdinal(n) {
  let s = ["th", "st", "nd", "rd"],
      v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Fetch scout data from Google Sheets using provided scout ID and password
// JSONP version to bypass CORS
function fetchScoutDataJSONP(loginId, password, callback) {
  const script = document.createElement('script');
  const callbackName = 'jsonpCallback_' + Math.floor(Math.random() * 1000000);
  
  let timeout; // Declare timeout here

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

  // Now assign timeout
  timeout = setTimeout(() => {
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

  // Enable Enter key to trigger login for login-id and password fields
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
    var explanationInput = document.getElementById("provo-reason");
    if (this.value === "Provo Week") {
      explanationBox.style.display = "block";
      explanationInput.setAttribute("required", "required");
    } else {
      explanationBox.style.display = "none";
      explanationInput.removeAttribute("required");
    }
  });

  // Attach event listener for attendance radio buttons
  document.querySelectorAll('input[name="attendance"]').forEach(radio => {
    radio.addEventListener("change", function() {
      var badgeSection = document.getElementById("badge-selection");
      var weekSection = document.getElementById("week-selection");
      var provoExplanation = document.getElementById("provoExplanation");
      
      if (this.value === "no") {
        // Hide badge selection and week selection if not attending
        badgeSection.style.display = "none";
        weekSection.style.display = "none";
        provoExplanation.style.display = "none";
      } else {
        // Show both if attending
        badgeSection.style.display = "block";
        weekSection.style.display = "block";
        // Also, if week is Provo Week, the change event on weekSelector will handle the explanation box.
      }
    });
  });

  // Attach event listener for form submission
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

    if (scout.submitted && scout.submissionDetails) {
      alert(`A submission has already been made for ${scout.name}. You may review your selections below or resubmit if necessary.`);

      const details = scout.submissionDetails;
      const submittedWeek = details[3];
      const submittedProvoReason = details[4] || "None";
      const submittedBadges = details.slice(5).filter(badge => badge !== "").join(", ");

      document.getElementById("previous-submission").innerHTML = `
        <h3>Previous Submission:</h3>
        <p><strong>Week:</strong> ${submittedWeek}</p>
        <p><strong>Provo Reason:</strong> ${submittedProvoReason}</p>
        <p><strong>Merit Badges:</strong> ${submittedBadges || "None"}</p>
        <p style="font-style: italic; color: #555;">You may update your selections and submit again if needed.</p>
      `;
    } else {
      document.getElementById("previous-submission").innerHTML = "";
    }

    spinner.style.display = "none";
    document.getElementById("login-section").style.display = "none";
    document.getElementById("poll-section").style.display = "block";
    document.getElementById("display-name").textContent = scout.name;

    if (scout.earned && scout.earned.length > 0) {
      document.getElementById("achievements-section").innerHTML =
        `<h3 style="margin-bottom:0;">Your Earned Merit Badges:</h3>
        <h4 style="margin:0; font-size:0.9em;"><em>(* denotes Eagle Required Merit Badges)</em></h4>
        <p>${scout.earned.join(", ")}</p>`;
    } else {
      document.getElementById("achievements-section").innerHTML =
        `<h3 style="margin-bottom:0;">Your Earned Merit Badges:</h3>
        <h4 style="margin:0; font-size:0.9em;"><em>(* denotes Eagle Required Merit Badges)</em></h4>
        <p>None</p>`;
    }

    currentScout = scout;
    meritBadgeList = (scout.availableBadges || []).filter(badge => CAMP_BADGES.includes(badge));
    console.log("Filtered camp badges:", meritBadgeList);

    populateBadgeSelection(scout);
  });
}

// Populate merit badge selection based on scout's year and earned badges
function populateBadgeSelection(scout) {
  const badgeSelectionDiv = document.getElementById("badge-selection");
  badgeSelectionDiv.innerHTML = "";

  if (scout.year === "1st") {
    // For first-year scouts: show required badges and an optional radio selection.
    badgeSelectionDiv.innerHTML = `
      <h3>Required Merit Badges:</h3>
      <p>Environmental Science, First Aid, Swimming</p>
      <h3>Choose One:</h3>
      <input type="radio" name="optionalBadge" value="Archery"> Archery<br>
      <input type="radio" name="optionalBadge" value="Rifle Shooting"> Rifle Shooting<br>
      <input type="radio" name="optionalBadge" value="Nature"> Nature
    `;
  } else {
    // For older scouts:
    let requiredBadges = [];
    if (!scout.earned.includes("Cooking*")) requiredBadges.push("Cooking*");
    if (!scout.earned.includes("Emergency Prep*")) requiredBadges.push("Emergency Prep*");

    if (requiredBadges.length > 0) {
      badgeSelectionDiv.innerHTML += `<h3>Required Merit Badges:</h3><p>${requiredBadges.join(", ")}</p>`;
    }

    // Calculate number of main selection dropdowns.
    let numMainDropdowns = 4 - requiredBadges.length;
    let availableBadges = meritBadgeList.filter(mb => !scout.earned.includes(mb));

    badgeSelectionDiv.innerHTML += `<h3>Select ${numMainDropdowns} Merit Badge${numMainDropdowns > 1 ? 's' : ''}:</h3>`;
    for (let i = 0; i < numMainDropdowns; i++) {
      const select = document.createElement("select");
      select.name = `badge${i+1}`;
      select.classList.add("mainBadge");
      const defaultOption = document.createElement("option");
      defaultOption.textContent = `Select ${getOrdinal(i+1)} Merit Badge`;
      defaultOption.value = "";
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

    // Add two alternate dropdowns.
    badgeSelectionDiv.innerHTML += `<h3>Alternate Merit Badge Selections:</h3>
  <p style="font-size: 0.9em; font-style: italic; color: #555;">
    Please select two additional merit badges as backups in case your primary choices are unavailable or create scheduling conflicts.
  </p>
`;
    for (let i = 0; i < 2; i++) {
      const altSelect = document.createElement("select");
      altSelect.name = `altBadge${i+1}`;
      altSelect.classList.add("altBadge");
      const altDefaultOption = document.createElement("option");
      altDefaultOption.textContent = `Select Alternate Merit Badge ${i+1}`;
      altDefaultOption.value = "";
      altDefaultOption.disabled = true;
      altDefaultOption.selected = true;
      altSelect.appendChild(altDefaultOption);

      availableBadges.forEach(badge => {
        const option = document.createElement("option");
        option.value = badge;
        option.textContent = badge;
        altSelect.appendChild(option);
      });
      badgeSelectionDiv.appendChild(altSelect);
      badgeSelectionDiv.appendChild(document.createElement("br"));
    }
  }
}

// Submit the scout's selection
function submitSelection() {
  // Define attendance from the radio buttons.
  const attendance = document.querySelector('input[name="attendance"]:checked').value;
  const provoReason = document.getElementById("provo-reason")?.value || "";
  const selectedWeek = document.getElementById("weekSelector").value;
  const scoutName = document.getElementById("display-name").textContent;
  const loginId = document.getElementById("login-id").value.trim();
  
  let formData = {
    scoutName: scoutName,
    loginId: loginId,
    provoReason: selectedWeek === "Provo Week" ? provoReason : "",
    attendance: attendance
  };

  if (attendance === "yes") {
    formData.selectedWeek = selectedWeek;
    if (currentScout && currentScout.year === "1st") {
      // For first-year scouts, required badges plus optional radio.
      let finalBadges = ["Environmental Science", "First Aid", "Swimming"];
      const optionalRadio = document.querySelector('input[name="optionalBadge"]:checked');
      if (optionalRadio && optionalRadio.value) {
        finalBadges.push(optionalRadio.value);
      }
      formData.finalBadges = finalBadges;
    } else {
      // For older scouts: gather main and alternate selections separately.
      let mainBadges = [];
      document.querySelectorAll("#badge-selection select.mainBadge").forEach(select => {
        if (select.value) {
          mainBadges.push(select.value);
        }
      });
      let altBadges = [];
      document.querySelectorAll("#badge-selection select.altBadge").forEach(select => {
        if (select.value) {
          altBadges.push(select.value);
        }
      });
      formData.mainBadges = mainBadges;
      formData.altBadges = altBadges;
    }
  }
  
  if (selectedWeek === "Provo Week" && provoReason.trim() === "") {
    alert("Please provide a reason for selecting Provo Week.");
    return;
  }
  
  // Show the submission spinner and clear any prior status message.
  const submitSpinner = document.getElementById("submit-spinner");
  submitSpinner.style.display = "block";
  document.getElementById("submission-status").textContent = "";
  
  // Submit the form via POST.
  fetch(DATA_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
  .then(() => {
    // Hide the submission spinner.
    submitSpinner.style.display = "none";
    
    // Hide the poll section and prepare the completion page details.
    document.getElementById("poll-section").style.display = "none";
    let details = `<p><strong>Scout Name:</strong> ${formData.scoutName}</p>
                   <p><strong>Login ID:</strong> ${formData.loginId}</p>`;
    
    // Only show week details if the scout is attending.
    if (attendance === "yes") {
      details += `<p><strong>Selected Week:</strong> ${formData.selectedWeek}</p>`;
    }
    
    if (formData.provoReason) {
      details += `<p><strong>Explanation:</strong> ${formData.provoReason}</p>`;
    }
    
    if (attendance === "yes") {
      if (currentScout && currentScout.year === "1st") {
        details += `<p><strong>Selected Badges:</strong> ${formData.finalBadges.join(", ")}</p>`;
      } else {
        details += `<p><strong>Main Selections:</strong> ${formData.mainBadges.join(", ")}</p>`;
        details += `<p><strong>Alternate Selections:</strong> ${formData.altBadges.join(", ")}</p>`;
      }
    } else {
      details += `<p><strong>Attendance:</strong> Not Attending</p>`;
    }
    
    document.getElementById("submission-details").innerHTML = details;
    document.getElementById("completion-page").style.display = "block";
  })
  .catch(error => {
    console.error("Error submitting selection:", error);
    document.getElementById("submission-status").textContent = "Error submitting selection.";
    submitSpinner.style.display = "none";
  });
}
