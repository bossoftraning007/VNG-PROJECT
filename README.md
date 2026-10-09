# Kanii by VNG Projects � Website

Premium real estate marketing website. Plain HTML + CSS + JavaScript, no build
step, no frameworks, no dependencies. Open `index.html` in a browser and it
works.

---

## 1. Structure

```
index.html                              Brand landing page � both projects
projects/
  future-highway-alair/
    index.html                          Project 1 microsite (full detail)
assets/
  css/style.css                         Whole design system, both pages
  js/main.js                            All behaviour, both pages
images/                                 ? DROP YOUR PHOTOS HERE
brochure/                               ? DROP YOUR PDF HERE
```

Pages are linked both ways (logo goes home, footer links to the project).

---

## 2. ?? Do these three things before going live

### 2.1 Phone, WhatsApp number, email

Open `assets/js/main.js` and edit the `CONFIG` block at the very top:

```js
const CONFIG = {
  whatsapp: "919000000000",   // digits only, country code first, no + or spaces
  phoneDisplay: "+91 90000 00000",
  email: "sales@vniprojects.in",
};
```

This one change updates every phone link, WhatsApp link and email address across
both pages. Placeholder `90000 00000` also appears in the HTML `href`s for
`tel:` links � search for `919000000000` in both HTML files and replace.

### 2.2 Domain in the `canonical` / `og:` tags

Both HTML files contain a placeholder domain `kanii.example`. Replace with your
real domain once you have it.

### 2.3 RERA registration number

In `projects/future-highway-alair/index.html`, find the **Approvals & Trust**
section and add the real RERA number to the DTCP/RERA badges. Buyers will look
for it, and having it visible is a trust signal.

---

## 3. Images � drop them in with these exact names

Save into the `images/` folder using these filenames. The site already has a
designed gradient placeholder in every slot, so nothing looks broken while the
folder is empty � drop a file in and it appears automatically.

### Project 1 microsite (`images/`)

| Filename | Used for | Orientation | Notes |
|---|---|---|---|
| `hero-entrance-arch.jpg` | Full-screen hero background | **Landscape, 16:9 or wider** | Most important image on the site. Entrance arch at golden hour, or a drone shot. 1920�1080 minimum, 2400px+ better. Keep under 500 KB. |
| `overview-aerial.jpg` | Overview section, portrait panel | **Portrait, 4:5** | Drone shot of the layout. |
| `srigandham-plantation.jpg` | Srigandham section, tall panel | **Portrait, 3:4** | Close-up of sandalwood trees. If you have the oil bottle / product shot, it goes here too. |
| `layout-map.png` | Layout & area statement | **Portrait** | Sanctioned DTCP layout plan. Use a **PNG**, not a JPG � the map has text and lines that JPEG smears. |
| `gallery-01.jpg` | Gallery � entrance arch | Landscape 4:3 | |
| `gallery-02.jpg` | Gallery � sandalwood plantation | Landscape 4:3 | |
| `gallery-03.jpg` | Gallery � internal road with streetlights | Landscape 4:3 | |
| `gallery-04.jpg` | Gallery � swimming pool | Landscape 4:3 | |
| `gallery-05.jpg` | Gallery � children's park | Landscape 4:3 | |
| `gallery-06.jpg` | Gallery � plot on the ground / boundary stones | Landscape 4:3 | |

### Brand landing page (`images/`)

| Filename | Used for | Orientation |
|---|---|---|
| `brand-hero.jpg` | Landing page hero background | **Landscape, 16:9 or wider** � your best aerial |
| `project-1-alair.jpg` | Project 1 card banner | Wide 21:9-ish crop |
| `project-2.jpg` | Project 2 card banner ("coming soon") | Wide crop |
| `about-team.jpg` | About section, portrait panel | Portrait 4:5 |

### Brochure

```
brochure/future-highway-alair-brochure.pdf
```

Both the header "Brochure" button and the hero "Download Brochure" button point
at this file. Use that exact name, or edit the two `href`s in
`projects/future-highway-alair/index.html`.

**No image editing needed.** Just save your file with the right name.

---

## 4. Editing content

Everything is plain text in the HTML. Find the section by its `id` and edit.

| To change | Edit | Find |
|---|---|---|
| Headline | `index.html` / project page | `class="display hero__title"` |
| Plot prices | project page | search `12,000` � also `data-rate="12000"` on the calculator |
| Plot size list | project page | search `135 Sq. Yards` |
| Distances | project page | search `Kolanupaka` |
| Area statement | project page | search `20.2236` |
| Amenity cards | project page | `#highlights` section |
| FAQ | project page | `data-acc` block |
| Count-up stats | either page | `data-count="�"` |

### Adding a plot size

