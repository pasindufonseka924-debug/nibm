# ReEarn — Return & Earn

Complete static website source, ready to upload to a GitHub repository. No build step, npm installation, API keys, or backend is required.

## Files

- `index.html`: page markup and original embedded logo image.
- `styles.css`: complete styling.
- `app.js`: QR scanning, camera management, local wallet, demo rewards, map and sample leaderboards.
- `zxing.min.js`: bundled ZXing 0.20.0 QR decoder.
- `jsQR.js` and `jsQR-LICENSE.txt`: bundled jsQR 1.4.0 primary pixel decoder.
- QR labels are delivered separately; this website contains no displayed QR labels.
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

## Update and test the scanner

Replace ALL website files with this release, including the new `jsQR.js` file. Wait for GitHub Pages to finish updating, then reload the page (hard-refresh on desktop or close/reopen the browser tab on mobile). Old cached JavaScript or an old live URL will not contain this repair.

The separately supplied `ReEarn-Bottle-QR-Sheet.pdf` and `ReEarn-Bottle-QR-Labels.zip` are for printing or sharing with the person scanning. Do not upload these QR deliverables into the website repository.

1. Print one QR label or display it on a second device.
2. Open the ReEarn website using its HTTPS link in Chrome or Safari.
3. Open **Scan a bottle** and allow camera permission; use **Start Camera** if needed.
4. Keep one complete QR and its white border visible. Hold steady in good lighting.
5. The decoded QR determines the bottle category regardless of the selected chip, and automatically adds that category's points. The bottle then fills with animation.
6. Alternatively, use **Scan QR image** and choose one of the separate labeled PNGs. This uses the same pixel decoder as the live camera.
7. Choose **Scan another** only when ready to record another item.

Scanning these text QR codes using a separate phone camera app will not add points; scanning must happen inside ReEarn. The QR payloads are unchanged, so earlier printed ReEarn category codes remain supported.

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

The page uses external Google Fonts, Leaflet from cdnjs, and CARTO/OpenStreetMap map tiles. These need internet access; the QR decoders are bundled locally. This is not a fully offline app.

## Validation performed

All six generated category QR patterns were decoded with the real bundled ZXing decoder. Logic checks covered category crediting, duplicate scan locking, unknown QR rejection, redemption, insufficient funds, saved wallet restoration, leaderboard switching, and cleanup of a late camera permission response. JavaScript syntax was checked. Physical phone-camera testing remains necessary on your device.

## Third-party components

ZXing JavaScript library 0.20.0 is bundled unchanged from `https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js`; see `ZXING-LICENSE.txt` and https://github.com/zxing-js/library. Leaflet is loaded remotely, with map attribution displayed in the app. Original user-supplied branding is retained.

## Permanent codes and animation

Category QR payloads remain unchanged across visits. Each 50 lifetime category points completes a progress bottle, with overflow carried to the next bottle. Spending points does not erase lifetime fill progress. Reduced-motion settings show the final state immediately.

## Latest scanner repair and checks

Camera and image input now use the same canvas pixel-reading path, with jsQR as the primary decoder and ZXing as a fallback. Full frames and central crops are tried during camera scanning. Unreadable QR frames do not stop the camera. Continuous focus is requested where the camera supports it.

Validated the actual six labeled PNGs at full size, rotated and reduced size, plus all six QR cards cropped from the rendered PDF: 24 successful pixel-decoding checks. The six original labeled PNGs also passed using only the ZXing fallback. Category crediting, duplicate frame locking, invalid-code rejection, local persistence, redemption and late camera cleanup checks passed. Physical phone-camera scanning and browser animation appearance still require device testing.

jsQR 1.4.0 is bundled unchanged from https://unpkg.com/jsqr@1.4.0/dist/jsQR.js; see `jsQR-LICENSE.txt`.
