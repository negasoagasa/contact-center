document.addEventListener('DOMContentLoaded', function() {
    // Set current user name


    const script = document.createElement('script');
    script.src = 'js/profile.js';
    document.body.appendChild(script);


    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('currentSupervisorName').textContent = currentUser.name;
    }
    
    // Navigation
    document.getElementById('supervisorDashboardLink').addEventListener('click', function(e) {
        e.preventDefault();
        showView('supervisorDashboardView');
        updateDashboardStats();
    });
    
    document.getElementById('supervisorAllCallsLink').addEventListener('click', function(e) {
        e.preventDefault();
        showView('supervisorAllCallsView');
        loadAllCalls();
    });
    
    document.getElementById('supervisorAgentsLink').addEventListener('click', function(e) {
        e.preventDefault();
        showView('supervisorAgentsView');
        loadAgentPerformance();
    });
    
    // Apply filters
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        loadAllCalls();
    });
    
    // Logout
    document.getElementById('supervisorLogoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Profile
    document.getElementById('supervisorProfileLink').addEventListener('click', function(e) {
        e.preventDefault();
        viewProfile();
    });
    
    // Close modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('callDetailsModal').style.display = 'none';
    });
    
    // Initialize dashboard
    updateDashboardStats();
    loadRecentCalls();
});

function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.main-content > div').forEach(view => {
        view.style.display = 'none';
    });
    
    // Show selected view
    document.getElementById(viewId).style.display = 'block';
}

function updateDashboardStats() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    const todayCalls = calls.filter(call => call.date === today);
    const totalCalls = todayCalls.length;
    const escalatedCalls = todayCalls.filter(call => call.status === 'escalated').length;
    const solvedCalls = todayCalls.filter(call => call.status === 'solved').length;
    const pendingCalls = todayCalls.filter(call => call.status === 'pending').length;
    
    document.getElementById('supervisorTotalCalls').textContent = totalCalls;
    document.getElementById('supervisorEscalatedCalls').textContent = escalatedCalls;
    document.getElementById('supervisorSolvedCalls').textContent = solvedCalls;
    document.getElementById('supervisorPendingCalls').textContent = pendingCalls;
}

function loadRecentCalls() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const recentCalls = calls.slice(-5).reverse(); // Get last 5 calls
    
    const tableBody = document.querySelector('#supervisorRecentCallsTable tbody');
    tableBody.innerHTML = '';
    
    recentCalls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.agentName}</td>
            <td>${call.customerContact}</td>
            <td>${call.item}</td>
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

function loadAllCalls() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const statusFilter = document.getElementById('callStatusFilter').value;
    const dateFilter = document.getElementById('callDateFilter').value;
    
    let filteredCalls = calls;
    
    if (statusFilter !== 'all') {
        filteredCalls = filteredCalls.filter(call => call.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredCalls = filteredCalls.filter(call => call.date === dateFilter);
    }
    
    filteredCalls = filteredCalls.reverse(); // Newest first
    
    const tableBody = document.querySelector('#supervisorAllCallsTable tbody');
    tableBody.innerHTML = '';
    
    filteredCalls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.agentName}</td>
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

function loadAgentPerformance() {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const agents = users.filter(user => user.role === 'agent');
    
    const agentStats = agents.map(agent => {
        const agentCalls = calls.filter(call => call.agentId === agent.id);
        return {
            id: agent.id,
            name: agent.name,
            total: agentCalls.length,
            solved: agentCalls.filter(call => call.status === 'solved').length,
            escalated: agentCalls.filter(call => call.status === 'escalated').length,
            pending: agentCalls.filter(call => call.status === 'pending').length,
            abandoned: agentCalls.filter(call => call.status === 'abandoned').length
        };
    });
    
    const tableBody = document.querySelector('#supervisorAgentsTable tbody');
    tableBody.innerHTML = '';
    
    agentStats.forEach(agent => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${agent.name}</td>
            <td>${agent.total}</td>
            <td>${agent.solved}</td>
            <td>${agent.escalated}</td>
            <td>${agent.pending}</td>
            <td>${agent.abandoned}</td>
            <td>
                <button class="btn-view" data-id="${agent.id}">Details</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const agentId = parseInt(this.getAttribute('data-id'));
            viewAgentDetails(agentId);
        });
    });
}

function viewCallDetails(callId) {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const call = calls.find(c => c.id === callId);
    
    if (call) {
        let detailsHTML = `
            <p><strong>Agent:</strong> ${call.agentName}</p>
            <p><strong>Customer:</strong> ${call.customerContact}</p>
            <p><strong>Time:</strong> ${formatDateTime(call.timestamp)}</p>
            <p><strong>Item:</strong> ${call.item}</p>
            <p><strong>Category:</strong> ${call.category}</p>
            <p><strong>Status:</strong> <span class="status-${call.status}">${call.status}</span></p>
            <p><strong>Description:</strong> ${call.description}</p>
        `;
        
        if (call.escalatedTo) {
            detailsHTML += `<p><strong>Escalated To:</strong> ${formatDepartment(call.escalatedTo)}</p>`;
        }
        
        if (call.responses && call.responses.length > 0) {
            detailsHTML += `<h3>Responses</h3>`;
            call.responses.forEach(response => {
                detailsHTML += `
                    <div class="response">
                        <p><strong>${response.userName}</strong> (${formatTime(response.timestamp)})</p>
                        <p>${response.text}</p>
                    </div>
                `;
            });
        }
        
        document.getElementById('callDetailsContent').innerHTML = detailsHTML;
        document.getElementById('callDetailsModal').style.display = 'block';
    }
}

function viewAgentDetails(agentId) {
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const agent = users.find(u => u.id === agentId);
    if (!agent) return;
    
    const agentCalls = calls.filter(call => call.agentId === agentId);
    
    let detailsHTML = `
        <h3>${agent.name} - Performance Details</h3>
        <p><strong>Total Calls:</strong> ${agentCalls.length}</p>
        <p><strong>Solved Calls:</strong> ${agentCalls.filter(call => call.status === 'solved').length}</p>
        <p><strong>Escalated Calls:</strong> ${agentCalls.filter(call => call.status === 'escalated').length}</p>
        <p><strong>Pending Calls:</strong> ${agentCalls.filter(call => call.status === 'pending').length}</p>
        <p><strong>Abandoned Calls:</strong> ${agentCalls.filter(call => call.status === 'abandoned').length}</p>
        
        <h4>Recent Calls</h4>
        <table class="agent-calls-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const recentCalls = agentCalls.slice(-5).reverse();
    recentCalls.forEach(call => {
        detailsHTML += `
            <tr>
                <td>${formatTime(call.timestamp)}</td>
                <td>${call.customerContact}</td>
                <td>${call.item}</td>
                <td class="status-${call.status}">${call.status}</td>
            </tr>
        `;
    });
    
    detailsHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('callDetailsContent').innerHTML = detailsHTML;
    document.getElementById('callDetailsModal').style.display = 'block';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function formatDepartment(dept) {
    const deptMap = {
        'finance': 'Finance',
        'shareholder': 'Shareholder',
        'digital': 'Digital',
        'backoffice': 'Back Office'
    };
    return deptMap[dept] || dept;
}