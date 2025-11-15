// QR Code scanner module using jsQR
const QRScanner = {
  video: null,
  canvas: null,
  canvasContext: null,
  scanning: false,
  stream: null,

  // Initialize scanner
  init() {
    this.video = document.getElementById('qr-video');
    this.canvas = document.getElementById('qr-canvas');
    this.canvasContext = this.canvas.getContext('2d');
  },

  // Start camera and scanning
  async startScanning() {
    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });

      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', true); // Required for iOS
      await this.video.play();

      this.scanning = true;

      // Update UI
      document.getElementById('start-scan').style.display = 'none';
      document.getElementById('stop-scan').style.display = 'inline-flex';

      // Start scanning loop
      requestAnimationFrame(() => this.scan());

    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showResult('error', 'Failed to access camera. Please grant camera permissions.');
    }
  },

  // Stop scanning
  stopScanning() {
    this.scanning = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    // Update UI
    document.getElementById('start-scan').style.display = 'inline-flex';
    document.getElementById('stop-scan').style.display = 'none';
  },

  // Scan for QR code
  scan() {
    if (!this.scanning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      this.canvas.height = this.video.videoHeight;
      this.canvas.width = this.video.videoWidth;

      // Draw video frame to canvas
      this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Get image data
      const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        // QR code found
        this.handleQRCode(code.data);
        return; // Stop scanning after successful read
      }
    }

    // Continue scanning
    requestAnimationFrame(() => this.scan());
  },

  // Handle scanned QR code
  async handleQRCode(data) {
    this.stopScanning();

    try {
      // Check if it's a V-Card
      if (!data.includes('BEGIN:VCARD')) {
        this.showResult('warning', 'Not a valid V-Card QR code');
        return;
      }

      // Parse V-Card
      const contactData = VCard.parse(data);

      if (!contactData.name) {
        this.showResult('warning', 'V-Card does not contain a name');
        return;
      }

      // Handle event tagging
      const defaultEvent = document.getElementById('default-scan-event').value.trim();

      if (!contactData.event && defaultEvent) {
        // No event in card, use default
        contactData.event = defaultEvent;
      } else if (contactData.event && defaultEvent && contactData.event !== defaultEvent) {
        // Different events, use both
        contactData.event = `${contactData.event}, ${defaultEvent}`;
      }

      // Save to database
      const contactId = await db.addContact(contactData);

      this.showResult('success', `Contact "${contactData.name}" saved successfully!`);

      // Refresh contacts list if on that page
      if (typeof ContactsManager !== 'undefined') {
        await ContactsManager.loadContacts();
      }

    } catch (error) {
      console.error('Error processing QR code:', error);
      this.showResult('error', 'Failed to save contact: ' + error);
    }
  },

  // Show result message
  showResult(type, message) {
    const resultDiv = document.getElementById('scan-result');
    resultDiv.className = `notification is-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'}`;
    resultDiv.textContent = message;
    resultDiv.classList.remove('is-hidden');

    // Hide after 5 seconds
    setTimeout(() => {
      resultDiv.classList.add('is-hidden');
    }, 5000);
  }
};
