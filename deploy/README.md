# Deploy the Staff Scheduler App to Your DreamHost VPS

This folder contains helper files and detailed instructions to deploy the staff-scheduler React app to DreamHost using a VPS (Apache).

This guide assumes you have **ZERO** experience with servers, SSH, or backend website management. We will walk through every single step, explaining what each thing means and exactly where to click in DreamHost.

Important: DreamHost has multiple hosting modes (shared, VPS, dedicated). The instructions below assume you have a DreamHost VPS (you created a user with SSH access and you have root or sudo on the server). If you are on DreamHost shared hosting, scroll to the "Shared hosting notes" section — the main differences are that you cannot install an Apache VirtualHost file and must rely on `.htaccess` and the DreamHost panel for SSL.

## What This Guide Does

What you will find in this folder

By the end, you will:- `deploy.ps1` — PowerShell helper that runs the build, zips `build/`, uploads it via `scp` to `/tmp/` on the server, SSHs in to unzip to your site directory and sets permissions.

1. Have created an SSH user on your DreamHost VPS (SSH is how your computer talks to the server securely).- `apache/matp-vhost.conf` — Example Apache VirtualHost you can install on a VPS running Ubuntu/Debian (drop in `/etc/apache2/sites-available/`).

2. Have built the React app on your local Windows computer.- `.htaccess` — SPA fallback + caching rules you can place in your site root (works for shared hosting and VPS).

3. Have uploaded the app files to your DreamHost server.

4. Have your app running at your domain with HTTPS (the secure padlock).High-level plan (summary)

1) Build the app locally: `npm install` && `npm run build` from the `staff-scheduler` folder.

## Files in This Folder2) Upload build output to your DreamHost server DocumentRoot for the domain (example `/home/<dh-user>/example.com/public_html` or `/var/www/matp` if you control Apache directly).

3) Configure Apache (VPS): install the `matp-vhost.conf` and enable it, or (shared) use `.htaccess` in the domain root.

- **`deploy.ps1`** — A PowerShell script that automates uploading your app to DreamHost.4) Enable HTTPS (DreamHost panel or Certbot on the VPS).

- **`apache/matp-vhost.conf`** — An example configuration file (you won't need to edit this unless you want advanced customization).

- **`.htaccess`** — A file that tells the web server how to handle your React app's routing.Where to find the required information in DreamHost panel (exact locations)

- SSH username (the system user you will SSH as): DreamHost Control Panel -> Users -> Manage Users. Click the row for the user you created; the username is shown there. If you didn't create one, create a new user and enable SSH access there.

---- Server hostname / IP address: DreamHost Control Panel -> Domains -> Manage Domains -> find your domain and click "DNS" or "Web Hosting". The record shows the assigned server name and IP address for that domain. For a VPS you can also go to Users -> Manage Users -> the user's info often shows the host.

- Site directory (DocumentRoot): DreamHost typically uses a path under `/home/<dh-user>/example.com` or `/home/<dh-user>/example.com/public_html` for domains managed via the panel. To confirm the exact path:

## PART 1: Set Up SSH Access on DreamHost   - In the DreamHost Control Panel -> Domains -> Manage Domains, find your domain row and click the "Edit" or "Show" details. Look for "Website files will be served from" or similar. If you have shell access, you can also SSH to the server and run `ls -la /home/<dh-user>` and `ls /home/<dh-user>/<your-domain>` to confirm.

- Enabling Let's Encrypt (DreamHost-provided certs): Panel -> Secure -> Certificates (or Search for "Let's Encrypt" in the panel). For VPS you can also use Certbot on the server if you prefer.

### What is SSH?

SSH (Secure Shell) is a way for your computer to connect to your web server and run commands, like uploading files. Think of it like remote control for your server.Prepare your local machine (Windows PowerShell) — SSH key and tools

1) Install OpenSSH (Windows 10+ generally has it). Open PowerShell and run:

### Step 1.1: Log into DreamHost Panel

1. Go to https://panel.dreamhost.com```powershell

2. Enter your DreamHost email and password.ssh -V

scp -V

### Step 1.2: Create an SSH User```

1. In the left sidebar, click **"Users"** (or search "Users" in the top search bar).

