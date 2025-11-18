// Tags manager module
const TagsManager = {
  // Initialize tags page
  async init() {
    await this.loadTags();
    this.setupEventListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    // Add tag button
    document.getElementById('add-tag-btn').addEventListener('click', async () => {
      await this.addNewTag();
    });

    // Enter key on input
    document.getElementById('new-tag-input').addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await this.addNewTag();
      }
    });
  },

  // Load and display all tags
  async loadTags() {
    try {
      const tags = await db.getAllTags();
      this.displayTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  },

  // Display tags in the list
  displayTags(tags) {
    const listDiv = document.getElementById('tags-list');

    if (tags.length === 0) {
      listDiv.innerHTML = '<div class="notification">No tags yet. Add your first tag above!</div>';
      return;
    }

    listDiv.innerHTML = tags.map(tag => this.renderTagItem(tag)).join('');

    // Attach event listeners
    this.attachTagEventListeners();
  },

  // Render a single tag item
  renderTagItem(tag) {
    return `
      <div class="box" style="padding: 1rem; margin-bottom: 0.5rem;" data-tag-id="${tag.id}">
        <div class="level is-mobile">
          <div class="level-left">
            <div class="level-item">
              <span class="tag is-medium is-info">${tag.name}</span>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <div class="buttons are-small">
                <button class="button is-warning edit-tag" data-id="${tag.id}" data-name="${tag.name}">
                  <span class="icon"><i class="fas fa-edit"></i></span>
                  <span>Edit</span>
                </button>
                <button class="button is-danger delete-tag" data-id="${tag.id}">
                  <span class="icon"><i class="fas fa-trash"></i></span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Attach event listeners to tag buttons
  attachTagEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-tag').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const name = e.currentTarget.dataset.name;
        await this.editTag(id, name);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-tag').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('Are you sure you want to delete this tag?')) {
          await this.deleteTag(id);
        }
      });
    });
  },

  // Add new tag
  async addNewTag() {
    const input = document.getElementById('new-tag-input');
    const tagName = input.value.trim();

    if (!tagName) {
      alert('Please enter a tag name');
      return;
    }

    try {
      await db.addTag(tagName);
      input.value = '';
      await this.loadTags();

      if (typeof app !== 'undefined' && app.showNotification) {
        app.showNotification('Tag added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag. It may already exist.');
    }
  },

  // Edit tag
  async editTag(id, currentName) {
    const newName = prompt('Edit tag name:', currentName);

    if (!newName || newName.trim() === '') {
      return;
    }

    if (newName.trim() === currentName) {
      return; // No change
    }

    try {
      await db.updateTag(id, newName.trim());
      await this.loadTags();

      if (typeof app !== 'undefined' && app.showNotification) {
        app.showNotification('Tag updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag');
    }
  },

  // Delete tag
  async deleteTag(id) {
    try {
      await db.deleteTag(id);
      await this.loadTags();

      if (typeof app !== 'undefined' && app.showNotification) {
        app.showNotification('Tag deleted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    }
  },

  // Get all tags as checkboxes HTML
  async getTagCheckboxesHTML(selectedTags = []) {
    try {
      const tags = await db.getAllTags();

      if (tags.length === 0) {
        return '<p class="help">No tags available. <a href="#" onclick="app.navigateToSection(\'tags\'); return false;">Create tags</a> first.</p>';
      }

      return tags.map(tag => {
        const isChecked = selectedTags.includes(tag.name) ? 'checked' : '';
        return `
          <label class="checkbox" style="display: block; margin-bottom: 0.5rem;">
            <input type="checkbox" name="contact-tags" value="${tag.name}" ${isChecked}>
            ${tag.name}
          </label>
        `;
      }).join('');
    } catch (error) {
      console.error('Error getting tag checkboxes:', error);
      return '<p class="help has-text-danger">Error loading tags</p>';
    }
  },

  // Get selected tags from checkboxes
  getSelectedTags(containerSelector) {
    const checkboxes = document.querySelectorAll(`${containerSelector} input[name="contact-tags"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
  }
};
