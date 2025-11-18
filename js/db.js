// IndexedDB wrapper for Net-Cards
const DB_NAME = 'NetCardsDB';
const DB_VERSION = 2;
const STORE_PROFILE = 'profile';
const STORE_CONTACTS = 'contacts';
const STORE_TAGS = 'tags';

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject('Database failed to open');
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create profile store (single document store)
        if (!db.objectStoreNames.contains(STORE_PROFILE)) {
          const profileStore = db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
          console.log('Profile store created');
        }

        // Create contacts store
        if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
          const contactsStore = db.createObjectStore(STORE_CONTACTS, {
            keyPath: 'id',
            autoIncrement: true
          });
          // Create indexes for searching
          contactsStore.createIndex('name', 'name', { unique: false });
          contactsStore.createIndex('email', 'email', { unique: false });
          contactsStore.createIndex('event', 'event', { unique: false });
          contactsStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Contacts store created');
        }

        // Create tags store
        if (!db.objectStoreNames.contains(STORE_TAGS)) {
          const tagsStore = db.createObjectStore(STORE_TAGS, {
            keyPath: 'id',
            autoIncrement: true
          });
          tagsStore.createIndex('name', 'name', { unique: true });
          console.log('Tags store created');
        }
      };
    });
  }

  // Profile methods
  async saveProfile(profileData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROFILE], 'readwrite');
      const store = transaction.objectStore(STORE_PROFILE);

      // Always use ID 1 for the single profile
      profileData.id = 1;
      const request = store.put(profileData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to save profile');
    });
  }

  async getProfile() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_PROFILE], 'readonly');
      const store = transaction.objectStore(STORE_PROFILE);
      const request = store.get(1);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Failed to get profile');
    });
  }

  // Contact methods
  async addContact(contactData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readwrite');
      const store = transaction.objectStore(STORE_CONTACTS);

      // Add timestamp
      contactData.timestamp = new Date().toISOString();

      const request = store.add(contactData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to add contact');
    });
  }

  async updateContact(id, contactData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readwrite');
      const store = transaction.objectStore(STORE_CONTACTS);

      contactData.id = id;
      const request = store.put(contactData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to update contact');
    });
  }

  async deleteContact(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readwrite');
      const store = transaction.objectStore(STORE_CONTACTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete contact');
    });
  }

  async getContact(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readonly');
      const store = transaction.objectStore(STORE_CONTACTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to get contact');
    });
  }

  async getAllContacts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readonly');
      const store = transaction.objectStore(STORE_CONTACTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to get contacts');
    });
  }

  async getContactsByEvent(event) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readonly');
      const store = transaction.objectStore(STORE_CONTACTS);
      const index = store.index('event');
      const request = index.getAll(event);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to get contacts by event');
    });
  }

  async searchContacts(query) {
    const contacts = await this.getAllContacts();
    const lowerQuery = query.toLowerCase();

    return contacts.filter(contact => {
      return (contact.name && contact.name.toLowerCase().includes(lowerQuery)) ||
             (contact.email && contact.email.toLowerCase().includes(lowerQuery)) ||
             (contact.company && contact.company.toLowerCase().includes(lowerQuery)) ||
             (contact.title && contact.title.toLowerCase().includes(lowerQuery));
    });
  }

  async getAllEvents() {
    const contacts = await this.getAllContacts();
    const events = new Set();

    contacts.forEach(contact => {
      if (contact.event) {
        // Handle multiple events (separated by comma)
        const eventList = contact.event.split(',').map(e => e.trim());
        eventList.forEach(e => events.add(e));
      }
    });

    return Array.from(events).sort();
  }

  async clearAllContacts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_CONTACTS], 'readwrite');
      const store = transaction.objectStore(STORE_CONTACTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to clear contacts');
    });
  }

  // Tag methods
  async addTag(tagName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_TAGS], 'readwrite');
      const store = transaction.objectStore(STORE_TAGS);

      const tagData = {
        name: tagName,
        timestamp: new Date().toISOString()
      };

      const request = store.add(tagData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to add tag (may already exist)');
    });
  }

  async updateTag(id, tagName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_TAGS], 'readwrite');
      const store = transaction.objectStore(STORE_TAGS);

      const tagData = {
        id: id,
        name: tagName,
        timestamp: new Date().toISOString()
      };

      const request = store.put(tagData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to update tag');
    });
  }

  async deleteTag(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_TAGS], 'readwrite');
      const store = transaction.objectStore(STORE_TAGS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete tag');
    });
  }

  async getAllTags() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_TAGS], 'readonly');
      const store = transaction.objectStore(STORE_TAGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const tags = request.result;
        // Sort alphabetically by name
        tags.sort((a, b) => a.name.localeCompare(b.name));
        resolve(tags);
      };
      request.onerror = () => reject('Failed to get tags');
    });
  }

  async getTag(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_TAGS], 'readonly');
      const store = transaction.objectStore(STORE_TAGS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to get tag');
    });
  }
}

// Create global database instance
const db = new Database();
