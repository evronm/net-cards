// Contacts manager module
const ContactsManager = {
  currentFilter: '',
  currentTagFilter: '',
  currentSearch: '',

  // Initialize contacts view
  async init() {
    await this.loadEventFilters();
    await this.loadTagFilters();
    await this.loadContacts();
  },

  // Load all contacts and display
  async loadContacts() {
    try {
      let contacts;

      if (this.currentFilter) {
        // Filter by event
        contacts = await db.getContactsByEvent(this.currentFilter);
      } else {
        // Get all contacts
        contacts = await db.getAllContacts();
      }

      // Apply search filter if active
      if (this.currentSearch) {
        contacts = await db.searchContacts(this.currentSearch);
        if (this.currentFilter) {
          // Also filter by event
          contacts = contacts.filter(c => c.event && c.event.includes(this.currentFilter));
        }
      }

      // Apply tag filter if active
      if (this.currentTagFilter) {
        contacts = contacts.filter(c => {
          const tags = c.tags || [];
          return tags.includes(this.currentTagFilter);
        });
      }

      // Sort by timestamp (newest first)
      contacts.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0);
        const timeB = new Date(b.timestamp || 0);
        return timeB - timeA;
      });

      this.displayContacts(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  },

  // Display contacts in the UI
  displayContacts(contacts) {
    const listDiv = document.getElementById('contacts-list');

    if (contacts.length === 0) {
      listDiv.innerHTML = '<div class="notification">No contacts found</div>';
      return;
    }

    listDiv.innerHTML = contacts.map(contact => this.renderContactCard(contact)).join('');

    // Add event listeners to action buttons
    this.attachEventListeners();
  },

  // Render a single contact card
  renderContactCard(contact) {
    const events = contact.event ? contact.event.split(',').map(e => e.trim()) : [];
    const eventTags = events.map(e => `<span class="tag is-info">${e}</span>`).join(' ');

    const tags = contact.tags || [];
    const categoryTags = tags.map(t => `<span class="tag is-warning">${t}</span>`).join(' ');

    return `
      <div class="box contact-card" data-contact-id="${contact.id}">
        <article class="media">
          <div class="media-left">
            <figure class="image is-64x64">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                ${this.getInitials(contact.name)}
              </div>
            </figure>
          </div>
          <div class="media-content">
            <div class="content">
              <p>
                <strong>${contact.name}</strong>
                ${contact.title ? `<br><small>${contact.title}</small>` : ''}
                ${contact.company ? `<br><small>${contact.company}</small>` : ''}
                ${contact.email ? `<br><a href="mailto:${contact.email}">${contact.email}</a>` : ''}
                ${contact.phone ? `<br><a href="tel:${contact.phone}">${contact.phone}</a>` : ''}
                ${contact.website ? `<br><a href="${contact.website}" target="_blank">${contact.website}</a>` : ''}
              </p>
              ${contact.linkedin ? `<a href="https://${contact.linkedin}" target="_blank" class="button is-small is-link"><i class="fab fa-linkedin"></i></a> ` : ''}
              ${contact.twitter ? `<a href="https://twitter.com/${contact.twitter.replace('@', '')}" target="_blank" class="button is-small is-info"><i class="fab fa-twitter"></i></a> ` : ''}
              ${contact.github ? `<a href="https://${contact.github}" target="_blank" class="button is-small is-dark"><i class="fab fa-github"></i></a>` : ''}
              ${eventTags || categoryTags ? `<br><br>` : ''}
              ${eventTags ? `${eventTags} ` : ''}
              ${categoryTags ? categoryTags : ''}
              ${contact.timestamp ? `<br><small class="has-text-grey">Added: ${new Date(contact.timestamp).toLocaleDateString()}</small>` : ''}
            </div>
          </div>
          <div class="media-right">
            <div class="buttons are-small">
              <button class="button is-info view-qr-contact" data-id="${contact.id}" title="View QR Code">
                <span class="icon"><i class="fas fa-qrcode"></i></span>
              </button>
              <button class="button is-warning edit-contact" data-id="${contact.id}" title="Edit">
                <span class="icon"><i class="fas fa-edit"></i></span>
              </button>
              <button class="button is-primary share-contact" data-id="${contact.id}" title="Share">
                <span class="icon"><i class="fas fa-share"></i></span>
              </button>
              <button class="button is-link export-contact" data-id="${contact.id}" title="Export VCF">
                <span class="icon"><i class="fas fa-download"></i></span>
              </button>
              <button class="button is-danger delete-contact" data-id="${contact.id}" title="Delete">
                <span class="icon"><i class="fas fa-trash"></i></span>
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  },

  // Get initials from name
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  },

  // Load event filters
  async loadEventFilters() {
    try {
      const events = await db.getAllEvents();
      const eventFilter = document.getElementById('event-filter');
      const exportEventFilter = document.getElementById('export-event-filter');

      // Clear existing options (except "All Events" / "Select Event")
      eventFilter.innerHTML = '<option value="">All Events</option>';
      exportEventFilter.innerHTML = '<option value="">Select Event</option>';

      // Add event options
      events.forEach(event => {
        const option1 = document.createElement('option');
        option1.value = event;
        option1.textContent = event;
        eventFilter.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = event;
        option2.textContent = event;
        exportEventFilter.appendChild(option2);
      });
    } catch (error) {
      console.error('Error loading events:', error);
    }
  },

  // Load tag filters
  async loadTagFilters() {
    try {
      const tags = await db.getAllTags();
      const tagFilter = document.getElementById('tag-filter');

      // Clear existing options (except "All Tags")
      tagFilter.innerHTML = '<option value="">All Tags</option>';

      // Add tag options
      tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.name;
        option.textContent = tag.name;
        tagFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  },

  // Attach event listeners to contact action buttons
  attachEventListeners() {
    // View QR buttons
    document.querySelectorAll('.view-qr-contact').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await this.viewContactQR(id);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-contact').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await this.editContact(id);
      });
    });

    // Share buttons
    document.querySelectorAll('.share-contact').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await this.shareContact(id);
      });
    });

    // Export buttons
    document.querySelectorAll('.export-contact').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        await this.exportContact(id);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-contact').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('Are you sure you want to delete this contact?')) {
          await this.deleteContact(id);
        }
      });
    });
  },

  // Edit contact
  async editContact(id) {
    try {
      const contact = await db.getContact(id);
      // Trigger the edit modal - will be handled in app.js
      if (typeof app !== 'undefined' && app.showEditContactModal) {
        app.showEditContactModal(contact);
      }
    } catch (error) {
      console.error('Error editing contact:', error);
      alert('Failed to load contact');
    }
  },

  // View QR code for a contact
  async viewContactQR(id) {
    try {
      const contact = await db.getContact(id);
      // Trigger the modal display - will be handled in app.js
      if (typeof app !== 'undefined' && app.showContactQR) {
        app.showContactQR(contact);
      }
    } catch (error) {
      console.error('Error viewing contact QR:', error);
      alert('Failed to generate QR code');
    }
  },

  // Share/Export contact - uses Web Share API if available, otherwise downloads VCF
  async shareContact(id) {
    try {
      const contact = await db.getContact(id);
      const vcardString = VCard.generate(contact);
      const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
      const file = new File([blob], `${contact.name}.vcf`, { type: 'text/vcard;charset=utf-8' });

      // Try Web Share API with file sharing if supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: contact.name,
            text: 'Contact card'
          });
          return;
        } catch (shareError) {
          // If share was cancelled, don't do anything
          if (shareError.name === 'AbortError') {
            return;
          }
          // Otherwise fall through to download
          console.log('Share failed, using download:', shareError);
        }
      }

      // Fallback: download the VCF file
      // On mobile, the OS should recognize .vcf files and offer to add to contacts
      this.exportContact(id);
    } catch (error) {
      console.error('Error sharing contact:', error);
      alert('Failed to share contact: ' + error.message);
    }
  },

  // Export single contact as VCF file
  async exportContact(id) {
    try {
      const contact = await db.getContact(id);
      const vcardString = VCard.generate(contact);
      const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Sanitize filename
      const safeName = contact.name.replace(/[^a-z0-9]/gi, '_');

      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting contact:', error);
      alert('Failed to export contact');
    }
  },

  // Delete contact
  async deleteContact(id) {
    try {
      await db.deleteContact(id);
      await this.loadEventFilters(); // Refresh event filters
      await this.loadContacts(); // Refresh list
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  },

  // Apply event filter
  applyEventFilter(event) {
    this.currentFilter = event;
    this.loadContacts();
  },

  // Apply tag filter
  applyTagFilter(tag) {
    this.currentTagFilter = tag;
    this.loadContacts();
  },

  // Apply search filter
  applySearch(query) {
    this.currentSearch = query;
    this.loadContacts();
  }
};
