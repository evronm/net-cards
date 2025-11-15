# Icon Files

The PWA requires icon files in PNG format. An SVG template (`icon.svg`) is provided.

## Required Icons

- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## Converting SVG to PNG

You can convert the provided `icon.svg` to PNG using various methods:

### Method 1: Online Converter
1. Visit a site like [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `icon.svg`
3. Set output size to 192x192 for the first conversion
4. Download as `icon-192.png`
5. Repeat with 512x512 for `icon-512.png`

### Method 2: Using Inkscape (Command Line)
```bash
# Install Inkscape if needed
# On Ubuntu/Debian: sudo apt-get install inkscape
# On macOS: brew install inkscape

# Convert to 192x192
inkscape icon.svg --export-type=png --export-filename=icon-192.png -w 192 -h 192

# Convert to 512x512
inkscape icon.svg --export-type=png --export-filename=icon-512.png -w 512 -h 512
```

### Method 3: Using ImageMagick
```bash
# Install ImageMagick if needed
# On Ubuntu/Debian: sudo apt-get install imagemagick
# On macOS: brew install imagemagick

# Convert to 192x192
convert -background none icon.svg -resize 192x192 icon-192.png

# Convert to 512x512
convert -background none icon.svg -resize 512x512 icon-512.png
```

### Method 4: Using Node.js (sharp)
```bash
npm install sharp

# Create a convert.js file:
```

```javascript
const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('icon.svg');

// 192x192
sharp(svg)
  .resize(192, 192)
  .png()
  .toFile('icon-192.png');

// 512x512
sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('icon-512.png');
```

```bash
node convert.js
```

## Temporary Workaround

If you can't generate PNG icons immediately, you can temporarily:

1. Use placeholder images from a service like [placeholder.com](https://placeholder.com)
2. Download:
   - `https://via.placeholder.com/192x192/667eea/ffffff?text=NC` as `icon-192.png`
   - `https://via.placeholder.com/512x512/667eea/ffffff?text=NC` as `icon-512.png`

## Custom Icons

Feel free to replace `icon.svg` with your own design. Just ensure:
- The design is clear and recognizable at small sizes
- It works well as a square
- It represents the app's purpose (networking/contacts/QR codes)