2. Click **"Manage Users"**.2) Create an SSH keypair (ed25519 recommended). Replace your email as the comment if you want:

3. You will see a list of users. If you don't have any, or want a new one for this project, click **"Add a New User"**.

4. Fill in the form:```powershell

   - **Username**: Choose a username (example: `myapp` or `yourname`). Write this down — you'll need it later.ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -C "you@example.com"

   - **Nickname**: Optional, just for you to remember.```

   - **Server**: Select your VPS server from the dropdown (it will say something like "ps123456" or show your VPS name).

   - **User Type**: Choose **"Shell User"** (NOT "SFTP Only" or "FTP Only"). This gives SSH access.3) Copy your *public* key to the DreamHost panel (preferred), not the private key:

   - **Shell Type**: Choose **"/bin/bash"** (the default is fine).   - Open the file `%USERPROFILE%\.ssh\id_ed25519.pub` in Notepad and copy the contents.

5. Click **"Create User"**.   - DreamHost Panel -> Users -> Manage Users -> choose the SSH user -> there should be a field to add an "Authorized SSH Key" or a place to paste the public key. If you do not see that, DreamHost docs show how to add an SSH key for the user (search "DreamHost add SSH key" in the control panel help). Alternatively, you can paste the public key into `~/.ssh/authorized_keys` on the server after SSHing with a password once.

6. DreamHost will create the user. This takes about 5 minutes. Refresh the page until you see the new user in the list.

Find the values you will pass to the deploy script

### Step 1.3: Write Down Your SSH Username- RemoteUser: the SSH user you created in DreamHost. (Panel -> Users -> Manage Users)

- After the user is created, click on the username in the list.- RemoteHost: the server IP or hostname found under Panel -> Domains -> Manage Domains (the IP / server name shown for the domain)

- You'll see details like:- RemotePath: the DocumentRoot (example `/home/<dh-user>/example.com/public_html` or `/var/www/matp` if you control the vhost). Confirm in panel or by SSHing and listing the domain folder.

  - **Username**: (example: `myapp`) — **Write this down.**- KeyPath: by default our script uses `%USERPROFILE%\.ssh\id_rsa` — update it to the path you created (e.g. `%USERPROFILE%\.ssh\id_ed25519`).

  - **Server**: (example: `ps123456.dreamhostps.com` or an IP like `192.168.1.1`) — **Write this down.**

Exact deploy commands (step-by-step)

---1) On your local machine, from the repo root, switch to the branch we prepared (MATP):



## PART 2: Find Your Domain's Folder Path```powershell

Set-Location -Path .\staff-scheduler

### What is a DocumentRoot?git checkout MATP

Your website's files live in a specific folder on the server. When someone visits `yourdomain.com`, the server looks in that folder for the files to show.```



### Step 2.1: Find the Path in DreamHost Panel2) Install dependencies and build the production bundle (this may take a couple minutes):

1. In DreamHost panel, click **"Domains"** in the left sidebar (or search "Domains").

2. Click **"Manage Domains"**.```powershell

3. Find the row for your domain (example: `yourdomain.com`).npm install

4. Look for a column called **"Web Directory"** or click the domain row to expand details.npm run build

5. You'll see a path like:```

   - `/home/myapp/yourdomain.com` or

   - `/home/myapp/yourdomain.com/public_html`After `npm run build` you should have a `build` folder inside `staff-scheduler`.

   

   **Write down this full path** — this is where we'll upload the app files.3) Run the included PowerShell deploy helper (replace placeholders):



**Note**: The path usually starts with `/home/<your-ssh-username>/`. If you see `public_html` at the end, that's fine — use the full path as shown.```powershell

.\deploy\deploy.ps1 -RemoteUser your_dh_user -RemoteHost your.server.ip.or.hostname -RemotePath /home/your_dh_user/example.com/public_html -KeyPath $env:USERPROFILE\.ssh\id_ed25519

