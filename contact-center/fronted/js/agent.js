/**
 * Agent Module for Gadaa Bank Contact Center
 * Handles call logging and management for call agents
 */

// Constants
const CALL_CATEGORIES = {
    'Share Holders': [
        'Information on SMS received regarding shareholders concern',
        'When do we get certificate?',
        'When do you start share dividend',
        'Where and requirement to buy new or additional',
        'Share status request',
        'Share division contact number request',
        'Where and requirement to collect share certificate',
        'Where and requirement to settle remaining share payment',
        'Requirement to transfer share to other person',
        'I am not receiving message since I bought share complaint',
        'Message for generally is not received complaint',
        'Service number change request',
        'Can being share holder award for vacancy',
        'Can being shareholder award for credit',
        'New case'
    ],
    'Branch': [
        'Branch Location request',
        'Branch contact number request',
        'Money transferred via RTGS at branch but not received complaint',
        'Branch Expansion request',
        'Recommendation of house rent for branch',
        'FC request',
        'Cash Shortage complaint at branch',
        'Branch Work hour request',
        'Complaint on branch customer service',
        'Where to get my passbook',
        'New case'
    ],
    'Account': [
        'Account status request',
        'Account number request',
        'Account balance request',
        'Account balance statement request',
        'Account activation request',
        'Account passbook lost',
        'Requirement to open account',
        'Information request on interest rate of product',
        'Account created without my knowledge complaint',
        'Entries request for a given date',
        'Service number change request',
        'Information on received SMS regarding to account number',
        'New case'
    ],
    'Digital Banking': [
        'Balance deducted from GB but not received to other bank',
        'Balance deducted from other bank but not received to GB',
        'Unable to transfer to telebirr',
        'USSD inquiry',
        'Internet and mobile banking inquiry',
        'USSD, Mobile and internet banking usage inquiry',
        'How to open omnichannel service request',
        'How and where can we get ATM service',
        'USSD, Mobile and internet banking not working properly complaint',
        'Password/PIN reset request',
        'ATM balance deducted but not paid',
        'Unable to transfer to other bank',
        'Transaction progress request',
        'Wrong transaction correction',
        'Balance deducted from telebirr but not received to GB',
        'Balance deducted from GB but not delivered to telebirr',
        'New case'
    ],
    'Credit': [
        'Do you started credit service',
        'Do you started digital loan service',
        'Requirement to get credit service',
        'New case'
    ],
    'Vacancy': [
        'Vacancy related information request',
        'HR vacancy link is not working',
        'Is there any new job vacancy',
        'HR contact number request',
        'Complaint on transparency of vacancy',
        'New case'
    ],
    'Other': [
        'Other company service request',
        'Call without concern',
        'Information request on submitted letter',
        '641 line checking',
        'Other local language',
        'Transferred call to other agent',
        'Tender information request',
        'How to get sponsorship from GB',
        'GB website address request',
        'GB POB request',
        'New case'
    ],
    'Incomplete': [
        'Sound problem',
        'Silent call',
        'Dropped call',
        'Abandoned call'
    ]
};
// DOM Ready Handler
document.addEventListener('DOMContentLoaded', initializeAgentModule);

/**
 * Initializes the Agent module
 */
function initializeAgentModule() {
    try {
        loadProfileScript();
        setupCurrentUser();
        setupEventListeners();
        loadRecentCalls();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize Agent module. Please refresh the page.');
    }
}



