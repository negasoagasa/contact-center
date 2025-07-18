/**
 * Back Office Module for Gadaa Bank Contact Center
 * Handles call management, escalations, and responses for back office staff
 */

// Constants
const ITEM_CATEGORIES = {
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

const DEPARTMENT_MAP = {
    'finance': 'Finance',
    'shareholder': 'Shareholder',
    'digital': 'Digital',
    'backoffice': 'Back Office'
};

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', initializeBackOffice);

/**
 * Initializes the Back Office module
 */
function initializeBackOffice() {
    try {
        loadRequiredScripts();
        setupCurrentUser();
        setupNavigation();
        setupFormHandlers();
        initializeDashboard();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize Back Office module. Please refresh the page.');
    }
}

/**
 * Loads required scripts dynamically
 */
function loadRequiredScripts() {
    const scripts = [
        { src: 'js/profile.js', id: 'profileScript' },
        { src: 'js/notifications.js', id: 'notificationScript' }
    ];

    scripts.forEach(script => {
        if (!document.getElementById(script.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.id = script.id;
            document.body.appendChild(scriptElement);
        }
    });
}

/**
 * Sets up the current user information
 */
function setupCurrentUser() {
    try {
        const currentUser = getCurrentUser();
        if (currentUser) {
            document.getElementById('currentBackOfficeName').textContent = currentUser.name;
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
 * Sets up navigation event listeners
 */
function setupNavigation() {
    const navItems = {
        'boDashboardLink': () => {
            showView('boDashboardView');
            updateDashboardStats();
        },
        'boEscalatedLink': () => {
            showView('boEscalatedView');
            loadEscalatedCalls();
        },
        'boPendingLink': () => {
            showView('boPendingView');
            loadPendingCalls();
        },
        'boCallLogLink': () => showView('boCallLogView')
    };

    Object.entries(navItems).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
        }
    });

    // Category selection
    const callItemSelect = document.getElementById('boCallItem');
    if (callItemSelect) {
        callItemSelect.addEventListener('change', function() {
            updateCategoryOptions(this.value, 'boCallCategory');
        });
    }

    setupProfileHandler();
}

/**
 * Sets up form event handlers
 */
function setupFormHandlers() {
    // Response form
    const responseForm = document.getElementById('responseForm');
    if (responseForm) {
        responseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitResponse();
        });
    }

    // Call log form
    const callLogForm = document.getElementById('boCallLogForm');
    if (callLogForm) {
        callLogForm.addEventListener('submit', (e) => {
            e.preventDefault();
            logBackofficeCall();
        });
    }

    // Response status change handler
    const responseStatus = document.getElementById('responseStatus');
    if (responseStatus) {
        responseStatus.addEventListener('change', function() {
            const escalateGroup = document.getElementById('departmentEscalationGroup');
            if (escalateGroup) {
                escalateGroup.style.display = this.value === 'escalated' ? 'block' : 'none';
            }
        });
    }

    // Logout
    const logoutLink = document.getElementById('backOfficeLogoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // Close modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const modal = document.getElementById('responseModal');
            if (modal) modal.style.display = 'none';
        });
    }
}

/**
 * Sets up profile handler
 */
function setupProfileHandler() {
    const profileLink = document.getElementById('backOfficeProfileLink');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof viewProfile === 'function') {
                viewProfile();
            } else {
                loadProfileScript();
            }
        });
    }
}

/**
 * Loads profile script dynamically
 */
function loadProfileScript() {
    const profileScript = document.createElement('script');
    profileScript.src = 'js/profile.js';
    profileScript.onload = () => {
        if (typeof viewProfile === 'function') {
            viewProfile();
        } else {
            alert('Profile functionality failed to load. Please refresh the page.');
        }
    };
    document.body.appendChild(profileScript);
}

/**
 * Shows the specified view and hides others
 * @param {string} viewId - ID of the view to show
 */
function showView(viewId) {
    const views = document.querySelectorAll('.main-content > div');
    views.forEach(view => {
        view.style.display = view.id === viewId ? 'block' : 'none';
    });
}

/**
 * Updates dashboard statistics
 */