---```



## PART 3: Set Up SSH Keys on Your Windows ComputerWhat the script does (so you understand each step):

- Runs the build command (the script calls the build you specified).

### What are SSH Keys?- Zips the `build/` directory to `build.zip` locally.

Instead of typing a password every time you connect to the server, SSH keys let your computer and the server recognize each other automatically. You'll create two files: a **private key** (stays on your computer, never share) and a **public key** (you give to DreamHost).- Uses `scp` to copy the zip to `/tmp/` on the remote server.

- Uses `ssh` to run remote commands: create the remote directory, remove old files, unzip `build.zip` into the remote path, set ownership to `www-data:www-data` and remove the zip from `/tmp/`.

### Step 3.1: Check if OpenSSH is Installed (Windows 10/11)

1. Press `Windows Key + X` and click **"Windows PowerShell"** or **"Terminal"**.Notes about permissions and the web user on DreamHost

2. Type this command and press Enter:- DreamHost web processes may run under `apache`, `www-data`, or a user-specific group depending on your plan. If the script's `chown -R www-data:www-data` is incorrect for your server, you will get permission errors when serving files. To confirm the correct owner:

   ```powershell   - SSH into your server: `ssh -i C:\Users\you\.ssh\id_ed25519 your_dh_user@your.server.ip`

   ssh -V   - On the server, check existing site folder ownership: `ls -ld /home/your_dh_user/example.com/public_html` — you will see owner:group. Use those values in the deploy script or change the chown command.

   ```

3. If you see a version number (like `OpenSSH_8.x`), you're good! If you see "command not found", follow these steps:If you do not have root/sudo on your DreamHost plan

   - Go to **Settings** > **Apps** > **Optional Features** > **Add a feature**.- If you can't run `sudo chown` on the VPS (for example shared hosting), do not use the chown step. Instead upload files owned by your user and ensure the webserver can read them (uploading via SFTP or the panel typically creates appropriate ownership). The included `.htaccess` will handle the SPA routing.

   - Search for "OpenSSH Client" and install it.

   - Restart PowerShell and try `ssh -V` again.Confirming the site works

- After deploy, open `http(s)://yourdomain.example`.

### Step 3.2: Create an SSH Key Pair- If routes 404 on refresh, ensure `.htaccess` is present in the DocumentRoot and mod_rewrite is enabled (DreamHost enables it by default). For VPS you may need to ensure `AllowOverride All` is set in your vhost (the `matp-vhost.conf` includes this).

1. In PowerShell, run this command (press Enter after typing):

   ```powershellEnabling HTTPS (DreamHost panel method — easiest)

   ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed255191) DreamHost Panel -> Secure -> Certificates (or search for "Let's Encrypt").

   ```2) Find your domain and click to enable Let’s Encrypt / Auto Renew. DreamHost will provision and install the cert for you (it may take a minute).

2. You'll be asked:

   - **"Enter file in which to save the key"** — Just press Enter (uses the default).Alternative: Run Certbot on the VPS (if you have sudo/root). Example (Ubuntu) after vhost is installed and DNS points to server:

   - **"Enter passphrase"** — You can press Enter to skip (no passphrase), or type a password for extra security. If you set a passphrase, you'll need to type it each time you use the key.

3. You'll see a message like "Your public key has been saved in C:\Users\YourName\.ssh\id_ed25519.pub".```bash

sudo apt update

### Step 3.3: Copy Your Public Key to DreamHostsudo apt install certbot python3-certbot-apache

