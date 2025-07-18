// scripts/admin.js - Rewritten

document.addEventListener('DOMContentLoaded', async function() {
    // Load profile script
    const script = document.createElement('script');
    script.src = 'scripts/profile.js';
    document.body.appendChild(script);

    // Set current user
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('currentUserName').textContent = currentUser.name;
    }
    
    // Navigation setup with event delegation
    document.addEventListener('click', function(e) {
        if (e.target.matches('#dashboardLink')) {
            e.preventDefault();
            showView('dashboardView');
            updateDashboardStats();
        }
        else if (e.target.matches('#userManagementLink')) {
            e.preventDefault();
            showView('userManagementView');
            loadUsers();
        }
        else if (e.target.matches('#reportsLink')) {
            e.preventDefault();
            showView('reportsView');
            document.getElementById('reportDate').valueAsDate = new Date();
            generateReport();
        }
        else if (e.target.matches('#addUserBtn')) {
            document.getElementById('addUserModal').style.display = 'block';
        }
        else if (e.target.matches('.close-modal')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
        else if (e.target.matches('#logoutLink')) {
            e.preventDefault();
            authService.logout();
            window.location.href = 'index.html';
        }
        else if (e.target.matches('#profileLink')) {
            e.preventDefault();
            viewProfile();
        }
        else if (e.target.matches('#generateReportBtn')) {
            generateReport();
        }
        else if (e.target.matches('#exportReportBtn')) {
            exportToCSV();
        }
        else if (e.target.matches('.btn-edit[data-id]')) {
            const userId = e.target.getAttribute('data-id');
            editUser(userId);
        }
        else if (e.target.matches('.btn-delete[data-id]')) {
            const userId = e.target.getAttribute('data-id');
            deleteUser(userId);
        }
    });

    // Form submissions
    document.getElementById('addUserForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        await addNewUser();
    });

    // Initialize dashboard
    await updateDashboardStats();
});

function showView(viewId) {
    document.querySelectorAll('.main-content > div').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
}

async function updateDashboardStats() {
    try {
        const stats = await callService.getDashboardStats();
        
        document.getElementById('totalCalls').textContent = stats.totalCalls;
        document.getElementById('escalatedCalls').textContent = stats.escalatedCalls;
        document.getElementById('solvedCalls').textContent = stats.solvedCalls;
        document.getElementById('pendingCalls').textContent = stats.pendingCalls;
        document.getElementById('abandonedCalls').textContent = stats.abandonedCalls;
        
        renderRecentActivity(stats.recentCalls);
    } catch (error) {
        console.error('Error updating dashboard:', error);
        alert('Failed to load dashboard data');
    }
}

function renderRecentActivity(calls) {
    const tableBody = document.querySelector('#recentActivityTable tbody');
    tableBody.innerHTML = '';
    
    calls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.isBackofficeCall ? 'Back Office' : call.agentName}</td>
            <td>${call.customerContact}</td>
            <td>${call.item}</td>
            <td class="status-${call.status}">${call.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadUsers() {
    try {
        const users = await userService.getUsers();
        const roleFilter = document.getElementById('userRoleFilter').value;
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        
        let filteredUsers = users;
        
        if (roleFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) || 
                user.username.toLowerCase().includes(searchTerm) ||
                (user.email && user.email.toLowerCase().includes(searchTerm))
            );
        }
        
        const tableBody = document.getElementById('userTableBody');
        tableBody.innerHTML = '';
        
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user._id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${formatRole(user.role)}</td>
                <td>${user.department || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.phone || ''}</td>
                <td>
                    <button class="btn-edit" data-id="${user._id}">Edit</button>
                    <button class="btn-delete" data-id="${user._id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users');
    }
}

async function addNewUser() {
    try {
        const newUser = {
            name: document.getElementById('newUserName').value,
            username: document.getElementById('newUserUsername').value,
            password: document.getElementById('newUserPassword').value,
            role: document.getElementById('newUserRole').value,
            department: document.getElementById('newUserDepartment').value,
            email: document.getElementById('newUserEmail').value,
            phone: document.getElementById('newUserPhone').value
        };
        
        await userService.createUser(newUser);
        
        document.getElementById('addUserModal').style.display = 'none';
        document.getElementById('addUserForm').reset();
        await loadUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        alert(error.message || 'Failed to add user');
    }
}