function updateDashboardStats() {
    try {
        const calls = getCalls();
        const today = new Date().toISOString().split('T')[0];
        
        const escalatedCalls = calls.filter(call => call.status === 'escalated');
        const pendingCalls = calls.filter(call => call.status === 'pending');
        const solvedToday = calls.filter(call => call.status === 'solved' && call.date === today);
        
        setElementText('boTotalEscalated', escalatedCalls.length);
        setElementText('boPendingResponse', pendingCalls.length);
        setElementText('boSolvedToday', solvedToday.length);
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
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
 * Sets text content of an element if it exists
 * @param {string} id - Element ID
 * @param {string} text - Text to set
 */
function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Loads recently escalated calls
 */
function loadRecentEscalatedCalls() {
    try {
        const calls = getCalls();
        const escalatedCalls = calls
            .filter(call => call.status === 'escalated')
            .slice(-5)
            .reverse();
        
        renderCallTable('#boRecentEscalatedTable', escalatedCalls);
    } catch (error) {
        console.error('Error loading recent escalated calls:', error);
    }
}

/**
 * Loads escalated calls
 */
function loadEscalatedCalls() {
    try {
        const calls = getCalls();
        const escalatedCalls = calls.filter(call => 
            (call.status === 'escalated' && call.escalatedTo === 'backoffice')
        ).reverse();
        
        renderCallTable('#boEscalatedTable', escalatedCalls, true);
    } catch (error) {
        console.error('Error loading escalated calls:', error);
    }
}

/**
 * Loads pending calls
 */
function loadPendingCalls() {
    try {
        const calls = getCalls();
        const pendingCalls = calls
            .filter(call => call.status === 'pending')
            .reverse();
        
        renderCallTable('#boPendingTable', pendingCalls, true);
    } catch (error) {
        console.error('Error loading pending calls:', error);
    }
}

/**
 * Renders a table of calls
 * @param {string} tableSelector - CSS selector for the table
 * @param {Array} calls - Array of call objects
 * @param {boolean} showDirection - Whether to show call direction column
 */
function renderCallTable(tableSelector, calls, showDirection = false) {
    try {
        const tableBody = document.querySelector(`${tableSelector} tbody`);
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        calls.forEach(call => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTime(call.timestamp)}</td>
                <td>${call.agentName}</td>
                <td>${call.customerContact}</td>
                <td>${call.item}</td>
                <td>${call.category || 'N/A'}</td>
                <td class="status-${call.status}">${call.status}</td>
                <td>
                    <button class="btn-view" data-id="${call.id}">View</button>
                    ${['escalated', 'pending'].includes(call.status) ? 
                      `<button class="btn-respond" data-id="${call.id}">Respond</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        addCallActionListeners();
    } catch (error) {
        console.error('Error rendering call table:', error);
    }
}

/**
 * Adds event listeners to call action buttons
 */
function addCallActionListeners() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            if (!isNaN(callId)) {
                viewCallDetails(callId);
            }
        });
    });
    
    // Respond buttons
    document.querySelectorAll('.btn-respond').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            if (!isNaN(callId)) {
                openResponseModal(callId);
            }
        });
    });
}

/**
 * Gets categories for a specific item
 * @param {string} item - The item to get categories for
 * @returns {Array} Array of categories
 */
function getCategoriesForItem(item) {
    return ITEM_CATEGORIES[item] || ['New case'];
}

/**
 * Updates category options based on selected item
 * @param {string} selectedItem - The selected item
 * @param {string} categorySelectId - ID of the category select element
 */
function updateCategoryOptions(selectedItem, categorySelectId) {
    try {
        const categorySelect = document.getElementById(categorySelectId);
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
 * Logs a new back office call
 */
function logBackofficeCall() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('You must be logged in to log a call');
            return;
        }

        const callData = {
            direction: 'outbound',
            customerContact: document.getElementById('boCustomerContact').value.trim(),
            item: document.getElementById('boCallItem').value,
            category: document.getElementById('boCallCategory').value,
            description: document.getElementById('boCallDescription').value.trim(),
            status: document.getElementById('boCallStatus').value,
            agentId: currentUser.id,
            agentName: currentUser.name,
            isBackofficeCall: true
        };

        // Validation
        const validationErrors = validateCallData(callData);
        if (validationErrors.length > 0) {
            alert(validationErrors.join('\n'));
            return;
        }

        // Save call
        const calls = getCalls();
        const newCall = {
            id: calls.length > 0 ? Math.max(...calls.map(c => c.id)) + 1 : 1,
            ...callData,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            recordings: []
        };
        
        calls.push(newCall);
        saveCalls(calls);
        
        // Reset form
        const callLogForm = document.getElementById('boCallLogForm');
        if (callLogForm) callLogForm.reset();
        
        const categorySelect = document.getElementById('boCallCategory');
        if (categorySelect) categorySelect.disabled = true;
        
        alert('Call logged successfully!');
        
        // Refresh view if on dashboard
        if (document.getElementById('boDashboardView').style.display === 'block') {
            loadRecentEscalatedCalls();
        }
    } catch (error) {
        console.error('Error logging back office call:', error);
        alert('Failed to log call. Please try again.');
    }
}

/**
 * Validates call data
 * @param {Object} callData - Call data to validate
 * @returns {Array} Array of error messages
 */
function validateCallData(callData) {
    const errors = [];
    
    if (!callData.customerContact || callData.customerContact.length < 3) {
        errors.push('Customer contact is required and must be at least 3 characters');
    }
    
    if (!callData.item) {
        errors.push('Item selection is required');
    }
    
    if (!callData.category) {
        errors.push('Category selection is required');
    }
    
    if (!callData.description || callData.description.length < 10) {
        errors.push('Description is required and must be at least 10 characters');
    }
    
    return errors;
}

/**
 * Saves calls to localStorage
 * @param {Array} calls - Array of call objects
 */
function saveCalls(calls) {
    try {
        localStorage.setItem('calls', JSON.stringify(calls));
    } catch (error) {
        console.error('Error saving calls:', error);
        throw error;
    }
}

/**
 * Opens response modal for a specific call
 * @param {number} callId - ID of the call to respond to
 */
function openResponseModal(callId) {
    try {
        const calls = getCalls();
        const call = calls.find(c => c.id === callId);
        
        if (!call) {
            alert('Call not found');
            return;
        }

        const responseCallId = document.getElementById('responseCallId');
        const responseText = document.getElementById('responseText');
        const escalateGroup = document.getElementById('departmentEscalationGroup');
        const responseModal = document.getElementById('responseModal');
        
        if (responseCallId) responseCallId.value = callId;
        if (responseText) responseText.value = '';
        if (escalateGroup) {
            escalateGroup.style.display = call.escalatedTo === 'backoffice' ? 'block' : 'none';
        }
        if (responseModal) responseModal.style.display = 'block';
    } catch (error) {
        console.error('Error opening response modal:', error);
        alert('Failed to open response form. Please try again.');
    }
}

/**
 * Submits a response to a call
 */
function submitResponse() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Session expired. Please login again.');
            return;
        }

        const callId = parseInt(document.getElementById('responseCallId').value);
        const responseText = document.getElementById('responseText').value.trim();
        const newStatus = document.getElementById('responseStatus').value;
        const escalateTo = document.getElementById('escalateToDepartment').value;

        if (!responseText) {
            alert('Please enter your response');
            return;
        }

        let calls = getCalls();
        const callIndex = calls.findIndex(c => c.id === callId);

        if (callIndex === -1) {
            alert('Call not found. Please refresh and try again.');
            return;
        }

        // Update call status
        if (newStatus === 'escalated' && escalateTo) {
            calls[callIndex].status = 'escalated';
            calls[callIndex].escalatedTo = escalateTo;
            calls[callIndex].escalationPath = calls[callIndex].escalationPath || [];
            calls[callIndex].escalationPath.push({
                from: currentUser.role,
                to: escalateTo,
                timestamp: new Date().toISOString()
            });
        } else {
            calls[callIndex].status = newStatus;
        }

        // Add response
        calls[callIndex].responses = calls[callIndex].responses || [];
        calls[callIndex].responses.push({
            userId: currentUser.id,
            userName: currentUser.name,
            department: currentUser.role,
            text: responseText,
            timestamp: new Date().toISOString(),
            forBackoffice: currentUser.role === 'backoffice'
        });

        // Save and update UI
        saveCalls(calls);
        
        const responseModal = document.getElementById('responseModal');
        if (responseModal) responseModal.style.display = 'none';
        
        // Refresh current view
        const activeView = document.querySelector('.main-content > div[style="display: block;"]');
        if (activeView) {
            switch(activeView.id) {
                case 'boDashboardView':
                    updateDashboardStats();
                    loadRecentEscalatedCalls();
                    break;
                case 'boEscalatedView':
                    loadEscalatedCalls();
                    break;
                case 'boPendingView':
                    loadPendingCalls();
                    break;
            }
        }
    } catch (error) {
        console.error('Error submitting response:', error);
        alert('Failed to submit response. Please try again.');
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

/**
 * Formats a department name
 * @param {string} dept - Department code
 * @returns {string} Formatted department name
 */
function formatDepartment(dept) {
    return DEPARTMENT_MAP[dept] || dept;
}

/**
 * Views details of a specific call
 * @param {number} callId - ID of the call to view
 */
function viewCallDetails(callId) {
    try {
        const calls = getCalls();
        const call = calls.find(c => c.id === callId);
        
        if (!call) {
            alert('Call not found');
            return;
        }

        let detailsHTML = `
            <div class="call-details">
                <h3>Call #${call.id} (${call.isBackofficeCall ? 'Back Office' : 'Agent'})</h3>
                <p><strong>Agent:</strong> ${call.agentName}</p>
                <p><strong>Customer:</strong> ${call.customerContact}</p>
                <p><strong>Date/Time:</strong> ${new Date(call.timestamp).toLocaleString()}</p>
                <p><strong>Item:</strong> ${call.item}</p>
                <p><strong>Category:</strong> ${call.category || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-${call.status}">${call.status}</span></p>
                <p><strong>Description:</strong> ${call.description}</p>
        `;

        // Show escalation path if available
        if (call.escalationPath) {
            detailsHTML += `<h4>Escalation Path</h4><ul>`;
            call.escalationPath.forEach(step => {
                detailsHTML += `<li>From ${step.from} to ${step.to} (${new Date(step.timestamp).toLocaleTimeString()})</li>`;
            });
            detailsHTML += `</ul>`;
        }

        // Show responses if available
        if (call.responses?.length > 0) {
            detailsHTML += `<h4>Responses</h4>`;
            call.responses.forEach(response => {
                detailsHTML += `
                    <div class="response ${response.forBackoffice ? 'department-response' : ''}">
                        <p><strong>${response.userName} (${response.department})</strong></p>
                        <p><em>${new Date(response.timestamp).toLocaleString()}</em></p>
                        <p>${response.text}</p>
                    </div>
                `;
            });
        }

        // Add action buttons if pending response
        if (call.status === 'pending' && call.pendingResponse) {
            detailsHTML += `
                <div class="action-buttons">
                    <button class="btn-approve" data-id="${call.id}">Approve Solution</button>
                    <button class="btn-request-clarification" data-id="${call.id}">Request Clarification</button>
                </div>
            `;
        }

        detailsHTML += `</div>`;

        // Display in modal
        const modal = getCallDetailsModal();
        const contentDiv = modal.querySelector('#callDetailsContent');
        if (contentDiv) contentDiv.innerHTML = detailsHTML;
        modal.style.display = 'block';

        // Add event listeners for action buttons
        const approveBtn = modal.querySelector('.btn-approve');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                approveSolution(callId);
                modal.style.display = 'none';
            });
        }

        const clarificationBtn = modal.querySelector('.btn-request-clarification');
        if (clarificationBtn) {
            clarificationBtn.addEventListener('click', () => {
                requestClarification(callId);
                modal.style.display = 'none';
            });
        }
    } catch (error) {
        console.error('Error viewing call details:', error);
        alert('Failed to load call details. Please try again.');
    }
}

/**
 * Gets or creates the call details modal
 * @returns {HTMLElement} The modal element
 */
function getCallDetailsModal() {
    let modal = document.getElementById('callDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'callDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div id="callDetailsContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeModal = modal.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }
    return modal;
}

/**
 * Approves a solution for a call
 * @param {number} callId - ID of the call to approve
 */
function approveSolution(callId) {
    try {
        let calls = getCalls();
        const callIndex = calls.findIndex(c => c.id === callId);
        
        if (callIndex !== -1) {
            calls[callIndex].status = 'solved';
            calls[callIndex].pendingResponse = false;
            saveCalls(calls);
            loadEscalatedCalls();
        }
    } catch (error) {
        console.error('Error approving solution:', error);
        alert('Failed to approve solution. Please try again.');
    }
}

/**
 * Requests clarification for a call
 * @param {number} callId - ID of the call to request clarification for
 */
function requestClarification(callId) {
    try {
        let calls = getCalls();
        const callIndex = calls.findIndex(c => c.id === callId);
        
        if (callIndex !== -1) {
            calls[callIndex].status = 'escalated';
            calls[callIndex].pendingResponse = false;
            
            // Find the last backoffice response
            const lastResponse = calls[callIndex].responses
                .filter(r => r.forBackoffice)
                .slice(-1)[0];
            
            if (lastResponse) {
                calls[callIndex].escalatedTo = lastResponse.department;
            }
            
            saveCalls(calls);
            loadEscalatedCalls();
        }
    } catch (error) {
        console.error('Error requesting clarification:', error);
        alert('Failed to request clarification. Please try again.');
    }
}

/**
 * Initializes the dashboard
 */
function initializeDashboard() {
    updateDashboardStats();
    loadRecentEscalatedCalls();
}