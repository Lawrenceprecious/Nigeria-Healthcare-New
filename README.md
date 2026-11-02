# HealthConnect Nigeria — website project

## Quick preview on a phone or laptop
Open `OPEN-THIS-IN-CHROME.html` from the ZIP to view a single-file visual preview. It can be opened directly in Chrome and includes demo-only interactions.

## Full multi-page project
Open the `healthconnect-project` folder in VS Code and run `index.html` using Live Server. Pages included: home, facilities, booking, doctors, login, register, and separate patient, doctor, facility, and admin dashboards. Shared styles/scripts are in `css/` and `js/`.

## Backend included
`backend/server.js` is an Express/MongoDB backend foundation. `backend/package.json` has corrected start scripts. To try locally, install Node.js LTS and MongoDB (or configure MongoDB Atlas), open a terminal in `backend/`, run `npm install`, copy `.env.example` to `.env`, set `MONGODB_URI` and a strong random `JWT_SECRET`, then run `npm start`. Never publish `.env` or credentials.

## Important limitations
This is a prototype/starter, not a complete production healthcare service. The current frontend login/register/booking interactions are demo UI and are not yet wired to the backend; booking may be stored only in browser localStorage. Real deployment needs frontend-to-API integration, validation, access/security review, account recovery, admin provisioning, testing, privacy review, and monitoring. Demo provider entries are illustrative and unverified. Do not enter real patient or sensitive medical information.


## Added from your screenshots
- Floating Contact button (links to a contact page; no fake phone/email is invented).
- Favicon and keyboard skip link/focus visibility.
- Privacy Policy, Terms and Conditions, Cookie Policy, Refund Policy, Contact, and Data Request pages.
- Cookie-choice banner for essential browser storage; this enhancement does not add analytics/advertising trackers.
- Consent checkbox added to personal-information forms where applicable.
- Reduced-motion accessibility support and legal links in footers.
- Sample provider data remains explicitly marked as demo/unverified; no fake reviews or invented usage metrics were added.

## Important before public launch
Legal pages are draft templates, not legal advice. Replace bracketed operator/contact details and have them reviewed. The consent banner does not itself make the service legally compliant. This prototype is not ready for real patient medical information or live healthcare use: backend authentication, access control, secure storage, appointment routing, deletion workflows, backups, and security testing must be completed first. Data-request form is only a local demo and does not transmit requests.

## Welcome page and UX
The main `index.html` is the public welcome page. Visitors can explore public healthcare information before choosing **Log in** or **Get started**. The responsive UX refinements are in `css/site-enhancements.css`; existing page files, JavaScript, and backend files are retained.
