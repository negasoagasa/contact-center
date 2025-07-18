// Initialize localStorage data if not exists
if (!localStorage.getItem('users')) {
    const initialUsers = [
        { 
            id: 1, 
            username: 'admin', 
            password: 'admin123', 
            role: 'admin', 
            name: 'System Administrator',
            department: 'Administration',
            email: 'admin@gadaabank.com',
            phone: '+251911223344',
            created: new Date().toISOString(),
            profile: {
                position: 'System Administrator',
                hireDate: '2020-01-01',
                address: 'Addis Ababa, Ethiopia',
                bio: 'Responsible for managing the contact center system'
            } 
        },
        // Sample agents
        { 
            id: 2, 
            username: 'agent1', 
            password: 'agent123', 
            role: 'agent', 
            name: 'Call Agent 1',
            department: 'Contact Center',
            email: 'agent1@gadaabank.com',
            phone: '+251911223355',
            created: new Date().toISOString(),
            profile: {
                position: 'agent',
                hireDate: '2020-01-01',
                address: 'Addis Ababa, Ethiopia',
                bio: 'Responsible for tagging case for contact center system'
            }    
        },
        { 
            id: 2, 
            username: 'supervisor', 
            password: 'super123', 
            role: 'supervisor', 
            name: 'Supervisor',
            department: 'Contact Center',
            email: 'supervisor@gadaabank.com',
            phone: '+251911223355',
            created: new Date().toISOString(),
            profile: {
                position: 'Supervisor',
                hireDate: '2020-01-01',
                address: 'Addis Ababa, Ethiopia',
                bio: 'Responsible for controlling the contact center system'
            }    
        },
        // Add more sample users as needed
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
}

if (!localStorage.getItem('calls')) {
    localStorage.setItem('calls', JSON.stringify([]));
}

// Initialize localStorage data if not exists - REMOVE THIS SECTION

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const user = await authService.login(username, password);
        
        // Redirect based on role
        switch(user.role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'agent':
                window.location.href = 'agent.html';
                break;
            case 'backoffice':
                window.location.href = 'backoffice.html';
                break;
            case 'supervisor':
                window.location.href = 'supervisor.html';
                break;
            case 'finance':
                window.location.href = 'finance.html';
                break;
            case 'shareholder':
                window.location.href = 'shareholder.html';
                break;
            case 'digital':
                window.location.href = 'digital.html';
                break;
            default:
                window.location.href = 'agent.html';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = error.message || 'Invalid username or password';
    }
});