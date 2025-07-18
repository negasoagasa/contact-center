document.addEventListener('DOMContentLoaded', function() {
    // Load required scripts
    const scripts = [
        {src: 'js/profile.js'},
        {src: 'js/notifications.js'}
    ];
    
    scripts.forEach(script => {
        const el = document.createElement('script');
        el.src = script.src;
        document.body.appendChild(el);
    });

    // Set current user
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('currentFinanceName').textContent = currentUser.name;
    }
    
    // Navigation
    document.getElementById('financeDashboardLink').addEventListener('click', function(e) {
        e.preventDefault();
        showView('financeDashboardView');
        updateDashboardStats();
    });
    
    document.getElementById('financeEscalatedLink').addEventListener('click', function(e) {
        e.preventDefault();
        showView('financeEscalatedView');
        loadEscalatedCalls();
    });
    
    // Form submission
    const responseForm = document.getElementById('financeResponseForm');
    if (responseForm) {
        responseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitDepartmentResponse('finance');
        });
    }
    
    // Logout
    document.getElementById('financeLogoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Profile
    document.getElementById('financeProfileLink').addEventListener('click', function(e) {
        e.preventDefault();
        viewProfile();
    });
    
    // Close modal
    const closeModal = document.querySelector('#financeResponseModal .close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('financeResponseModal').style.display = 'none';
        });
    }
    
    // Initialize dashboard
    updateDashboardStats();
    loadEscalatedCalls();
});

// View management
function showView(viewId) {
    document.querySelectorAll('.main-content > div').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
}

// Dashboard statistics
function updateDashboardStats() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    const escalatedCalls = calls.filter(call => call.status === 'escalated' && call.escalatedTo === 'finance');
    const pendingCalls = calls.filter(call => call.status === 'pending' && call.escalatedTo === 'finance');
    const solvedToday = calls.filter(call => call.status === 'solved' && call.escalatedTo === 'finance' && call.date === today);
    
    document.getElementById('financeTotalEscalated').textContent = escalatedCalls.length;
    document.getElementById('financePendingResponse').textContent = pendingCalls.length;
    document.getElementById('financeSolvedToday').textContent = solvedToday.length;
}

// Call loading functions
function loadEscalatedCalls() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const escalatedCalls = calls.filter(call => 
        (call.status === 'escalated' || call.status === 'pending') && 
        call.escalatedTo === 'finance'
    ).reverse();
    
    renderCallTable('#financeEscalatedTable', escalatedCalls);
}

function loadRecentEscalatedCalls() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const escalatedCalls = calls.filter(call => 
        call.status === 'escalated' && 
        call.escalatedTo === 'finance'
    ).slice(-5).reverse();
    
    renderCallTable('#financeRecentEscalatedTable', escalatedCalls);
}

function renderCallTable(tableSelector, calls) {
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
                <button class="btn-respond" data-id="${call.id}">Respond</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    addCallActionListeners();
}

// Event listeners for call actions
function addCallActionListeners() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            viewCallDetails(callId);
        });
    });
    
    // Respond buttons
    document.querySelectorAll('.btn-respond').forEach(btn => {
        btn.addEventListener('click', function() {
            const callId = parseInt(this.getAttribute('data-id'));
            openResponseModal(callId);
        });
    });
}

// Call details view
function viewCallDetails(callId) {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const call = calls.find(c => c.id === callId);
    
    if (!call) return;

    let detailsHTML = `
        <div class="call-details">
            <h3>Call #${call.id}</h3>
            <p><strong>Agent:</strong> ${call.agentName}</p>
            <p><strong>Customer:</strong> ${call.customerContact}</p>
            <p><strong>Item:</strong> ${call.item}</p>
            <p><strong>Category:</strong> ${call.category || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-${call.status}">${call.status}</span></p>
            <p><strong>Description:</strong> ${call.description}</p>
    `;

    // Show responses if available
    if (call.responses?.length > 0) {
        detailsHTML += `<h4>Responses</h4>`;
        call.responses.forEach(response => {
            detailsHTML += `
                <div class="response">
                    <p><strong>${response.userName} (${response.department})</strong></p>
                    <p><em>${formatTime(response.timestamp)}</em></p>
                    <p>${response.text}</p>
                </div>
            `;
        });
    }

    detailsHTML += `</div>`;

    // Display in modal
    const modal = document.getElementById('callDetailsModal') || createModal();
    modal.querySelector('#callDetailsContent').innerHTML = detailsHTML;
    modal.style.display = 'block';
}

function createModal() {
    const modal = document.createElement('div');
    modal.id = 'callDetailsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="callDetailsContent"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    return modal;
}

// Response handling
function openResponseModal(callId) {
    const modal = document.getElementById('financeResponseModal');
    if (!modal) return;
    
    document.getElementById('financeResponseCallId').value = callId;
    document.getElementById('financeResponseText').value = '';
    modal.style.display = 'block';
}

function submitDepartmentResponse(department) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Session expired. Please login again.');
        return;
    }

    const callId = parseInt(document.getElementById('financeResponseCallId').value);
    const responseText = document.getElementById('financeResponseText').value.trim();

    if (!responseText) {
        alert('Please enter your response');
        return;
    }

    let calls = JSON.parse(localStorage.getItem('calls')) || [];
    const callIndex = calls.findIndex(c => c.id === callId);

    if (callIndex === -1) {
        alert('Call not found. Please refresh and try again.');
        return;
    }

    // Update call status and add response
    calls[callIndex].status = 'pending';
    calls[callIndex].pendingResponse = true;
    
    if (!calls[callIndex].responses) {
        calls[callIndex].responses = [];
    }

    calls[callIndex].responses.push({
        userId: currentUser.id,
        userName: currentUser.name,
        department: department,
        text: responseText,
        timestamp: new Date().toISOString(),
        forBackoffice: true
    });

    // Save and update UI
    localStorage.setItem('calls', JSON.stringify(calls));
    document.getElementById('financeResponseModal').style.display = 'none';
    loadEscalatedCalls();
    alert('Response submitted to Back Office successfully!');
}

// Utility function
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}