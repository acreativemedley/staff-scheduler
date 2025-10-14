This folder contains helper files and instructions to deploy the staff-scheduler React app to a VPS running Apache.

Overview
- Build the React app locally (or on a CI runner).
- Upload the contents of the build output (commonly `build/` or `dist/`) to your VPS DocumentRoot for the site.
- Ensure Apache is configured with an appropriate VirtualHost and the server rewrites unknown routes to `index.html` (SPA fallback).

Files in this folder
- `deploy.ps1` - PowerShell helper to build, package and upload the build to a remote server using SCP/SFTP.
- `apache/matp-vhost.conf` - Example Apache VirtualHost config for hosting the app.
- `.htaccess` - SPA rewrite rules and recommended caching headers for shared hosts / Apache setups.

Quick steps
1. Check out branch `MATP`.
2. From the repository root run locally:
   - npm install
   - npm run build
3. Upload `build/` contents to your server's site folder (e.g., `/var/www/matp`).
4. Install the `matp-vhost.conf` into `/etc/apache2/sites-available/` and enable it:
   - sudo a2ensite matp-vhost.conf
   - sudo systemctl reload apache2

Security notes
- Don’t commit secrets (SSH private keys, .env files) to the repo. Use environment variables or your server's secret store.
- For HTTPS, use Certbot / Let's Encrypt to obtain and install certificates.

If you want, I can customize the deploy script to use SFTP, rsync over SSH, or integrate with GitHub Actions for automated deploys.