document.getElementById('customerContact').addEventListener('input', function(e) {
    fetchCustomerInfo(this.value);
});
function fetchCustomerInfo(contactNumber) {
    if (!contactNumber || contactNumber.length < 10) return; // Don't search for very short inputs

    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    // Find all calls for this customer (excluding today's calls)
    const customerCalls = calls.filter(call => 
        call.customerContact.includes(contactNumber) && 
        call.date !== today
    ).reverse(); // Newest first

    if (customerCalls.length > 0) {
        showCustomerHistory(customerCalls);
    }
}
// Add this function to display customer history
function showCustomerHistory(calls) {
    const historyContainer = document.getElementById('customerHistory') || createCustomerHistoryContainer();
    historyContainer.innerHTML = '';

    const uniqueItems = [...new Set(calls.map(call => call.item))];
    
    let historyHTML = `
        <div class="customer-history-header">
            <h4>Customer History</h4>
            <span class="close-history">&times;</span>
        </div>
        <div class="customer-history-summary">
            <p><strong>Total Previous Calls:</strong> ${calls.length}</p>
            <p><strong>Common Issues:</strong> ${uniqueItems.join(', ')}</p>
        </div>
        <div class="customer-history-list">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Issue</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Show only the 5 most recent calls
    calls.slice(0, 5).forEach(call => {
        historyHTML += `
            <tr>
                <td>${formatDate(call.date)}</td>
                <td>${call.item} - ${call.category}</td>
                <td class="status-${call.status}">${call.status}</td>
            </tr>
        `;
    });

    historyHTML += `
                </tbody>
            </table>
        </div>
    `;

    historyContainer.innerHTML = historyHTML;
    historyContainer.style.display = 'block';

    // Add close button event
    historyContainer.querySelector('.close-history').addEventListener('click', () => {
        historyContainer.style.display = 'none';
    });
     // Add click event to history items to auto-fill contact
     historyContainer.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const contact = this.getAttribute('data-contact');
            document.getElementById('customerContact').value = contact;
            historyContainer.style.display = 'none';
        });
    });
}

function createCustomerHistoryContainer() {
    const container = document.createElement('div');
    container.id = 'customerHistory';
    container.className = 'customer-history';
    document.querySelector('.call-log-form').appendChild(container);
    return container;
}

// Add this helper function if not already present
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}




/**
 * Loads profile script dynamically
 */
function loadProfileScript() {
    if (!document.getElementById('profileScript')) {
        const script = document.createElement('script');
        script.src = 'scripts/profile.js';
        script.id = 'profileScript';
        document.body.appendChild(script);
    }
}

/**
 * Sets up the current user information
 */
function setupCurrentUser() {
    try {
        const currentUser = getCurrentUser();
        if (currentUser) {
            document.getElementById('currentAgentName').textContent = currentUser.name;
        }
    } catch (error) {
        console.error('Error setting up current user:', error);
    }
}

/**
 * Gets the current user from session storage
 * @returns {Object|null} Current user object or null if not found
 */
function getCurrentUser() {
    try {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    // Logout
    const logoutLink = document.getElementById('agentLogoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }

    // Profile
    const profileLink = document.getElementById('agentProfileLink');
    if (profileLink) {
        profileLink.addEventListener('click', handleProfileView);
    }

    // Item dropdown change handler
    const callItemSelect = document.getElementById('callItem');
    if (callItemSelect) {
        callItemSelect.addEventListener('change', function() {
            updateCategoryOptions(this.value);
        });
    }

    // Status dropdown change handler
    const callStatusSelect = document.getElementById('callStatus');
    if (callStatusSelect) {
        callStatusSelect.addEventListener('change', function() {
            const escalationDept = document.getElementById('escalationDepartment');
            if (escalationDept) {
                escalationDept.disabled = this.value !== 'escalated';
                if (this.value !== 'escalated') {
                    escalationDept.value = '';
                }
            }
        });
    }

    // Form submission
    const callLogForm = document.getElementById('callLogForm');
    if (callLogForm) {
        callLogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            logNewCall();
        });
    }
}

/**
 * Handles logout action
 * @param {Event} e - Click event
 */
function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

/**
 * Handles profile view action
 * @param {Event} e - Click event
 */
function handleProfileView(e) {
    e.preventDefault();
    if (typeof viewProfile === 'function') {
        viewProfile();
    } else {
        loadProfileScript();
        alert('Profile functionality loading. Please try again.');
    }
}

/**
 * Updates category options based on selected item
 * @param {string} selectedItem - The selected item
 */
function updateCategoryOptions(selectedItem) {
    try {
        const categorySelect = document.getElementById('callCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categorySelect.disabled = !selectedItem;
        
        if (!selectedItem) return;
        
        const categories = getCategoriesForItem(selectedItem);
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating category options:', error);
    }
}

/**
 * Gets categories for a specific item
 * @param {string} item - The item to get categories for
 * @returns {Array} Array of categories
 */
function getCategoriesForItem(item) {
    return CALL_CATEGORIES[item] || ['New case'];
}

/**
 * Logs a new call
 */
function logNewCall() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('You must be logged in to log a call');
            return;
        }

        // Get form values
        const formData = {
            customerContact: document.getElementById('customerContact').value.trim(),
            callItem: document.getElementById('callItem').value,
            callCategory: document.getElementById('callCategory').value,
            callDescription: document.getElementById('callDescription').value.trim(),
            callStatus: document.getElementById('callStatus').value,
            escalationDepartment: document.getElementById('escalationDepartment')?.value || null
        };

        // Validate required fields
        const validationErrors = validateCallForm(formData);
        if (validationErrors.length > 0) {
            alert(validationErrors.join('\n'));
            return;
        }

        const historyContainer = document.getElementById('customerHistory');
    if (historyContainer) {
        historyContainer.style.display = 'none';
        historyContainer.innerHTML = '';
    }

        // Create new call object
        const newCall = createNewCallObject(currentUser, formData);

        // Save call
        saveCall(newCall);
        
        // Reset form
        resetCallForm();
        
        // Show success message
        showSuccessMessage('Call logged successfully!');

        // Reload recent calls
        loadRecentCalls();

        // Trigger notification if escalated
        if (formData.callStatus === 'escalated' && formData.escalationDepartment) {
            triggerEscalationNotification(newCall);
        }
    } catch (error) {
        console.error('Error logging new call:', error);
        alert('Failed to log call. Please try again.');
    }
}

/**
 * Validates call form data
 * @param {Object} formData - Form data to validate
 * @returns {Array} Array of error messages
 */
function validateCallForm(formData) {
    const errors = [];
    
    if (!formData.customerContact || formData.customerContact.length < 3) {
        errors.push('Customer contact is required and must be at least 3 characters');
    }
    
    if (!formData.callItem) {
        errors.push('Item selection is required');
    }
    
    if (!formData.callCategory) {
        errors.push('Category selection is required');
    }
    
    if (!formData.callDescription || formData.callDescription.length < 10) {
        errors.push('Description is required and must be at least 10 characters');
    }
    
    if (formData.callStatus === 'escalated' && !formData.escalationDepartment) {
        errors.push('Please select a department to escalate to');
    }
    
    return errors;
}

/**
 * Creates a new call object
 * @param {Object} currentUser - Current user object
 * @param {Object} formData - Form data
 * @returns {Object} New call object
 */
function createNewCallObject(currentUser, formData) {
    const calls = getCalls();
    
    return {
        id: calls.length > 0 ? Math.max(...calls.map(c => c.id)) + 1 : 1,
        agentId: currentUser.id,
        agentName: currentUser.name,
        customerContact: formData.customerContact,
        item: formData.callItem,
        category: formData.callCategory,
        description: formData.callDescription,
        status: formData.callStatus,
        escalatedTo: formData.escalationDepartment,
        notificationShown: false,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        recordings: [],
        isNewEscalation: formData.callStatus === 'escalated'
    };
}

/**
 * Gets calls from localStorage
 * @returns {Array} Array of call objects
 */
function getCalls() {
    try {
        return JSON.parse(localStorage.getItem('calls')) || [];
    } catch (error) {
        console.error('Error getting calls:', error);
        return [];
    }
}

/**
 * Saves a new call
 * @param {Object} newCall - Call object to save
 */
function saveCall(newCall) {
    try {
        const calls = getCalls();
        calls.push(newCall);
        localStorage.setItem('calls', JSON.stringify(calls));
    } catch (error) {
        console.error('Error saving call:', error);
        throw error;
    }
}

/**
 * Resets the call form
 */
function resetCallForm() {
    const form = document.getElementById('callLogForm');
    if (form) form.reset();
    
    const categorySelect = document.getElementById('callCategory');
    if (categorySelect) categorySelect.disabled = true;
    
    const escalationDept = document.getElementById('escalationDepartment');
    if (escalationDept) escalationDept.disabled = true;
}

/**
 * Shows a success message
 * @param {string} message - Message to display
 */
function showSuccessMessage(message) {
    alert(message);
}

/**
 * Triggers escalation notification
 * @param {Object} call - Call object that was escalated
 */
function triggerEscalationNotification(call) {
    // This will be handled by the notification system
    // The periodic check in notifications.js will pick up the new escalation
}

/**
 * Loads recent calls for the current agent
 */
function loadRecentCalls() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    const agentCalls = calls.filter(call => 
        call.agentId === currentUser.id &&
        call.date === today
    ).reverse(); // Newest first
    
    const tableBody = document.querySelector('#recentCallsTable tbody');
    tableBody.innerHTML = '';
    
    agentCalls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.customerContact}</td>
            <td>${call.item}</td>
            <td>${call.category}</td>
            <td class="status-${call.status}">${call.status}</td>
            <td>
                <button class="btn-view" data-id="${call.id}">View</button>
            </td>
        `;
    
        tableBody.appendChild(row);
    });

     // Add event listeners to view buttons
     document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            viewCallDetails(callId);
        });
    });
}