async function editUser(userId) {
    try {
        const users = await userService.getUsers();
        const user = users.find(u => u._id === userId);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Populate modal
        document.getElementById('addUserModal').style.display = 'block';
        document.getElementById('addUserForm').reset();
        
        // Fill form
        document.getElementById('newUserName').value = user.name;
        document.getElementById('newUserUsername').value = user.username;
        document.getElementById('newUserPassword').value = '********'; // Placeholder
        document.getElementById('newUserRole').value = user.role;
        document.getElementById('newUserDepartment').value = user.department || '';
        document.getElementById('newUserEmail').value = user.email || '';
        document.getElementById('newUserPhone').value = user.phone || '';
        
        // Change button text
        document.querySelector('#addUserForm button[type="submit"]').textContent = 'Update User';
        
        // Update form handler
        const form = document.getElementById('addUserForm');
        form.onsubmit = async function(e) {
            e.preventDefault();
            
            try {
                const updatedUser = {
                    name: document.getElementById('newUserName').value,
                    username: document.getElementById('newUserUsername').value,
                    role: document.getElementById('newUserRole').value,
                    department: document.getElementById('newUserDepartment').value,
                    email: document.getElementById('newUserEmail').value,
                    phone: document.getElementById('newUserPhone').value
                };
                
                // Only update password if changed (not the placeholder)
                const password = document.getElementById('newUserPassword').value;
                if (password !== '********') {
                    updatedUser.password = password;
                }
                
                await userService.updateUser(userId, updatedUser);
                
                document.getElementById('addUserModal').style.display = 'none';
                document.getElementById('addUserForm').reset();
                await loadUsers();
                
                // Reset form handler
                form.onsubmit = function(e) {
                    e.preventDefault();
                    addNewUser();
                };
            } catch (error) {
                console.error('Error updating user:', error);
                alert(error.message || 'Failed to update user');
            }
        };
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Failed to load user data');
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await userService.deleteUser(userId);
            await loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    }
}

async function generateReport() {
    try {
        const period = document.getElementById('reportPeriod').value;
        const dateInput = document.getElementById('reportDate').value;
        
        if (!dateInput) {
            alert('Please select a date');
            return;
        }
        
        const report = await reportService.generateReport(period, dateInput);
        
        document.getElementById('reportTitle').textContent = report.title;
        document.getElementById('reportTotalCalls').textContent = report.totalCalls;
        document.getElementById('reportSolvedCalls').textContent = report.solvedCalls;
        document.getElementById('reportEscalatedCalls').textContent = report.escalatedCalls;
        document.getElementById('reportPendingCalls').textContent = report.pendingCalls;
        
        renderReportCalls(report.calls);
        
        document.getElementById('exportReportBtn').disabled = report.calls.length === 0;
        sessionStorage.setItem('currentReport', JSON.stringify(report));
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report');
    }
}

function renderReportCalls(calls) {
    const tableBody = document.querySelector('#reportCallsTable tbody');
    tableBody.innerHTML = '';
    
    const recentCalls = calls.slice(-10).reverse();
    
    recentCalls.forEach(call => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatTime(call.timestamp)}</td>
            <td>${call.agentName}</td>
            <td>${call.customerContact}</td>
            <td>${call.item}</td>
            <td>${call.category}</td>
            <td class="status-${call.status}">${call.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

function exportToCSV() {
    const reportData = JSON.parse(sessionStorage.getItem('currentReport'));
    if (!reportData || reportData.calls.length === 0) {
        alert('No data to export');
        return;
    }
    
    let csv = 'Agent Name,Customer Contact,Item,Case Category,Description,Status,Date,Time\n';
    
    reportData.calls.forEach(call => {
        const dateTime = new Date(call.timestamp);
        const date = dateTime.toISOString().split('T')[0];
        const time = dateTime.toTimeString().split(' ')[0];
        
        csv += `"${call.agentName}","${call.customerContact}","${call.item}","${call.category}","${call.description.replace(/"/g, '""')}","${call.status}","${date}","${time}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportData.title.replace(/ /g, '_')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper functions remain the same...

// Helper functions
function getWeekStart(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRole(role) {
    const roleMap = {
        'admin': 'Admin',
        'agent': 'Call Agent',
        'backoffice': 'Back Office',
        'supervisor': 'Supervisor',
        'finance': 'Finance',
        'shareholder': 'Shareholder',
        'digital': 'Digital'
    };
    return roleMap[role] || role;
}