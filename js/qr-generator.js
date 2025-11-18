// QR Code generator module
const QRGenerator = {
  qrCodeInstance: null,

  // Wait for QRCode library to be loaded
  async waitForQRCodeLibrary() {
    if (typeof QRCode !== 'undefined') {
      return true;
    }

    // Wait up to 5 seconds for library to load
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof QRCode !== 'undefined') {
        return true;
      }
    }

    return false;
  },

  // Initialize QR code display
  async init() {
    // Clear existing QR code
    const qrDisplay = document.getElementById('qrcode');
    qrDisplay.innerHTML = '';

    // Wait for QRCode library
    const libraryLoaded = await this.waitForQRCodeLibrary();
    if (!libraryLoaded) {
      qrDisplay.innerHTML = '<p class="has-text-danger">QR Code library failed to load</p>';
      console.error('QRCode library not loaded');
      return;
    }

    // Load profile and generate QR
    try {
      const profile = await db.getProfile();
      if (profile && profile.name) {
        await this.generateFromProfile(profile);
      } else {
        qrDisplay.innerHTML = '<p class="has-text-grey">No profile saved yet. Fill out the form to generate your QR code.</p>';
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      qrDisplay.innerHTML = '<p class="has-text-danger">Error loading profile</p>';
    }
  },

  // Generate QR code from profile data
  async generateFromProfile(profile) {
    const vcardString = VCard.generate(profile);
    await this.generate(vcardString, profile.event);
  },

  // Generate QR code from V-Card string
  async generate(vcardString, event = '') {
    const qrDisplay = document.getElementById('qrcode');

    // Clear existing QR code completely
    qrDisplay.innerHTML = '';
    this.qrCodeInstance = null;

    try {
      // Check if QRCode library is available
      if (typeof QRCode === 'undefined') {
        const libraryLoaded = await this.waitForQRCodeLibrary();
        if (!libraryLoaded) {
          throw new Error('QRCode library not available');
        }
      }

      // Create new QR code instance
      // Using L (low) error correction to maximize data capacity
      this.qrCodeInstance = new QRCode(qrDisplay, {
        text: vcardString,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
      });

      // Update event display
      const eventDisplay = document.getElementById('event-display');
      if (event) {
        eventDisplay.textContent = `Event: ${event}`;
      } else {
        eventDisplay.textContent = 'No event specified';
      }

      console.log('QR code generated successfully');
      return true;
    } catch (error) {
      console.error('Error generating QR code:', error);
      qrDisplay.innerHTML = '<p class="has-text-danger">Error generating QR code: ' + error.message + '</p>';
      return false;
    }
  },

  // Download QR code as image
  downloadQR() {
    const qrCanvas = document.querySelector('#qrcode canvas');
    if (!qrCanvas) {
      alert('No QR code to download');
      return;
    }

    try {
      // Convert canvas to blob
      qrCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'net-card-qr.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code');
    }
  }
};
