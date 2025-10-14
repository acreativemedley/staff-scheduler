
This folder contains helper files and detailed instructions to deploy the staff-scheduler React app to DreamHost using a VPS (Apache).

Important: DreamHost has multiple hosting modes (shared, VPS, dedicated). The instructions below assume you have a DreamHost VPS (you created a user with SSH access and you have root or sudo on the server). If you are on DreamHost shared hosting, scroll to the "Shared hosting notes" section — the main differences are that you cannot install an Apache VirtualHost file and must rely on `.htaccess` and the DreamHost panel for SSL.

What you will find in this folder
- `deploy.ps1` — PowerShell helper that runs the build, zips `build/`, uploads it via `scp` to `/tmp/` on the server, SSHs in to unzip to your site directory and sets permissions.
- `apache/matp-vhost.conf` — Example Apache VirtualHost you can install on a VPS running Ubuntu/Debian (drop in `/etc/apache2/sites-available/`).
- `.htaccess` — SPA fallback + caching rules you can place in your site root (works for shared hosting and VPS).

High-level plan (summary)
1) Build the app locally: `npm install` && `npm run build` from the `staff-scheduler` folder.
2) Upload build output to your DreamHost server DocumentRoot for the domain (example `/home/<dh-user>/example.com/public_html` or `/var/www/matp` if you control Apache directly).
3) Configure Apache (VPS): install the `matp-vhost.conf` and enable it, or (shared) use `.htaccess` in the domain root.
4) Enable HTTPS (DreamHost panel or Certbot on the VPS).

Where to find the required information in DreamHost panel (exact locations)
- SSH username (the system user you will SSH as): DreamHost Control Panel -> Users -> Manage Users. Click the row for the user you created; the username is shown there. If you didn't create one, create a new user and enable SSH access there.
- Server hostname / IP address: DreamHost Control Panel -> Domains -> Manage Domains -> find your domain and click "DNS" or "Web Hosting". The record shows the assigned server name and IP address for that domain. For a VPS you can also go to Users -> Manage Users -> the user's info often shows the host.
- Site directory (DocumentRoot): DreamHost typically uses a path under `/home/<dh-user>/example.com` or `/home/<dh-user>/example.com/public_html` for domains managed via the panel. To confirm the exact path:
   - In the DreamHost Control Panel -> Domains -> Manage Domains, find your domain row and click the "Edit" or "Show" details. Look for "Website files will be served from" or similar. If you have shell access, you can also SSH to the server and run `ls -la /home/<dh-user>` and `ls /home/<dh-user>/<your-domain>` to confirm.
- Enabling Let's Encrypt (DreamHost-provided certs): Panel -> Secure -> Certificates (or Search for "Let's Encrypt" in the panel). For VPS you can also use Certbot on the server if you prefer.

Prepare your local machine (Windows PowerShell) — SSH key and tools
1) Install OpenSSH (Windows 10+ generally has it). Open PowerShell and run:

```powershell
ssh -V
scp -V
```

