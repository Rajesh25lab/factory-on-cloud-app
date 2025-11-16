// --- [CONFIG] ---
// PASTE YOUR NEW APPS SCRIPT API URL HERE
// This is the URL you got from deploying your "Factory on Cloud - API" project
const API_URL = "https://script.google.com/a/macros/oncloudindia.com/s/AKfycbzu-YwCVJoxEfU2u65fNaJfYUi1ofQU9WkunK49g2d7-pqfsZSm1s8_HvG0m5PSwpgrzA/exec"; 

// PASTE YOUR SECRET PASSWORD HERE (must match Code.gs)
const API_KEY = "Oncloud"; 
// --- [END CONFIG] ---


var allNames = [];
var allReasons = [];

// --- 0. Initial Check on Page Load ---
document.addEventListener("DOMContentLoaded", function() {
  showView('loading');
  // Call our new API
  callApi('checkUserStatus', {})
    .then(response => {
      onStatusChecked(response.data);
    })
    .catch(err => {
      // This is the first place an error will show
      onFailure(new Error("API Connection Failed. " + err.message));
    });
});

function onStatusChecked(statusResponse) {
  if (statusResponse.status === 'APPROVED') {
    // User is Admin or Approved, load main app data
    callApi('getWebAppData', {})
      .then(response => {
        onDataLoaded(response.data);
      })
      .catch(err => onFailure(err));
  } else if (statusResponse.status === 'PENDING') {
    document.getElementById('access-message').innerHTML = 'Your request is **Pending Admin Approval**. Please wait for an email confirming your access.';
    document.getElementById('access-message').classList.add('access-pending');
    showView('access-check');
  } else { // DENIED / NEW_USER
    document.getElementById('access-message').innerHTML = 'You do not have permission to use this application.';
    document.getElementById('requestForm').style.display = 'block';
    showView('access-check');
  }
}

// --- 1. Request Access Submission ---
document.getElementById("requestForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const userName = document.getElementById('username').value;
    document.getElementById('btn-access').disabled = true;
    showStatus("Submitting request...", "orange");
    
    callApi('requestAccess', { userName: userName })
      .then(response => {
        onAccessRequestSuccess(response.data);
      })
      .catch(err => onFailure(err));
});

function onAccessRequestSuccess(message) {
    document.getElementById('access-message').innerHTML = message;
    document.getElementById('access-message').classList.add('access-pending');
    document.getElementById('requestForm').style.display = 'none';
    showStatus("✅ Request Sent!", "green");
}

// --- 2. Load Main Application Data ---
function onDataLoaded(data) {
  // Store data and populate forms as before
  allNames = data.names;
  allReasons = data.reasons;

  const reasonSelect = document.getElementById("exp-reason");
  allReasons.forEach(reason => {
    var option = new Option(reason, reason);
    reasonSelect.add(option);
  });
  
  const namesDatalist = document.getElementById("names-list");
  allNames.forEach(name => {
    var option = document.createElement("option");
    option.value = name;
    namesDatalist.appendChild(option);
  });
  
  showView('menu'); // Show the main menu
}

// --- 3. Handle Add New Employee Submission ---
document.getElementById("masterForm").addEventListener("submit", function(e) {
    e.preventDefault();
    showLoading(true, "Submitting for approval...");
    
    var formData = {
      name: document.getElementById("name").value,
      bankName: document.getElementById("bankName").value,
      acctNo: document.getElementById("acctNo").value,
      ifsc: document.getElementById("ifsc").value.toUpperCase(),
      empId: document.getElementById("empId").value
    };

    callApi('addNewMasterEntry', formData)
      .then(response => onSuccess(response.data))
      .catch(err => onFailure(err));
});

// --- 4. Handle Post Manual Expense Submission ---
document.getElementById("expenseForm").addEventListener("submit", function(e) {
    e.preventDefault();
    showLoading(true, "Submitting expense...");
    
    var formData = {
      name: document.getElementById("exp-name").value,
      amount: document.getElementById("exp-amount").value,
      reason: document.getElementById("exp-reason").value
    };

    callApi('postManualExpense', formData)
      .then(response => onSuccess(response.data))
      .catch(err => onFailure(err));
});

// --- 5. Handle New Reason Suggestion ---
document.getElementById("reasonForm").addEventListener("submit", function(e) {
    e.preventDefault();
    showLoading(true, "Submitting suggestion...");
    
    var reasonName = document.getElementById("reason-name").value;
    
    callApi('suggestNewReason', { reasonName: reasonName })
      .then(response => onSuccess(response.data))
      .catch(err => onFailure(err));
});

// --- 6. Handle Batch File Upload ---
document.getElementById("batchUploadForm").addEventListener("submit", function(e) {
  e.preventDefault();
  // This feature is not implemented in the new API yet.
  onFailure(new Error("Batch Upload is not supported in this version."));
});

// --- [MASTER API CALL FUNCTION] ---
/**
 * The new central function to call our Apps Script API.
 * UPDATED: Removed 'no-cors' and set correct 'Content-Type'.
 */
async function callApi(action, payload) {
  // This is still a placeholder. We must implement real Google Sign-In later.
  const userEmail = "user.from.vercel@example.com"; 

  const requestBody = {
    apiKey: API_KEY,
    action: action,
    userEmail: userEmail,
    payload: payload
  };
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      // FIX: Changed from text/plain to application/json
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify(requestBody),
    // FIX: Removed 'mode: 'no-cors'
  });

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }
  
  const result = await response.json();

  if (result.status === 'error') {
    throw new Error(result.message);
  }
  
  return result;
}

// --- Helper Functions (Identical to before) ---

function onSuccess(message) {
    showView('menu');
    showStatus("✅ " + message, "green");
    document.getElementById("masterForm").reset();
    document.getElementById("expenseForm").reset();
    document.getElementById("reasonForm").reset();
    document.getElementById("batchUploadForm").reset();
    
    setTimeout(() => { showStatus("", "black", "none"); }, 4000);
}

function onFailure(error) {
    showView('menu');
    showStatus("❌ BACKEND ERROR: " + error.message, "red");
}

function showStatus(message, color, display = "block") {
  var statusDiv = document.getElementById("status");
  statusDiv.style.display = display;
  statusDiv.innerHTML = message;
  statusDiv.style.color = color;
}

function showView(viewId) {
  // Hide all main views
  document.getElementById("loading").style.display = "none";
  document.getElementById("menu").style.display = "none";
  document.getElementById("new-emp-form").style.display = "none";
  document.getElementById("expense-form").style.display = "none";
  document.getElementById("new-reason-form").style.display = "none";
  document.getElementById("batch-form").style.display = "none";
  document.getElementById("access-check").style.display = "none";
  
  // Show the requested view
  document.getElementById(viewId).style.display = "block";
}

function showForm(formId) {
  showStatus("", "black", "none"); // Clear any old status
  showView(formId + (formId !== 'menu' ? '-form' : ''));
}

function showLoading(isLoading, message) {
    showView('loading');
    showStatus(message || "Loading...", "orange");
}
