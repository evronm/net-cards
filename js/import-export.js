// Import/Export functionality
const ImportExport = {
  selectedFile: null,

  // Initialize import/export handlers
  init() {
    // File input handler
    const fileInput = document.getElementById('import-file');
    fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });

    // Import button
    document.getElementById('import-btn').addEventListener('click', async () => {
      await this.importContacts();
    });

    // Export all button
    document.getElementById('export-all-btn').addEventListener('click', async () => {
      await this.exportAllContacts();
    });

    // Export by event button
    document.getElementById('export-event-btn').addEventListener('click', async () => {
      await this.exportByEvent();
    });
  },

  // Handle file selection
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      document.getElementById('import-filename').textContent = file.name;
      document.getElementById('import-btn').disabled = false;
    } else {
      this.selectedFile = null;
      document.getElementById('import-filename').textContent = 'No file selected';
      document.getElementById('import-btn').disabled = true;
    }
  },

  // Import contacts from VCF file
  async importContacts() {
    if (!this.selectedFile) {
      this.showImportResult('warning', 'No file selected');
      return;
    }

    try {
      const fileContent = await this.readFileAsText(this.selectedFile);

      // Parse VCards
      const contacts = VCard.parseMultiple(fileContent);

      if (contacts.length === 0) {
        this.showImportResult('warning', 'No valid contacts found in file');
        return;
      }

      // Import contacts to database
      let successCount = 0;
      let errorCount = 0;

      for (const contact of contacts) {
        try {
          await db.addContact(contact);
          successCount++;
        } catch (error) {
          console.error('Error importing contact:', error);
          errorCount++;
        }
      }

      // Show result
      let message = `Successfully imported ${successCount} contact(s)`;
      if (errorCount > 0) {
        message += ` (${errorCount} failed)`;
      }

      this.showImportResult('success', message);

      // Refresh contacts list and event filters
      if (typeof ContactsManager !== 'undefined') {
        await ContactsManager.loadEventFilters();
        await ContactsManager.loadTagFilters();
        await ContactsManager.loadContacts();
      }

      // Reset file input
      document.getElementById('import-file').value = '';
      document.getElementById('import-filename').textContent = 'No file selected';
      document.getElementById('import-btn').disabled = true;
      this.selectedFile = null;

    } catch (error) {
      console.error('Error importing contacts:', error);
      this.showImportResult('error', 'Failed to import contacts: ' + error);
    }
  },

  // Export all contacts
  async exportAllContacts() {
    try {
      const contacts = await db.getAllContacts();

      if (contacts.length === 0) {
        alert('No contacts to export');
        return;
      }

      const vcardString = VCard.generateMultiple(contacts);
      this.downloadVCF(vcardString, 'all-contacts.vcf');

    } catch (error) {
      console.error('Error exporting contacts:', error);
      alert('Failed to export contacts');
    }
  },

  // Export contacts by event
  async exportByEvent() {
    const event = document.getElementById('export-event-filter').value;

    if (!event) {
      alert('Please select an event');
      return;
    }

    try {
      const contacts = await db.getContactsByEvent(event);

      if (contacts.length === 0) {
        alert(`No contacts found for event "${event}"`);
        return;
      }

      const vcardString = VCard.generateMultiple(contacts);
      const filename = `${event.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vcf`;
      this.downloadVCF(vcardString, filename);

    } catch (error) {
      console.error('Error exporting contacts by event:', error);
      alert('Failed to export contacts');
    }
  },

  // Download VCF file
  downloadVCF(vcardString, filename) {
    const blob = new Blob([vcardString], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Read file as text
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = (e) => {
        reject('Failed to read file');
      };

      reader.readAsText(file);
    });
  },

  // Show import result message
  showImportResult(type, message) {
    const resultDiv = document.getElementById('import-result');
    resultDiv.className = `notification is-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'}`;
    resultDiv.textContent = message;
    resultDiv.classList.remove('is-hidden');

    setTimeout(() => {
      resultDiv.classList.add('is-hidden');
    }, 5000);
  }
};