2) Create an SSH keypair (ed25519 recommended). Replace your email as the comment if you want:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -C "you@example.com"
```

3) Copy your *public* key to the DreamHost panel (preferred), not the private key:
   - Open the file `%USERPROFILE%\.ssh\id_ed25519.pub` in Notepad and copy the contents.
   - DreamHost Panel -> Users -> Manage Users -> choose the SSH user -> there should be a field to add an "Authorized SSH Key" or a place to paste the public key. If you do not see that, DreamHost docs show how to add an SSH key for the user (search "DreamHost add SSH key" in the control panel help). Alternatively, you can paste the public key into `~/.ssh/authorized_keys` on the server after SSHing with a password once.

Find the values you will pass to the deploy script
- RemoteUser: the SSH user you created in DreamHost. (Panel -> Users -> Manage Users)
- RemoteHost: the server IP or hostname found under Panel -> Domains -> Manage Domains (the IP / server name shown for the domain)
- RemotePath: the DocumentRoot (example `/home/<dh-user>/example.com/public_html` or `/var/www/matp` if you control the vhost). Confirm in panel or by SSHing and listing the domain folder.
- KeyPath: by default our script uses `%USERPROFILE%\.ssh\id_rsa` — update it to the path you created (e.g. `%USERPROFILE%\.ssh\id_ed25519`).

Exact deploy commands (step-by-step)
1) On your local machine, from the repo root, switch to the branch we prepared (MATP):

```powershell
Set-Location -Path .\staff-scheduler
git checkout MATP
```

2) Install dependencies and build the production bundle (this may take a couple minutes):

```powershell
npm install
npm run build
```

After `npm run build` you should have a `build` folder inside `staff-scheduler`.

3) Run the included PowerShell deploy helper (replace placeholders):

```powershell
.\deploy\deploy.ps1 -RemoteUser your_dh_user -RemoteHost your.server.ip.or.hostname -RemotePath /home/your_dh_user/example.com/public_html -KeyPath $env:USERPROFILE\.ssh\id_ed25519
```

What the script does (so you understand each step):
- Runs the build command (the script calls the build you specified).
- Zips the `build/` directory to `build.zip` locally.
- Uses `scp` to copy the zip to `/tmp/` on the remote server.
- Uses `ssh` to run remote commands: create the remote directory, remove old files, unzip `build.zip` into the remote path, set ownership to `www-data:www-data` and remove the zip from `/tmp/`.

Notes about permissions and the web user on DreamHost
- DreamHost web processes may run under `apache`, `www-data`, or a user-specific group depending on your plan. If the script's `chown -R www-data:www-data` is incorrect for your server, you will get permission errors when serving files. To confirm the correct owner:
   - SSH into your server: `ssh -i C:\Users\you\.ssh\id_ed25519 your_dh_user@your.server.ip`
   - On the server, check existing site folder ownership: `ls -ld /home/your_dh_user/example.com/public_html` — you will see owner:group. Use those values in the deploy script or change the chown command.

If you do not have root/sudo on your DreamHost plan
- If you can't run `sudo chown` on the VPS (for example shared hosting), do not use the chown step. Instead upload files owned by your user and ensure the webserver can read them (uploading via SFTP or the panel typically creates appropriate ownership). The included `.htaccess` will handle the SPA routing.

Confirming the site works
- After deploy, open `http(s)://yourdomain.example`.
- If routes 404 on refresh, ensure `.htaccess` is present in the DocumentRoot and mod_rewrite is enabled (DreamHost enables it by default). For VPS you may need to ensure `AllowOverride All` is set in your vhost (the `matp-vhost.conf` includes this).

Enabling HTTPS (DreamHost panel method — easiest)
1) DreamHost Panel -> Secure -> Certificates (or search for "Let's Encrypt").
2) Find your domain and click to enable Let’s Encrypt / Auto Renew. DreamHost will provision and install the cert for you (it may take a minute).

Alternative: Run Certbot on the VPS (if you have sudo/root). Example (Ubuntu) after vhost is installed and DNS points to server:

```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d example.com -d www.example.com
```

Shared hosting notes (if you are on DreamHost shared)
- You likely won't be able to place a vhost file into `/etc/apache2/sites-available/` — DreamHost manages that for you.
- Use the `deploy/.htaccess` file: upload it to the domain root (e.g., `/home/your_dh_user/example.com/public_html/.htaccess`). The SPA fallback and caching rules are contained there.
- Use SFTP to upload files: DreamHost Panel -> Domains -> Manage Domains -> click the domain row -> SSH/SFTP info is displayed (hostname and path). Or use DreamHost documentation: https://help.dreamhost.com/hc/en-us/articles/215769547-How-to-connect-to-your-site-using-SSH-or-SFTP

Verification & troubleshooting tips
- If `scp` fails: confirm `RemoteHost` is the IP shown in DreamHost panel and that the SSH user has access.
- If the web browser shows the previous version: clear CDN or browser cache, or ensure the server served the new files (check `index.html` timestamp on the server: `ssh && ls -l /home/.../public_html/index.html`).
- If you see permission denied on the web server: verify file ownership and permissions on the server (`ls -la`) and adjust as needed.

Optional next steps I can add for you
- Add a GitHub Actions workflow that builds on pushes to `MATP` and deploys automatically via SSH (requires adding a deploy SSH key as a GH secret).
- Change the `deploy.ps1` to use SFTP (WinSCP) or `rsync` for incremental deploys.

If you'd like, tell me whether your DreamHost account is a VPS (you created a server and can sudo) or a shared plan — I will then:
- Customize `deploy.ps1` removing `chown` for shared hosting and defaulting the `RemotePath` to the DreamHost domain path format;
- Or generate a GitHub Actions workflow that deploys automatically to your VPS using a secret SSH key you upload to the repo.