Add a row to the price table **and** an `<option>` to the calculator `<select>`:

```html
<tr><td><strong>220 Sq. Yards</strong></td><td class="num">?12,000</td>
    <td class="num tag-price">?26,40,000</td><td>Independent villa</td></tr>
```

```html
<option value="220">220 Sq. Yards</option>
```

The calculator computes `size � rate` automatically.

### Changing the price calculation

`data-rate` on the calculator element, and `data-rate` in the FAQ text � search
`12,000`.

### Adding a third project

1. Copy the folder `projects/future-highway-alair/` ? `projects/project-three/`
2. Rewrite the content, images and `data-calc rate` in the copy
3. Copy the project card from `index.html` `#projects` and update the link and text

---

## 5. How the interactive parts work

No server or backend is required.

- **Enquiry forms** build a WhatsApp message with the visitor's details and open
  WhatsApp. To collect submissions in a spreadsheet/CRM instead, replace the
  submit handler in `initForms()` in `assets/js/main.js`.
- **Price calculator** reads `data-rate` and multiplies by the selected plot size.
  Corner/interior adjustments are in the `facing` select.
- **Map** is a Google Maps embed centred on Alair Mandal, no API key needed. To
  drop a pin on the exact site, open Google Maps ? your business ? Share ?
  Embed a map ? copy the `src` and replace the `iframe src` in the project page.
- **Scroll reveals, counters, sticky header, mobile menu, accordion** are all
  handled in `assets/js/main.js`. Content stays visible if JavaScript is off.

---

## 6. Publishing

Any static host works, all free:

1. **Netlify** � drop.netlify.com, drag this whole folder onto the page. Done.
2. **Vercel** � `npx vercel` from this folder.
3. **GitHub Pages** � push to a repo, enable Pages on the branch.
4. **Google Drive / any shared folder** � works, but bad for SEO. Use a real host.

After publishing:

- Add a real logo image and replace the `logo__mark` letter in both HTML files
- Set up Google Search Console and submit the sitemap
- Create the Google Business Profile and point it at the live URL
- Replace the `kanii.example` domain in both files

---

## 7. Checking your changes

Two test scripts are included. Run them from this folder with Node (v18+):

```
node check.js        # fast static check � no browser
node cdp-test.js     # full browser test � 40 assertions, opens headless Chrome
```

`check.js` verifies tag balance, duplicate IDs, dead `#anchor` links, icons
used but never defined, undefined CSS custom properties, and JS syntax.

`cdp-test.js` launches a real headless Chrome and verifies the things that
actually matter to a buyer:

- the price calculator returns correct amounts for every plot size, plus
  corner and interior adjustments
- the enquiry form builds a valid WhatsApp message
- FAQ accordion opens and closes correctly
- every WhatsApp / `tel:` / email link resolves
- missing photos fall back to the designed placeholder � no broken-image icons
- the header solidifies on scroll and reveals trigger
- no horizontal overflow at 1440px **or** 390px
- the mobile drawer opens, and the sticky CTA bar appears
- no JavaScript console errors

Both exit non-zero on failure, so you can wire them into a deploy step.
Edit content, re-run, and you know you did not break anything.

> If you change a `data-*` hook in the HTML, update the matching selector in
> `assets/js/main.js` � the test suite will catch it if you forget.

---

## 8. Design system reference

Everything visual lives in `assets/css/style.css`.

| Token | Value | Use |
|---|---|---|
| `--gold` | `#C9A961` | Accent, buttons, highlights |
| `--ink` | `#0C1411` | Dark sections, footer |
| `--forest` | `#163025` | Gradients, secondary dark |
| `--cream` | `#F8F5F0` | Page background |
| `--sand` | `#EBE3D7` | Alternating section background |
| `--f-display` | Cormorant Garamond | All headings � the luxury serif |
| `--f-sans` | Inter | All body text and UI |

Classes worth knowing:

- `section section--dark` / `--sand` / `--white` / `--cream` � section backgrounds
- `split split--wide-left` � two-column layout, wide side first
- `grid grid-2|3|4` � responsive card grid
- `card` � hover-lift card with gold top line
- `media media--portrait|--landscape|--tall|--wide|--square` � image frame with ratio
- `reveal` � fades up on scroll
- `eyebrow eyebrow--inv` � small caps label, use `--inv` on dark sections
- `btn btn--ghost` / `btn--outline-light` / `btn--solid-dark` / `btn--sm`

---

## 9. Browser support

Modern Chrome, Edge, Firefox, Safari. Uses `IntersectionObserver`, CSS custom
properties, `clamp()`, `aspect-ratio` and `backdrop-filter`. Honours
`prefers-reduced-motion` for accessibility. Prints cleanly (navigation and CTAs
hidden).
