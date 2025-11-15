# Net-Cards

A Progressive Web App (PWA) for networking through contact information exchange via QR codes.

## Features

- **Extended V-Card Format**: Uses the notes field to store additional data (social media, tags, events)
- **QR Code Generation**: Generate QR codes for your contact card
- **QR Code Scanner**: Scan QR codes to add contacts
- **Event Tracking**: Associate contacts with specific events (conferences, meetups, etc.)
- **Contact Management**: View, search, and filter contacts
- **Import/Export**: Import and export contacts in standard V-Card format
- **Offline Support**: Works offline through service worker caching
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- Plain JavaScript (no frameworks)
- IndexedDB for local storage
- [qrcodejs](https://github.com/davidshimjs/qrcodejs) by davidshimjs for QR code generation
- [jsQR](https://github.com/cozmo/jsQR) for QR code scanning
- [Bulma CSS](https://bulma.io/) for styling
- Service Worker for offline functionality
- CDN delivery via jsDelivr

## Installation

### Local Development

1. Clone the repository or download the files
2. Serve the files using a local web server (required for PWA features):

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Python 2
   python -m SimpleHTTPServer 8000

   # Using Node.js http-server
   npx http-server -p 8000

   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Production Deployment

1. Upload all files to your web server
2. Ensure HTTPS is enabled (required for PWA features like camera access)
3. The app will automatically register the service worker for offline support

## Usage

### Setting Up Your Profile

1. Navigate to the "My Card" section
2. Fill in your contact information:
   - Full Name (required)
   - Email, Phone, Company, Title (optional)
   - Website and social media links (optional)
   - Current Event (optional - will be embedded in your QR code)
3. Click "Save Profile"
4. Your QR code will be generated automatically
5. Download your QR code for printing or sharing

### Scanning Contacts

1. Navigate to the "Scan" section
2. Set a default event name (optional)
3. Click "Start Camera" and grant camera permissions
4. Point your camera at a contact's QR code
5. The contact will be automatically saved with the event tag

**Event Handling:**
- If the scanned card has no event and you set a default event, the default is used
- If the scanned card has an event different from your default, both events are saved

### Managing Contacts

1. Navigate to the "Contacts" section
2. Search contacts by name, email, company, or title
3. Filter contacts by event
4. For each contact, you can:
   - Share the contact (uses Web Share API or downloads VCF)
   - Export as VCF file
   - Delete the contact

### Import/Export

#### Importing Contacts
1. Navigate to "Import/Export" section
2. Click "Choose VCF file" and select a .vcf or .vcard file
3. Click "Import"
4. Contacts will be added to your database

#### Exporting Contacts
- **Export All**: Downloads all contacts as a single VCF file
- **Export by Event**: Select an event and download only contacts from that event

## Extended V-Card Format

Net-Cards uses standard V-Card 3.0 fields with multiple URLs for maximum compatibility:

```
BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
EMAIL;TYPE=INTERNET:john@example.com
TEL;TYPE=CELL:+1234567890
ORG:Acme Corp
TITLE:Software Engineer
URL;TYPE=WORK:https://example.com
URL;TYPE=LinkedIn:https://linkedin.com/in/johndoe
URL;TYPE=Twitter:https://twitter.com/johndoe
URL;TYPE=GitHub:https://github.com/johndoe
NOTE:Event: Tech Conference 2024
LinkedIn: linkedin.com/in/johndoe | Twitter: @johndoe | GitHub: github.com/johndoe
END:VCARD
```

**Why This Approach?**
- Uses only standard V-Card 3.0 fields (100% compatible)
- Social media stored as URL fields with TYPE labels
- Shows up as multiple website/URL entries in all contacts apps
- Event information stored in NOTE field (always displayed)
- Works on iOS, Android, and all major contacts applications
- No custom or vendor-specific extensions needed

**What You'll See:**
- **Standard contacts apps**: Social links appear as additional URLs/websites
- **Notes field**: Shows the event name and social handles for easy reference
- **Fully compatible**: No data loss when importing/exporting

## Browser Support

- **Camera Access**: Required for QR scanning (HTTPS only)
- **IndexedDB**: For local storage
- **Service Workers**: For offline support (HTTPS only)
- **Web Share API**: Optional, for native sharing (fallback to download)

### Recommended Browsers
- Chrome/Edge (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile)

## PWA Installation

On supported devices, you can install Net-Cards as a standalone app:

- **Android/Chrome**: Tap the "Add to Home Screen" prompt or menu option
- **iOS/Safari**: Tap Share → "Add to Home Screen"
- **Desktop**: Look for the install icon in the address bar

## Privacy

- All data is stored locally in your browser's IndexedDB
- No data is sent to external servers
- No tracking or analytics
- Camera access is only used for QR scanning and is not recorded

## File Structure

```
net-cards/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── icon-192.png           # App icon (192x192)
├── icon-512.png           # App icon (512x512)
├── CLAUDE.md              # Project instructions
├── README.md              # This file
└── js/
    ├── app.js             # Main application logic
    ├── db.js              # IndexedDB wrapper
    ├── vcard.js           # V-Card parser/generator
    ├── qr-generator.js    # QR code generation
    ├── qr-scanner.js      # QR code scanning
    ├── contacts.js        # Contact management
    └── import-export.js   # Import/export functionality
```

## Development Notes

- The app uses plain JavaScript with no build process
- All dependencies are loaded from CDN (jsDelivr)
- IndexedDB is used for persistence (no server required)
- The service worker caches all assets for offline use

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS (required for camera access)
- Grant camera permissions when prompted
- Check that no other app is using the camera

### QR Code Not Scanning
- Ensure good lighting
- Hold the QR code steady
- Try increasing/decreasing distance from camera

### Offline Features Not Working
- Service workers require HTTPS (except on localhost)
- Clear browser cache and reload if service worker isn't updating

### Contacts Not Saving
- Check browser console for errors
- Ensure IndexedDB is enabled in your browser
- Try clearing site data and starting fresh

## License

This project is provided as-is for networking and contact exchange purposes.

## Contributing

This is a standalone PWA with no external dependencies. To contribute:
1. Follow the existing code style (plain JavaScript, no frameworks)
2. Test on multiple browsers and devices
3. Ensure offline functionality works
4. Update documentation as needed