1. Open the public key file in Notepad:sudo certbot --apache -d example.com -d www.example.com

   - Press `Windows Key + R`, type `notepad %USERPROFILE%\.ssh\id_ed25519.pub`, and press Enter.```

2. You'll see one long line of random text starting with `ssh-ed25519`. **Select all and copy it** (Ctrl+A, Ctrl+C).

3. Go back to DreamHost panel -> **Users** -> **Manage Users**.Shared hosting notes (if you are on DreamHost shared)

4. Click on your SSH user (the one you created in Part 1).- You likely won't be able to place a vhost file into `/etc/apache2/sites-available/` — DreamHost manages that for you.

5. Scroll down to a section called **"Public Key"** or **"Authorized Keys"**.- Use the `deploy/.htaccess` file: upload it to the domain root (e.g., `/home/your_dh_user/example.com/public_html/.htaccess`). The SPA fallback and caching rules are contained there.

6. Paste your public key into the text box and click **"Save Changes"** or **"Update"**.- Use SFTP to upload files: DreamHost Panel -> Domains -> Manage Domains -> click the domain row -> SSH/SFTP info is displayed (hostname and path). Or use DreamHost documentation: https://help.dreamhost.com/hc/en-us/articles/215769547-How-to-connect-to-your-site-using-SSH-or-SFTP



**Wait 5-10 minutes** for DreamHost to process this change.Verification & troubleshooting tips

- If `scp` fails: confirm `RemoteHost` is the IP shown in DreamHost panel and that the SSH user has access.

---- If the web browser shows the previous version: clear CDN or browser cache, or ensure the server served the new files (check `index.html` timestamp on the server: `ssh && ls -l /home/.../public_html/index.html`).

- If you see permission denied on the web server: verify file ownership and permissions on the server (`ls -la`) and adjust as needed.

## PART 4: Build the React App on Your Computer

Optional next steps I can add for you

### Step 4.1: Open PowerShell in the Project Folder- Add a GitHub Actions workflow that builds on pushes to `MATP` and deploys automatically via SSH (requires adding a deploy SSH key as a GH secret).

1. Open File Explorer and navigate to your project folder:- Change the `deploy.ps1` to use SFTP (WinSCP) or `rsync` for incremental deploys.

   - Example: `C:\Users\YourName\OneDrive\Documents\Coding\SchedulingMadison\staff-scheduler`

2. In the address bar at the top, click once, type `powershell`, and press Enter. A PowerShell window will open in that folder.If you'd like, tell me whether your DreamHost account is a VPS (you created a server and can sudo) or a shared plan — I will then:

- Customize `deploy.ps1` removing `chown` for shared hosting and defaulting the `RemotePath` to the DreamHost domain path format;

### Step 4.2: Install Dependencies- Or generate a GitHub Actions workflow that deploys automatically to your VPS using a secret SSH key you upload to the repo.

1. In PowerShell, type:

   ```powershell
   npm install
   ```
   Press Enter. This downloads all the code libraries the app needs. **This may take a few minutes.** You'll see a progress bar.

### Step 4.3: Build the Production Version
1. After `npm install` finishes, type:
   ```powershell
   npm run build
   ```
   Press Enter. This creates a `build` folder with all the files ready to upload. **This may take 1-2 minutes.**
2. When it finishes, you'll see a message like "Build complete" and a new `build` folder will appear in your project folder.

---

## PART 5: Upload the App to DreamHost

### Step 5.1: Gather Your Information
You need four pieces of information (you wrote these down earlier):
1. **RemoteUser**: Your SSH username (example: `myapp`)
2. **RemoteHost**: Your server address (example: `ps123456.dreamhostps.com` or `192.168.1.1`)
3. **RemotePath**: Your domain's folder path (example: `/home/myapp/yourdomain.com` or `/home/myapp/yourdomain.com/public_html`)
4. **KeyPath**: The path to your SSH private key (default: `$env:USERPROFILE\.ssh\id_ed25519`)

### Step 5.2: Run the Deploy Script
1. In PowerShell (still in the `staff-scheduler` folder), type this command **but replace the placeholders** with your actual values:

```powershell
.\deploy\deploy.ps1 -RemoteUser myapp -RemoteHost ps123456.dreamhostps.com -RemotePath /home/myapp/yourdomain.com -KeyPath $env:USERPROFILE\.ssh\id_ed25519
```

**Example with real values**:
```powershell
.\deploy\deploy.ps1 -RemoteUser myapp -RemoteHost ps123456.dreamhostps.com -RemotePath /home/myapp/example.com -KeyPath $env:USERPROFILE\.ssh\id_ed25519
```

2. Press Enter. The script will:
   - Zip your `build` folder.
   - Upload it to your DreamHost server.
   - Unzip it in the correct folder.
   - Set file permissions so the web server can read the files.

3. You'll see output messages as it runs. If it asks "Are you sure you want to continue connecting? (yes/no)", type `yes` and press Enter.

4. **If you see an error about `chown` or permissions**: This is okay! It means the script tried to change file ownership but you might not need that step. The files should still work. If the website doesn't load, we can fix permissions later.

---

## PART 6: Copy the `.htaccess` File

The `.htaccess` file tells Apache (the web server) how to handle your React app's routing. Without it, refreshing the page on routes like `/employees` will show a 404 error.

### Step 6.1: Upload `.htaccess` to Your Domain Folder
You have two options:

**Option A: Use the deploy script (if it didn't copy it automatically)**
1. After running the deploy script, SSH into your server to check if `.htaccess` is there:
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\id_ed25519 myapp@ps123456.dreamhostps.com
   ```
   (Replace `myapp` and `ps123456.dreamhostps.com` with your values.)

