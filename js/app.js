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

      // Setup mobile quick actions
      this.setupQuickActions();

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
        case 'tags':
          await TagsManager.init();
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

    // Monitor form changes to update size indicator
    const formInputs = form.querySelectorAll('input');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateQRSizeIndicator();
      });
    });
  }

  // Update QR size indicator
  updateQRSizeIndicator() {
    try {
      // Check if VCard is available
      if (typeof VCard === 'undefined') {
        return;
      }

      // Get current form data
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

      // Generate vCard to calculate size
      const vcardString = VCard.generate(profileData);
      const size = new Blob([vcardString]).size;

      const indicator = document.getElementById('qr-size-indicator');
      if (!indicator) return;

      const icon = document.getElementById('qr-size-icon').querySelector('i');
      const text = document.getElementById('qr-size-text');

      // QR capacity thresholds (L error correction)
      const MAX_SIZE = 2035; // Approximate max for QR with L error correction
      const WARNING_SIZE = 1800; // Show warning at 88% capacity
      const CRITICAL_SIZE = 1950; // Show critical warning at 96% capacity

      if (size < WARNING_SIZE) {
        // Good - plenty of space
        indicator.style.display = 'none';
      } else if (size < CRITICAL_SIZE) {
        // Warning - getting close
        indicator.style.display = 'block';
        indicator.className = 'notification is-warning';
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = `QR code size: ${size} bytes (${Math.round((size/MAX_SIZE)*100)}% of capacity). Consider shortening some fields.`;
      } else {
        // Critical - very close to limit
        indicator.style.display = 'block';
        indicator.className = 'notification is-danger';
        icon.className = 'fas fa-exclamation-circle';
        text.textContent = `QR code size: ${size} bytes (${Math.round((size/MAX_SIZE)*100)}% of capacity). QR may fail! Remove some fields.`;
      }
    } catch (error) {
      console.error('Error calculating QR size:', error);
    }
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

        // Update size indicator
        this.updateQRSizeIndicator();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Save user profile
  async saveProfile() {
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

    try {
      await db.saveProfile(profileData);
      await QRGenerator.generateFromProfile(profileData);

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

    // Incremental search - triggers on every keystroke
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      ContactsManager.applySearch(query);
    });

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

    // Tag filter
    const tagFilter = document.getElementById('tag-filter');
    tagFilter.addEventListener('change', (e) => {
      ContactsManager.applyTagFilter(e.target.value);
    });

    // Add Contact button
    document.getElementById('add-contact-btn').addEventListener('click', () => {
      this.showAddContactModal();
    });

    // Back to My Card button
    document.getElementById('back-to-card-btn').addEventListener('click', () => {
      this.navigateToSection('my-card');
    });
  }

  // Setup quick actions for mobile
  setupQuickActions() {
    // Profile form toggle
    const toggleBtn = document.getElementById('toggle-profile-form');
    const formContainer = document.getElementById('profile-form-container');
    const toggleIcon = document.getElementById('profile-toggle-icon');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = formContainer.style.display === 'none';
        formContainer.style.display = isHidden ? 'block' : 'none';
        toggleIcon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
      });
    }

    // Quick scan button
    const quickScanBtn = document.getElementById('quick-scan-btn');
    if (quickScanBtn) {
      quickScanBtn.addEventListener('click', () => {
        this.showQuickScanModal();
      });
    }

    // View contacts button
    const viewContactsBtn = document.getElementById('view-contacts-btn');
    if (viewContactsBtn) {
      viewContactsBtn.addEventListener('click', () => {
        this.navigateToSection('contacts');
      });
    }

    // Manage tags button
    const manageTagsBtn = document.getElementById('manage-tags-btn');
    if (manageTagsBtn) {
      manageTagsBtn.addEventListener('click', () => {
        this.navigateToSection('tags');
      });
    }

    // Back to card from tags button
    const backToCardFromTagsBtn = document.getElementById('back-to-card-from-tags-btn');
    if (backToCardFromTagsBtn) {
      backToCardFromTagsBtn.addEventListener('click', () => {
        this.navigateToSection('my-card');
      });
    }
  }

  // Show quick scan modal
  async showQuickScanModal() {
    const modal = document.getElementById('quick-scan-modal');
    modal.classList.add('is-active');

    // Initialize quick scanner
    const video = document.getElementById('quick-qr-video');
    const canvas = document.getElementById('quick-qr-canvas');
    const canvasContext = canvas.getContext('2d');

    let stream = null;
    let scanning = true;
    let scannedContactData = null;

    // Start camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      video.srcObject = stream;
      await video.play();

      // Scan loop
      const scan = () => {
        if (!scanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            scanning = false;
            handleScan(code.data);
            return;
          }
        }

        requestAnimationFrame(scan);
      };

      scan();
    } catch (error) {
      console.error('Camera error:', error);
      alert('Failed to access camera');
      modal.classList.remove('is-active');
      return;
    }

    // Handle scanned QR code
    const handleScan = async (data) => {
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      try {
        if (!data.includes('BEGIN:VCARD')) {
          alert('Not a valid V-Card QR code');
          modal.classList.remove('is-active');
          return;
        }

        // Parse V-Card
        const contactData = VCard.parse(data);

        if (!contactData.name) {
          alert('V-Card does not contain a name');
          modal.classList.remove('is-active');
          return;
        }

        // Handle event tagging
        const defaultEvent = document.getElementById('quick-scan-event').value.trim();
        if (!contactData.event && defaultEvent) {
          contactData.event = defaultEvent;
        } else if (contactData.event && defaultEvent && contactData.event !== defaultEvent) {
          contactData.event = `${contactData.event}, ${defaultEvent}`;
        }

        scannedContactData = contactData;

        // Close scan modal and show contact preview
        modal.classList.remove('is-active');
        this.showScannedContactModal(scannedContactData);

      } catch (error) {
        console.error('Error processing QR code:', error);
        alert('Failed to process QR code');
        modal.classList.remove('is-active');
      }
    };

    // Close handlers
    const closeModal = () => {
      scanning = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      modal.classList.remove('is-active');
    };

    document.getElementById('close-quick-scan').onclick = closeModal;
    document.getElementById('stop-quick-scan').onclick = closeModal;
    modal.querySelector('.modal-background').onclick = closeModal;
  }

  // Show scanned contact preview modal
  async showScannedContactModal(contactData) {
    const modal = document.getElementById('scanned-contact-modal');
    const detailsDiv = document.getElementById('scanned-contact-details');

    // Build contact details HTML
    let html = `<h3 class="title is-4">${contactData.name}</h3>`;
    if (contactData.title) html += `<p><strong>Title:</strong> ${contactData.title}</p>`;
    if (contactData.company) html += `<p><strong>Company:</strong> ${contactData.company}</p>`;
    if (contactData.email) html += `<p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>`;
    if (contactData.phone) html += `<p><strong>Phone:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>`;
    if (contactData.website) html += `<p><strong>Website:</strong> <a href="${contactData.website}" target="_blank">${contactData.website}</a></p>`;
    if (contactData.linkedin) html += `<p><strong>LinkedIn:</strong> ${contactData.linkedin}</p>`;
    if (contactData.twitter) html += `<p><strong>Twitter:</strong> ${contactData.twitter}</p>`;
    if (contactData.github) html += `<p><strong>GitHub:</strong> ${contactData.github}</p>`;
    if (contactData.event) html += `<p><strong>Event:</strong> <span class="tag is-info">${contactData.event}</span></p>`;

    detailsDiv.innerHTML = html;

    // Load tag checkboxes
    const tagsContainer = document.getElementById('scanned-contact-tags');
    const selectedTags = contactData.tags || [];
    tagsContainer.innerHTML = await TagsManager.getTagCheckboxesHTML(selectedTags);

    modal.classList.add('is-active');

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('is-active');
    };

    document.getElementById('close-scanned-contact').onclick = closeModal;
    document.getElementById('cancel-scanned-contact').onclick = closeModal;
    modal.querySelector('.modal-background').onclick = closeModal;

    // Save handler
    document.getElementById('save-scanned-contact').onclick = async () => {
      try {
        // Get selected tags
        const selectedTags = TagsManager.getSelectedTags('#scanned-contact-tags');
        contactData.tags = selectedTags;

        await db.addContact(contactData);
        this.showNotification('Contact saved successfully!', 'success');
        closeModal();

        // Refresh contacts if needed
        if (typeof ContactsManager !== 'undefined') {
          await ContactsManager.loadEventFilters();
          await ContactsManager.loadTagFilters();
          await ContactsManager.loadContacts();
        }
      } catch (error) {
        console.error('Error saving contact:', error);
        alert('Failed to save contact');
      }
    };
  }

  // Show add contact modal
  async showAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    modal.classList.add('is-active');

    // Reset form and set title
    document.getElementById('add-contact-form').reset();
    document.querySelector('#add-contact-modal .modal-card-title').textContent = 'Add Contact Manually';

    // Store that we're in add mode
    modal.dataset.mode = 'add';
    delete modal.dataset.contactId;

    // Load tag checkboxes
    const tagsContainer = document.getElementById('add-contact-tags');
    tagsContainer.innerHTML = await TagsManager.getTagCheckboxesHTML([]);

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
  async showEditContactModal(contact) {
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

    // Load tag checkboxes with selected tags
    const tagsContainer = document.getElementById('add-contact-tags');
    const selectedTags = contact.tags || [];
    tagsContainer.innerHTML = await TagsManager.getTagCheckboxesHTML(selectedTags);

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
      event: document.getElementById('add-event').value.trim(),
      tags: TagsManager.getSelectedTags('#add-contact-tags')
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
      await ContactsManager.loadTagFilters();
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
      // Using L (low) error correction to maximize data capacity
      const qr = new QRCode(qrDisplay, {
        text: vcardString,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
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
