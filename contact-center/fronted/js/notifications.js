// Simple notification system with sound
class NotificationSystem {
    constructor() {
        this.audio = new Audio('notification.wav');
        this.soundNotifier = new SoundNotifier();
        this.audio.volume = 1;
        this.setupEventListeners();
        this.checkInterval = 30000; // 30 seconds
        this.init()
    }

    init() {
      this.checkForNewItems();
      setInterval(() => this.checkForNewItems(), this.checkInterval);
      
      document.addEventListener('visibilitychange', () => {
          if (!document.hidden) this.checkForNewItems();
      });
  }

  checkForNewItems() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) return;

    const lastCheck = localStorage.getItem(`lastNotificationCheck_${user.id}`) || 0;
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    
    // For Back Office
    if (user.role === 'backoffice') {
        const newPending = calls.filter(call => 
            call.status === 'pending' && 
            call.pendingResponse &&
            new Date(call.timestamp) > new Date(lastCheck)
        );

        newPending.forEach(call => {
            this.showNotification(`New response for: ${call.item} (${call.category})`);
        });
    }
    // For Departments
    else if (['finance', 'digital', 'shareholder'].includes(user.role)) {
        const newEscalations = calls.filter(call => 
            call.status === 'escalated' && 
            call.escalatedTo === user.role &&
            new Date(call.timestamp) > new Date(lastCheck)
        );

        newEscalations.forEach(call => {
            this.showNotification(`New escalation: ${call.item} (${call.category})`);
        });
    }

    localStorage.setItem(`lastNotificationCheck_${user.id}`, new Date().toISOString());
}

    setupEventListeners() {
        // Check for new escalations every 30 seconds
        setInterval(() => this.checkEscalations(), 30000);
        
        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.checkEscalations();
        });
        
        // Initial check
        this.checkEscalations();
    }

    checkEscalations() {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user) return;

        const department = user.role;
        if (!['backoffice', 'finance', 'digital', 'shareholder'].includes(department)) return;

        const calls = JSON.parse(localStorage.getItem('calls')) || [];
        const newEscalations = calls.filter(call => 
            call.status === 'escalated' && 
            call.escalatedTo === department &&
            !call.notificationShown
        );

        newEscalations.forEach(call => {
            this.showNotification(
                `New escalation from ${call.agentName}: ${call.item} - ${call.category}`
            );
            call.notificationShown = true;
        });

        if (newEscalations.length) {
            localStorage.setItem('calls', JSON.stringify(calls));
        }
    }

    showNotification(message) {
      const container = document.getElementById('notificationContainer');
      if (!container) return;

      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.innerHTML = `
          <div class="notification-content">
              <span class="notification-icon">🔔</span>
              <span class="notification-message">${message}</span>
              <button class="notification-close">&times;</button>
          </div>
      `;

      container.appendChild(notification);
      this.playSound();

      // Auto-remove after 10 seconds
      setTimeout(() => {
          notification.classList.add('hide');
          setTimeout(() => notification.remove(), 500);
      }, 10000);

      notification.querySelector('.notification-close').addEventListener('click', () => {
          notification.classList.add('hide');
          setTimeout(() => notification.remove(), 500);
      });
  }

  playSound() {
      // Simple fallback beep
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new NotificationSystem();
});





// Audio notification system with multiple fallbacks
class SoundNotifier {
    constructor() {
      this.audioContext = null;
      this.haveAudioContext = false;
      this.haveAudioElement = false;
      this.init();
    }
  
    init() {
      // Try to initialize Web Audio API
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.haveAudioContext = true;
      } catch (e) {
        console.log("Web Audio API not supported");
      }
  
      // Try to initialize HTML5 Audio
      try {
        this.audioElement = new Audio('notification.wav');
        this.audioElement.load();
        this.haveAudioElement = true;
      } catch (e) {
        console.log("Audio element failed to initialize");
      }
    }
  
    play() {
      // Try HTML5 Audio first
      if (this.haveAudioElement) {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(e => {
          console.log("HTML5 Audio play failed, trying Web Audio API");
          this.playWebAudio();
        });
      } else if (this.haveAudioContext) {
        this.playWebAudio();
      } else {
        console.log("No audio playback method available");
      }
    }
  
    playWebAudio() {
      if (!this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    }
  }

  function checkForNewEscalations() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const department = currentUser.role;
    const lastCheck = sessionStorage.getItem('lastEscalationCheck') || 0;
    const calls = JSON.parse(localStorage.getItem('calls')) || [];
    
    // For backoffice: notify about new department responses
    if (department === 'backoffice') {
        const newResponses = calls.filter(call => 
            call.status === 'pending' && 
            call.pendingResponse &&
            call.responses.some(r => r.forBackoffice && new Date(r.timestamp) > new Date(lastCheck))
        );
        
        if (newResponses.length > 0) {
            newResponses.forEach(call => {
                showNotification(`New response from department for: ${call.item}`);
            });
        }
    }
    // For departments: notify about new escalations
    else {
        const newEscalations = calls.filter(call => 
            call.status === 'escalated' && 
            call.escalatedTo === department &&
            new Date(call.timestamp) > new Date(lastCheck)
        );
        
        if (newEscalations.length > 0) {
            newEscalations.forEach(call => {
                showNotification(`New escalation from Back Office: ${call.item}`);
            });
        }
    }
    
    sessionStorage.setItem('lastEscalationCheck', new Date().toISOString());
}

// Add to notifications.js
function setupRealTimeUpdates() {
  setInterval(() => {
      const currentView = document.querySelector('.main-content > div[style="display: block;"]').id;
      if (currentView) {
          // Refresh the current view
          if (currentView === 'boEscalatedView') loadEscalatedCalls();
          else if (currentView === 'dashboardView') updateDashboardStats();
          // Add other view refreshes as needed
      }
  }, 30000); // Refresh every 30 seconds
}