2. Once connected, type:
   ```bash
   ls -la /home/myapp/yourdomain.com
   ```
   (Replace with your actual path.) Look for `.htaccess` in the list. If it's there, you're done!

3. If it's NOT there, copy it manually:
   - Exit SSH by typing `exit` and pressing Enter.
   - In PowerShell, run:
     ```powershell
     scp -i $env:USERPROFILE\.ssh\id_ed25519 .\deploy\.htaccess myapp@ps123456.dreamhostps.com:/home/myapp/yourdomain.com/.htaccess
     ```

**Option B: Use DreamHost File Manager (Easier)**
1. In DreamHost panel, search for **"Manage Files"** or go to **"Files"** in the sidebar.
2. Click **"Manage Files"** or **"WebFTP"**.
3. Navigate to your domain folder (example: `/home/myapp/yourdomain.com`).
4. Click **"Upload"** and select the `.htaccess` file from your computer:
   - It's in `C:\Users\YourName\...\staff-scheduler\deploy\.htaccess`
5. Make sure it uploads to the root of your domain folder (the same folder as `index.html`).

---

## PART 7: Enable HTTPS (Secure Padlock)

### Step 7.1: Enable Let's Encrypt in DreamHost Panel
1. In DreamHost panel, click **"Secure"** in the left sidebar (or search "Secure").
2. Click **"Add Let's Encrypt Certificate"** or find your domain in the list.
3. Click the toggle or button to enable **"Let's Encrypt"** for your domain.
4. DreamHost will automatically create and install a free SSL certificate. **This takes 5-15 minutes.**
5. Once it says "Active", your site will be available at `https://yourdomain.com`.

---

## PART 8: Test Your Website

1. Open a web browser and go to `https://yourdomain.com` (replace with your actual domain).
2. You should see your React app!
3. Click around and navigate to different pages (like `/employees` or `/schedule`).
4. **Important Test**: On a page OTHER than the homepage, press `F5` to refresh. If you see a 404 error, the `.htaccess` file is missing or not in the right place. Go back to Part 6.

---

## Troubleshooting

### Problem: "Permission denied" when running deploy script
- **Solution**: Your SSH key might not be set up correctly in DreamHost. Go back to Part 3, Step 3.3 and make sure you pasted the **public** key (the file ending in `.pub`) into DreamHost, not the private key.

### Problem: Website shows a blank page or old version
- **Solution**: 
  1. Clear your browser cache (Ctrl+Shift+Delete, select "Cached images and files", click Clear).
  2. Make sure the `build` folder uploaded correctly. SSH to your server and check:
     ```bash
     ls -la /home/myapp/yourdomain.com
     ```
     You should see files like `index.html`, `asset-manifest.json`, a `static` folder, etc.

### Problem: Refreshing the page shows 404 errors
- **Solution**: The `.htaccess` file is missing. Go back to Part 6 and upload it to the domain root folder.

### Problem: Deploy script says "command not found: scp"
- **Solution**: OpenSSH is not installed. Go back to Part 3, Step 3.1 and install OpenSSH Client.

### Problem: "sudo: command not found" or permission errors during deploy
- **Solution**: DreamHost VPS users don't always have `sudo`. The deploy script tries to change file ownership with `sudo chown`, but this might fail. If the website loads fine, you can ignore this error. If it doesn't, we can modify the script to skip that step.

---

## What to Do Next

- **Customize the app**: Edit files in `src/` folder, run `npm run build`, and run the deploy script again.
- **Automate deploys with GitHub Actions**: I can help you set up automatic deployment whenever you push code to GitHub.
- **Set up a custom domain**: If you want to use a different domain, update the DreamHost panel under "Domains" and re-run the deploy script with the new RemotePath.

---

## Need More Help?

If you get stuck, write down:
1. The exact error message you see.
2. The step you're on (example: "Part 5, Step 5.2").
3. What you tried.

I can help you troubleshoot!
