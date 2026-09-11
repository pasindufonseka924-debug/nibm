# ReEarn — Return & Earn

Complete static website source, ready to upload to a GitHub repository. No build step, npm installation, API keys, or backend is required.

## Files

- `index.html`: page markup and original embedded logo image.
- `styles.css`: complete styling.
- `app.js`: QR scanning, camera management, local wallet, demo rewards, map and sample leaderboards.
- `zxing.min.js`: bundled ZXing 0.20.0 QR decoder.
- `qr-*.svg`: all six supported category QR images.
- `ZXING-LICENSE.txt`: bundled dependency license.
- `.nojekyll`: serves these files without Jekyll processing.

## Upload and publish on GitHub

1. Extract this ZIP file.
2. Create a GitHub repository, for example `reearn`.
3. Upload the CONTENTS of the `ReEarn-GitHub` folder to the repository root. `index.html` must be at the root, not inside another folder. Upload the extracted files, not the ZIP itself.
4. Commit the files to your default branch (usually `main`).
5. Open repository **Settings → Pages**.
6. Select **Deploy from a branch**, your default branch, and **/(root)**, then save.
7. Once deployment completes, open the published HTTPS URL shown by GitHub. For a project repository it usually resembles `https://YOUR-USERNAME.github.io/reearn/`.

Official instructions: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Run locally

With Python installed, open a terminal in this folder:

```sh
python -m http.server 8000
```

Open `http://localhost:8000` on the same computer. On Windows, `py -m http.server 8000` can be used if the command is `py`.

For phone camera testing use the published HTTPS site. A phone opening an ordinary HTTP LAN address may not receive camera access. Allow the browser camera permission. Opening the HTML directly is not the recommended camera test.

## QR test

1. Open the scan screen and select **Fixed QR**.
2. Display that QR on another device or print it.
3. Aim the camera at it. The app identifies the category and adds its points automatically.
4. Alternatively, choose **Scan QR image** and select a saved QR image.
5. A completed scan locks the scanner until you choose **Scan another**.

| QR payload | Category | Points |
| --- | --- | --- |
| REEARN-SMALL-BEV | Small beverage bottle | 5 |
| REEARN-LARGE-BEV | Large beverage bottle | 10 |
| REEARN-PERSONAL-CARE | Personal care bottle | 8 |
| REEARN-HOUSEHOLD | Household bottle | 10 |
| REEARN-CAN | Can | 8 |
| REEARN-OTHER-PLASTIC | Other plastic container | 5 |

These QR codes contain category text; they do not open the website when scanned with a separate phone camera app. They must be scanned inside ReEarn. Ordinary commercial product barcodes are not registered.

## Data and demo behavior

Wallet counts, spending, vouchers and recent activity are saved in this browser's localStorage under `reearn-v1`. Different browsers and devices have separate wallets. Clearing site data clears the wallet. Moving to a different website address does not transfer the old wallet.

Vouchers have no cash value. Shop participation is unverified, and other leaderboard entries are sample data. Category QR codes are reusable: locking prevents repeated frame credits in one scan session, but does not prove a physical bottle return or prevent reuse in later sessions. This is a frontend demonstration, not a secure rewards/payment service.

The page uses external Google Fonts, Leaflet from cdnjs, and CARTO/OpenStreetMap map tiles. These need internet access; the QR decoder and category QR images are bundled locally. This is not a fully offline app.

## Validation performed

All six generated category QR patterns were decoded with the real bundled ZXing decoder. Logic checks covered category crediting, duplicate scan locking, unknown QR rejection, redemption, insufficient funds, saved wallet restoration, leaderboard switching, and cleanup of a late camera permission response. JavaScript syntax was checked. Physical phone-camera testing remains necessary on your device.

## Third-party components

ZXing JavaScript library 0.20.0 is bundled unchanged from `https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js`; see `ZXING-LICENSE.txt` and https://github.com/zxing-js/library. Leaflet is loaded remotely, with map attribution displayed in the app. Original user-supplied branding is retained.

## Fixed QR and fill animation update

Category QR image files and their payloads remain unchanged across visits; existing printed codes still work. Each successful scan animates the result bottle from the previous category total to the new total. Every 50 lifetime category points completes one bottle; overflow fills the next one. Redeeming wallet points does not erase lifetime bottle progress. Reduced-motion browser settings display the final fill immediately. Animation boundaries (empty, partial, full, overflow) are covered by logic checks; animation has not been visually tested on a physical device.
