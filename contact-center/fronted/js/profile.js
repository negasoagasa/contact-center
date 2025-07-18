// scripts/profile.js - Rewritten

// Global modal management
let currentModal = null;

function showModal(content, title = '') {
    // Close existing modal if open
    if (currentModal) {
        document.body.removeChild(currentModal);
    }

    // Create new modal
    currentModal = document.createElement('div');
    currentModal.className = 'modal';
    currentModal.id = 'profileModal';
    currentModal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            ${title ? `<h2>${title}</h2>` : ''}
            <div class="modal-body">${content}</div>
        </div>
    `;

    // Add close handlers
    currentModal.querySelector('.close-modal').addEventListener('click', closeModal);
    currentModal.addEventListener('click', function(e) {
        if (e.target === currentModal) {
            closeModal();
        }
    });

    // Add to DOM
    document.body.appendChild(currentModal);
}
function closeModal() {
    if (currentModal) {
        document.body.removeChild(currentModal);
        currentModal = null;
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Universal profile button click handler
        document.addEventListener('click', function(e) {
            if (e.target.matches('[id$="ProfileLink"]')) {
                e.preventDefault();
                viewProfile();
            }
        });
    });
}

function viewProfile() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to view profile');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === currentUser.id) || currentUser;
    
    let profileHTML = `
        <div class="profile-header">
            <h3>${user.name}</h3>
            <p>${formatRole(user.role)} - ${user.department || 'No department'}</p>
        </div>
        <div class="profile-details">
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${user.email || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${user.phone || 'Not provided'}</span>
            </div>
    `;

    if (user.profile) {
        if (user.profile.position) profileHTML += `
            <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-value">${user.profile.position}</span>
            </div>`;
        
        if (user.profile.hireDate) profileHTML += `
            <div class="detail-row">
                <span class="detail-label">Hire Date:</span>
                <span class="detail-value">${user.profile.hireDate}</span>
            </div>`;
    }

    profileHTML += `
        </div>
        <button id="editProfileBtn" class="btn btn-primary">Edit Profile</button>
    `;

    showModal(profileHTML, 'Profile Information');

    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        editProfile(user);
    });
}

function editProfile(user) {
    let editHTML = `
        <form id="profileForm" class="profile-form">
            <div class="form-group">
                <label for="profileName">Full Name</label>
                <input type="text" id="profileName" value="${user.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="profileEmail">Email</label>
                <input type="email" id="profileEmail" value="${user.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="profilePhone">Phone</label>
                <input type="tel" id="profilePhone" value="${user.phone || ''}">
            </div>
            <div class="form-group">
                <label for="profilePosition">Position</label>
                <input type="text" id="profilePosition" value="${user.profile?.position || ''}">
            </div>
            <div class="form-group">
                <label for="profileHireDate">Hire Date</label>
                <input type="date" id="profileHireDate" value="${user.profile?.hireDate || ''}">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" id="cancelEditBtn" class="btn btn-secondary">Cancel</button>
            </div>
        </form>
    `;

    showModal(editHTML, 'Edit Profile');

    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfileChanges(user.id);
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        viewProfile();
    });
}

function saveProfileChanges(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }

    // Update user data
    users[userIndex].name = document.getElementById('profileName').value;
    users[userIndex].email = document.getElementById('profileEmail').value;
    users[userIndex].phone = document.getElementById('profilePhone').value;
    
    // Initialize profile if not exists
    if (!users[userIndex].profile) {
        users[userIndex].profile = {};
    }
    
    // Update profile data
    users[userIndex].profile.position = document.getElementById('profilePosition').value;
    users[userIndex].profile.hireDate = document.getElementById('profileHireDate').value;
    
    // Save to storage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update current user in session
    const currentUser = users[userIndex];
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    const nameElement = document.getElementById(`current${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}Name`);
    if (nameElement) {
        nameElement.textContent = currentUser.name;
    }
    
    // Show success and return to profile view
    alert('Profile updated successfully!');
    viewProfile();
}

function formatRole(role) {
    const roleMap = {
        'admin': 'Administrator',
        'agent': 'Call Agent',
        'backoffice': 'Back Office',
        'supervisor': 'Supervisor',
        'finance': 'Finance',
        'shareholder': 'Shareholder',
        'digital': 'Digital'
    };
    return roleMap[role] || role;
}