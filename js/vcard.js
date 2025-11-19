// V-Card parser and generator with extended notes format
// Notes format: key:value pairs

const VCard = {
  // Generate V-Card from contact data
  generate(contactData) {
    let vcard = 'BEGIN:VCARD\r\n';
    vcard += 'VERSION:3.0\r\n';

    // Name (required)
    if (contactData.name) {
      // Split name into parts (Last, First)
      const nameParts = contactData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      vcard += `N:${lastName};${firstName};;;\r\n`;
      vcard += `FN:${contactData.name}\r\n`;
    }

    // Email
    if (contactData.email) {
      vcard += `EMAIL;TYPE=INTERNET:${contactData.email}\r\n`;
    }

    // Phone
    if (contactData.phone) {
      vcard += `TEL;TYPE=CELL:${contactData.phone}\r\n`;
    }

    // Organization
    if (contactData.company) {
      vcard += `ORG:${contactData.company}\r\n`;
    }

    // Title
    if (contactData.title) {
      vcard += `TITLE:${contactData.title}\r\n`;
    }

    // Website (primary)
    if (contactData.website) {
      vcard += `URL:${contactData.website}\r\n`;
    }

    // Use item grouping for labeled URLs (Apple/iOS compatible)
    let itemCount = 1;

    if (contactData.linkedin) {
      const linkedinUrl = contactData.linkedin.startsWith('http')
        ? contactData.linkedin
        : `https://${contactData.linkedin}`;
      vcard += `item${itemCount}.URL:${linkedinUrl}\r\n`;
      vcard += `item${itemCount}.X-ABLabel:LinkedIn\r\n`;
      itemCount++;
    }

    if (contactData.twitter) {
      const twitterHandle = contactData.twitter.replace('@', '');
      vcard += `item${itemCount}.URL:https://twitter.com/${twitterHandle}\r\n`;
      vcard += `item${itemCount}.X-ABLabel:Twitter\r\n`;
      itemCount++;
    }

    if (contactData.github) {
      const githubUrl = contactData.github.startsWith('http')
        ? contactData.github
        : `https://${contactData.github}`;
      vcard += `item${itemCount}.URL:${githubUrl}\r\n`;
      vcard += `item${itemCount}.X-ABLabel:GitHub\r\n`;
      itemCount++;
    }

    // Store event and metadata in NOTE field (always displayed)
    const noteText = this.generateNoteText(contactData);
    if (noteText) {
      vcard += `NOTE:${noteText}\r\n`;
    }

    // Add categories/tags
    if (contactData.tags && contactData.tags.length > 0) {
      const categories = contactData.tags.join(',');
      vcard += `CATEGORIES:${categories}\r\n`;
    }

    vcard += 'END:VCARD\r\n';
    return vcard;
  },

  // Generate note text with all custom data
  generateNoteText(contactData) {
    const notes = [];

    if (contactData.event) {
      notes.push(`Event: ${contactData.event}`);
    }

    // Add branding footer
    notes.push('Via netcards.app');

    // vCard 3.0 requires newlines to be encoded as \n (literal backslash-n)
    return notes.join('\\n');
  },

  // Parse V-Card string to contact data
  parse(vcardString) {
    const contactData = {};
    const itemGroups = {}; // Store item1.URL, item1.X-ABLabel pairs
    const lines = vcardString.split(/\r?\n/);
    let currentProperty = '';
    let currentValue = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Handle line folding (continuation lines start with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
        continue;
      }

      // Process the previous property if we have one
      if (currentProperty) {
        this.parseProperty(currentProperty, currentValue, contactData, itemGroups);
      }

      // Parse new property
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        currentProperty = line.substring(0, colonIndex);
        currentValue = line.substring(colonIndex + 1);
      } else {
        currentProperty = '';
        currentValue = '';
      }
    }

    // Process the last property
    if (currentProperty) {
      this.parseProperty(currentProperty, currentValue, contactData, itemGroups);
    }

    // Process item groups to extract labeled URLs
    this.processItemGroups(itemGroups, contactData);

    return contactData;
  },

  // Parse individual property
  parseProperty(property, value, contactData, itemGroups) {
    // Check for item grouping (e.g., "item1.URL")
    const itemMatch = property.match(/^(item\d+)\.(.+)$/);
    if (itemMatch) {
      const itemName = itemMatch[1];
      const propName = itemMatch[2];

      if (!itemGroups[itemName]) {
        itemGroups[itemName] = {};
      }
      itemGroups[itemName][propName] = value;
      return;
    }

    // Remove parameters (e.g., "EMAIL;TYPE=INTERNET" -> "EMAIL")
    const propName = property.split(';')[0];

    switch (propName) {
      case 'FN':
        contactData.name = value;
        break;
      case 'EMAIL':
        if (!contactData.email) contactData.email = value;
        break;
      case 'TEL':
        if (!contactData.phone) contactData.phone = value;
        break;
      case 'ORG':
        contactData.company = value;
        break;
      case 'TITLE':
        contactData.title = value;
        break;
      case 'URL':
        // Parse URL with TYPE parameter
        this.parseURL(property, value, contactData);
        break;
      case 'NOTE':
        // Parse notes field
        this.parseNotes(value, contactData);
        break;
      case 'CATEGORIES':
        // Parse categories/tags (comma-separated)
        contactData.tags = value.split(',').map(t => t.trim()).filter(t => t);
        break;
    }
  },

  // Process item groups to extract labeled URLs
  processItemGroups(itemGroups, contactData) {
    for (const itemName in itemGroups) {
      const item = itemGroups[itemName];

      if (item.URL && item['X-ABLabel']) {
        const label = item['X-ABLabel'].toLowerCase();
        const url = item.URL;

        switch (label) {
          case 'linkedin':
            if (!contactData.linkedin) contactData.linkedin = url;
            break;
          case 'twitter':
            if (!contactData.twitter) {
              // Extract handle from URL
              const match = url.match(/twitter\.com\/([^/?]+)/);
              contactData.twitter = match ? '@' + match[1] : url;
            }
            break;
          case 'github':
            if (!contactData.github) contactData.github = url;
            break;
        }
      }
    }
  },

  // Parse URL field with TYPE parameter
  parseURL(property, value, contactData) {
    // Extract TYPE parameter (case insensitive)
    const typeMatch = property.match(/TYPE=([^;]+)/i);

    if (typeMatch) {
      const type = typeMatch[1].toLowerCase();

      switch (type) {
        case 'linkedin':
          if (!contactData.linkedin) contactData.linkedin = value;
          break;
        case 'twitter':
          if (!contactData.twitter) {
            // Extract handle from URL
            const match = value.match(/twitter\.com\/([^/?]+)/);
            contactData.twitter = match ? '@' + match[1] : value;
          }
          break;
        case 'github':
          if (!contactData.github) contactData.github = value;
          break;
        case 'work':
        case 'home':
          if (!contactData.website) contactData.website = value;
          break;
        default:
          // First URL without specific type becomes website
          if (!contactData.website) contactData.website = value;
          break;
      }
    } else {
      // No TYPE parameter, use as website
      if (!contactData.website) contactData.website = value;
    }
  },

  // Parse notes field
  parseNotes(notesString, contactData) {
    const lines = notesString.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        switch (key.toLowerCase()) {
          case 'event':
            if (!contactData.event) contactData.event = value;
            break;
          case 'added':
            // Parse date if needed
            if (!contactData.timestamp) contactData.timestamp = value;
            break;
          case 'linkedin':
            if (!contactData.linkedin) contactData.linkedin = value;
            break;
          case 'twitter':
            if (!contactData.twitter) contactData.twitter = value;
            break;
          case 'github':
            if (!contactData.github) contactData.github = value;
            break;
          case 'timestamp':
            if (!contactData.timestamp) contactData.timestamp = value;
            break;
        }
      }
    }
  },

  // Fold long lines according to VCard spec (max 75 chars per line)
  foldLine(line) {
    if (line.length <= 75) {
      return line + '\r\n';
    }

    let result = '';
    let remaining = line;

    while (remaining.length > 75) {
      result += remaining.substring(0, 75) + '\r\n';
      remaining = ' ' + remaining.substring(75); // Continuation lines start with space
    }

    result += remaining + '\r\n';
    return result;
  },

  // Parse multiple VCards from a file
  parseMultiple(vcardString) {
    const contacts = [];
    const vcards = vcardString.split(/END:VCARD/i);

    for (const vcard of vcards) {
      if (vcard.trim() && vcard.includes('BEGIN:VCARD')) {
        const fullVcard = vcard.trim() + '\r\nEND:VCARD';
        try {
          const contact = this.parse(fullVcard);
          if (contact.name) { // Only add if has at least a name
            contacts.push(contact);
          }
        } catch (e) {
          console.error('Error parsing vcard:', e);
        }
      }
    }

    return contacts;
  },

  // Generate multiple VCards
  generateMultiple(contacts) {
    return contacts.map(contact => this.generate(contact)).join('');
  }
};
