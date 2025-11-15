net-cards is a PWA that facilitates networking through contact info exchange,  It has the following features:

- Extended V-Card format using only standard V-Card 3.0 fields for maximum compatibility
    - Social media stored as multiple URL fields with TYPE parameters (URL;TYPE=LinkedIn:, etc.)
    - Event information stored in NOTE field (always displayed in contacts apps)
    - No custom X- fields needed - works with all standard contacts applications
    - Social links appear as additional URLs/websites in iOS, Android, and desktop contacts apps
- QR code generator for user's card
- QR reader for adding contacts
- Stores an "event" tag with each contact.
    - User can set the event when generating their QR code
    - User can also set the default event when scanning QR codes (if a card is scanned with no event, the default is used; otherwise if they are different, both are used).
    - function to view all contacts scanned at a given event
- Once stored, a card can be added to the main contacts app via the sharing drawer.
- Cards can be exported to standard V-Card format
- Cards can be imported from standard V-Card format with or without the formatted notes.

For development:

- Please use plain javascript with no frameworks
- Use IndexedDB for persistence
- qrcode.js for QR code generation
- jsQR for QR code reading
- use Bulma for css
- use jsdeliver for CDN.
- service worker for offline support.