/**
 * Renders the recent calls table
 * @param {Array} calls - Array of call objects to display
 */
function renderRecentCallsTable(calls) {
    const tableBody = document.querySelector('#recentCallsTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    calls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.customerContact}</td>
            <td>${call.item}</td>
            <td>${call.category}</td>
            <td class="status-${call.status}">${call.status}</td>
            <td>
                <button class="btn-view" data-id="${call.id}">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    addViewButtonListeners();
}

/**
 * Adds event listeners to view buttons
 */
function addViewButtonListeners() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            if (!isNaN(callId)) {
                viewCallDetails(callId);
            }
        });
    });
}

/**
 * Views details of a specific call
 * @param {number} callId - ID of the call to view
 */
function viewCallDetails(callId) {
    try {
        const calls = getCalls();
        const call = calls.find(c => c.id === callId);
        
        if (call) {
            showCallDetailsModal(call);
        } else {
            alert('Call not found');
        }
    } catch (error) {
        console.error('Error viewing call details:', error);
        alert('Failed to load call details. Please try again.');
    }
}

/**
 * Shows call details in a modal
 * @param {Object} call - Call object to display
 */
function showCallDetailsModal(call) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Call Details</h3>
            <div class="call-details">
                <p><strong>Agent:</strong> ${call.agentName}</p>
                <p><strong>Customer:</strong> ${call.customerContact}</p>
                <p><strong>Item:</strong> ${call.item}</p>
                <p><strong>Category:</strong> ${call.category}</p>
                <p><strong>Status:</strong> <span class="status-${call.status}">${call.status}</span></p>
                <p><strong>Description:</strong> ${call.description}</p>
                <p><strong>Time:</strong> ${formatTime(call.timestamp)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Close modal handler
    const closeModal = modal.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        });
    }
}

/**
 * Formats a timestamp to time string
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
    try {
        return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
        console.error('Error formatting time:', error);
        return timestamp;
    }
}