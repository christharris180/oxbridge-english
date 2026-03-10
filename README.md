# Oxbridge English Website

A professional, bilingual (English/Spanish) website for Oxbridge English Courses.

## Features

✅ **7 Pages** - Home, Courses, Enroll, Books, Audio, Translator, Contact
✅ **Bilingual** - Full English/Spanish language switching
✅ **Embedded Translator** - Spanish ↔ English with audio playback
✅ **Mobile Responsive** - Works on all devices
✅ **Professional Design** - Elegant educational aesthetic
✅ **SEO Optimized** - Clean URLs and meta tags

## Pages Overview

1. **index.html** - Homepage with hero section
2. **courses.html** - 4 courses with detailed descriptions
3. **enroll.html** - Links to Coursify enrollment platform
4. **books.html** - Book showcase with Amazon links
5. **audio.html** - Audio downloads for both books
6. **translator.html** - Embedded Spanish/English translator with audio
7. **contact.html** - Contact information and social links

## Files Included

- `index.html` - Homepage
- `courses.html` - Courses page
- `enroll.html` - Enrollment page  
- `books.html` - Books showcase page
- `audio.html` - Audio downloads page
- `translator.html` - Translator tool page
- `contact.html` - Contact page
- `styles.css` - Main stylesheet
- `script.js` - Main JavaScript (language switcher, mobile menu)
- `translator.js` - Translator functionality
- `README.md` - This file

## How to Use Locally

1. **Open in Browser**
   - Simply open `index.html` in any modern web browser
   - All pages work offline except the translator (requires internet for API)

2. **Test the Language Toggle**
   - Click EN/ES buttons in top right
   - All content switches between English and Spanish
   - Language preference is saved in browser

3. **Test the Translator**
   - Go to translator.html
   - Type in Spanish or English
   - Click the "Listen" button to hear the translation
   - Use the microphone button for voice input

## How to Host Online

### Option 1: GitHub Pages (Free)

1. Create a GitHub account at https://github.com
2. Create a new repository (e.g., "oxbridge-english")
3. Upload all files to the repository
4. Go to Settings → Pages
5. Select "main" branch and Save
6. Your site will be live at: `https://YOUR-USERNAME.github.io/oxbridge-english/`

### Option 2: Cloudflare Pages (Free, Unlimited Bandwidth)

1. Sign up at https://pages.cloudflare.com
2. Click "Create a project"
3. Choose "Upload assets"
4. Drag and drop all files
5. Your site will be live at: `https://oxbridge-english.pages.dev`

### Option 3: Connect Custom Domain

After hosting on GitHub or Cloudflare:
1. Buy a domain (e.g., `oxbridgeenglish.com`)
2. In GitHub/Cloudflare settings, add your custom domain
3. Update DNS records at your domain registrar
4. Your site will be live at your custom domain!

## Customization

### Replace Placeholder Images

The site currently uses placeholder images. Replace these with your actual course images:

- **Courses page**: Replace the placeholder URLs in `courses.html` with actual image URLs
- **Books page**: Replace placeholder book covers in `books.html` with actual book covers

### Update Social Media Links

In all HTML files, update these links:
- Amazon link: Update to your Amazon author/seller page
- Facebook: Update to your Facebook page
- Twitter/LinkedIn: Update to your profiles

### Add Google Analytics (Optional)

Add this before `</head>` in all HTML files:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

### Add Google AdSense (Optional)

Add this in `<head>` section:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
```

## Browser Compatibility

✅ Chrome, Firefox, Safari, Edge (latest versions)
✅ Mobile browsers (iOS Safari, Chrome Mobile)
⚠️ Voice features require browser microphone permission

## Support

For questions or issues:
- Email: oxbridgeenglishcourses@gmail.com
- Phone: 0057 313 381 3833

## Credits

Designed and developed for Oxbridge English Courses
© 2026 Oxbridge English

---

**Enjoy your new website! 🎉**
