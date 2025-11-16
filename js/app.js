// Main application file
class App {
  constructor() {
    this.currentSection = 'my-card';
  }

  // Initialize application
  async init() {
    try {
      // Initialize database
      await db.init();

      // Initialize modules
      QRScanner.init();
      ImportExport.init();

      // Setup navigation
      this.setupNavigation();

      // Setup profile form
      this.setupProfileForm();

      // Setup scanner controls
      this.setupScannerControls();

      // Setup contacts page
      this.setupContactsPage();

      // Load user profile
      await this.loadUserProfile();

      // Initialize QR generator
      await QRGenerator.init();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      alert('Failed to initialize app. Please refresh the page.');
    }
  }

  // Setup navigation
  setupNavigation() {
    // Mobile menu toggle
    const burger = document.querySelector('.navbar-burger');
    const menu = document.getElementById('navbarMenu');

    if (burger && menu) {
      burger.addEventListener('click', () => {
        burger.classList.toggle('is-active');
        menu.classList.toggle('is-active');
      });
    }

    // Section navigation
    const navItems = document.querySelectorAll('[data-section]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        this.navigateToSection(section);

        // Close mobile menu
        if (burger && menu) {
          burger.classList.remove('is-active');
          menu.classList.remove('is-active');
        }
      });
    });
  }

  // Navigate to a section
  async navigateToSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.remove('is-active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('is-active');
      this.currentSection = sectionName;

      // Section-specific initialization
      switch (sectionName) {
        case 'contacts':
          await ContactsManager.init();
          break;
        case 'scan':
          // Stop any ongoing scan when leaving/entering
          if (QRScanner.scanning) {
            QRScanner.stopScanning();
          }
          break;
      }
    }
  }

  // Setup profile form
  setupProfileForm() {
    const form = document.getElementById('profile-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProfile();
    });
  }

  // Load user profile
  async loadUserProfile() {
    try {
      const profile = await db.getProfile();

      if (profile) {
        // Populate form fields
        document.getElementById('full-name').value = profile.name || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('company').value = profile.company || '';
        document.getElementById('title').value = profile.title || '';
        document.getElementById('website').value = profile.website || '';
        document.getElementById('linkedin').value = profile.linkedin || '';
        document.getElementById('twitter').value = profile.twitter || '';
        document.getElementById('github').value = profile.github || '';
        document.getElementById('current-event').value = profile.event || '';
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Save user profile
  async saveProfile() {
    console.log('Saving profile...');
    const profileData = {
      name: document.getElementById('full-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      company: document.getElementById('company').value.trim(),
      title: document.getElementById('title').value.trim(),
      website: document.getElementById('website').value.trim(),
      linkedin: document.getElementById('linkedin').value.trim(),
      twitter: document.getElementById('twitter').value.trim(),
      github: document.getElementById('github').value.trim(),
      event: document.getElementById('current-event').value.trim()
    };

    // Validate required field
    if (!profileData.name) {
      alert('Full name is required');
      return;
    }

    console.log('Profile data:', profileData);

    try {
      console.log('Saving to database...');
      await db.saveProfile(profileData);
      console.log('Profile saved, generating QR code...');
      await QRGenerator.generateFromProfile(profileData);
      console.log('QR code generation complete');

      // Show success message
      this.showNotification('Profile saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
    }
  }

  // Setup scanner controls
  setupScannerControls() {
    document.getElementById('start-scan').addEventListener('click', async () => {
      await QRScanner.startScanning();
    });

    document.getElementById('stop-scan').addEventListener('click', () => {
      QRScanner.stopScanning();
    });

    // Download QR button
    document.getElementById('download-qr').addEventListener('click', () => {
      QRGenerator.downloadQR();
    });
  }

  // Setup contacts page
  setupContactsPage() {
    // Search functionality
    const searchInput = document.getElementById('search-contacts');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      ContactsManager.applySearch(query);
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        ContactsManager.applySearch(query);
      }
    });

    // Event filter
    const eventFilter = document.getElementById('event-filter');
    eventFilter.addEventListener('change', (e) => {
      ContactsManager.applyEventFilter(e.target.value);
    });

    // Add Contact button
    document.getElementById('add-contact-btn').addEventListener('click', () => {
      this.showAddContactModal();
    });
  }

  // Show add contact modal
  showAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    modal.classList.add('is-active');

    // Reset form and set title
    document.getElementById('add-contact-form').reset();
    document.querySelector('#add-contact-modal .modal-card-title').textContent = 'Add Contact Manually';

    // Store that we're in add mode
    modal.dataset.mode = 'add';
    delete modal.dataset.contactId;

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('is-active');
      document.getElementById('add-contact-form').reset();
      delete modal.dataset.mode;
      delete modal.dataset.contactId;
    };

    document.getElementById('close-add-contact').onclick = closeModal;
    document.getElementById('cancel-add-contact').onclick = closeModal;
    modal.querySelector('.modal-background').onclick = closeModal;

    // Save handler
    document.getElementById('save-new-contact').onclick = async () => {
      await this.saveContact();
    };
  }

  // Show edit contact modal
  showEditContactModal(contact) {
    const modal = document.getElementById('add-contact-modal');
    modal.classList.add('is-active');

    // Set title
    document.querySelector('#add-contact-modal .modal-card-title').textContent = 'Edit Contact';

    // Store that we're in edit mode
    modal.dataset.mode = 'edit';
    modal.dataset.contactId = contact.id;

    // Populate form with contact data
    document.getElementById('add-name').value = contact.name || '';
    document.getElementById('add-email').value = contact.email || '';
    document.getElementById('add-phone').value = contact.phone || '';
    document.getElementById('add-company').value = contact.company || '';
    document.getElementById('add-title').value = contact.title || '';
    document.getElementById('add-website').value = contact.website || '';
    document.getElementById('add-linkedin').value = contact.linkedin || '';
    document.getElementById('add-twitter').value = contact.twitter || '';
    document.getElementById('add-github').value = contact.github || '';
    document.getElementById('add-event').value = contact.event || '';

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('is-active');
      document.getElementById('add-contact-form').reset();
      delete modal.dataset.mode;
      delete modal.dataset.contactId;
    };

    document.getElementById('close-add-contact').onclick = closeModal;
    document.getElementById('cancel-add-contact').onclick = closeModal;
    modal.querySelector('.modal-background').onclick = closeModal;

    // Save handler
    document.getElementById('save-new-contact').onclick = async () => {
      await this.saveContact();
    };
  }

  // Save contact (handles both add and edit)
  async saveContact() {
    const modal = document.getElementById('add-contact-modal');
    const mode = modal.dataset.mode;
    const contactId = modal.dataset.contactId;

    const contactData = {
      name: document.getElementById('add-name').value.trim(),
      email: document.getElementById('add-email').value.trim(),
      phone: document.getElementById('add-phone').value.trim(),
      company: document.getElementById('add-company').value.trim(),
      title: document.getElementById('add-title').value.trim(),
      website: document.getElementById('add-website').value.trim(),
      linkedin: document.getElementById('add-linkedin').value.trim(),
      twitter: document.getElementById('add-twitter').value.trim(),
      github: document.getElementById('add-github').value.trim(),
      event: document.getElementById('add-event').value.trim()
    };

    if (!contactData.name) {
      alert('Name is required');
      return;
    }

    try {
      if (mode === 'edit' && contactId) {
        // Update existing contact
        await db.updateContact(parseInt(contactId), contactData);
        this.showNotification('Contact updated successfully!', 'success');
      } else {
        // Add new contact
        await db.addContact(contactData);
        this.showNotification('Contact added successfully!', 'success');
      }

      // Close modal
      modal.classList.remove('is-active');
      document.getElementById('add-contact-form').reset();
      delete modal.dataset.mode;
      delete modal.dataset.contactId;

      // Refresh contacts list
      await ContactsManager.loadEventFilters();
      await ContactsManager.loadContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact: ' + error.message);
    }
  }

  // Show contact QR code
  async showContactQR(contact) {
    const modal = document.getElementById('view-qr-modal');
    modal.classList.add('is-active');

    // Set title
    document.getElementById('qr-modal-title').textContent = `QR Code for ${contact.name}`;

    // Generate VCard
    const vcardString = VCard.generate(contact);

    // Clear previous QR code
    const qrDisplay = document.getElementById('contact-qr-display');
    qrDisplay.innerHTML = '';

    // Wait for QRCode library
    if (typeof QRCode !== 'undefined') {
      // Generate QR code
      const qr = new QRCode(qrDisplay, {
        text: vcardString,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Show contact info
      document.getElementById('qr-contact-info').textContent =
        contact.event ? `Event: ${contact.event}` : 'No event specified';
    } else {
      qrDisplay.innerHTML = '<p class="has-text-danger">QR Code library not loaded</p>';
    }

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('is-active');
    };

    document.getElementById('close-qr-modal').onclick = closeModal;
    document.getElementById('close-qr-modal-btn').onclick = closeModal;
    modal.querySelector('.modal-background').onclick = closeModal;

    // Download handler
    document.getElementById('download-contact-qr').onclick = () => {
      const qrCanvas = document.querySelector('#contact-qr-display canvas');
      if (qrCanvas) {
        qrCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${contact.name}-qr.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    };
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification is-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
      <button class="delete"></button>
      ${message}
    `;

    document.body.appendChild(notification);

    // Delete button handler
    notification.querySelector('.delete').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize app when DOM is ready
let app; // Global app instance
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.init();
});
