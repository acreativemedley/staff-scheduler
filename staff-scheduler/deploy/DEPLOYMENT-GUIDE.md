# How to Deploy Your Staff Scheduler to scheduler.makealltheprojects.com

**Written for Complete Beginners** — Every step explained in plain English!

---

## What This Guide Will Help You Do

By the end, your Staff Scheduler app will be live on the internet at **scheduler.makealltheprojects.com** with a secure HTTPS connection (padlock icon 🔒).

**Why a subdomain?** You already have WordPress running at www.makealltheprojects.com. Using a subdomain keeps them completely separate with no conflicts!

**Time estimate**: 30-45 minutes if this is your first time

---

## Before You Start - What You Need

✅ **You already have**:
- A DreamHost VPS account
- The domain www.makealltheprojects.com set up in DreamHost (with WordPress running)
- This staff-scheduler project on your Windows computer

✅ **You'll create during this guide**:
- A subdomain: scheduler.makealltheprojects.com (keeps WordPress and React app separate)
- An SSH user (this is like a "login" for your server)
- SSH keys (so you don't need to type passwords)
- The actual live website!

---

## What These Files Do

In this `deploy` folder, you'll find:

- **`deploy.ps1`** — A PowerShell script that automates uploading your app
- **`.htaccess`** — A configuration file that makes your React app work correctly on the server
- **`apache/matp-vhost.conf`** — An example Apache config (you probably won't need this)

---

# PART 1: Create the Subdomain

## Why are we doing this?
Your WordPress site is already at www.makealltheprojects.com. We need a separate place for the Staff Scheduler app. A subdomain is like a separate mini-website that won't interfere with WordPress.

## Step 1.1: Open DreamHost Panel

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)
2. **Type this in the address bar**: `https://panel.dreamhost.com`
3. **Press Enter**
4. **Log in** with your DreamHost email and password

## Step 1.2: Add the Subdomain

1. **In DreamHost panel**, click **"Domains"** in the left sidebar
2. **Click "Manage Domains"**
3. **Click the button** that says **"Add New Domain"** or **"Add Domain"**
4. **Choose "Add Subdomain"** or just type in the subdomain field:
   ```
   scheduler.makealltheprojects.com
   ```
5. **For "Web Directory"**, it should auto-fill something like:
   ```
   /home/yourusername/scheduler.makealltheprojects.com

   /home/dh_quhiu7/scheduler.makealltheprojects.com
   ```
   - **Write down this exact path** — you'll need it later!
   - If it doesn't auto-fill, type that path manually
6. **Make sure** "HTTPS" or "Secure Hosting" is enabled (there should be a checkbox or toggle)
7. **Click "Add Domain"** or "Save"
8. **Wait 5-10 minutes** for DreamHost to set up the subdomain

> 📝 **Important**: Write down the web directory path! Example: `/home/scheduler/scheduler.makealltheprojects.com`

---

# PART 2: Create an SSH User in DreamHost

## What is SSH?
**SSH** stands for "Secure Shell". Think of it as a secure phone line between your computer and your web server. You'll use it to upload files and run commands on your server.

## Step 2.1: Go to Users Section (if not already there)

1. **In DreamHost panel**, click **"Users"** in the left sidebar
   - If you don't see it, use the search box at the top and type "Users"
2. **Click "Manage Users"**

You should now see a list of users (it might be empty if you haven't created any yet).

## Step 2.2: Create a New SSH User

1. **Click the button** that says **"Add a New User"** or **"Create User"**

2. **Fill out the form** (I'll explain each field):

   **Username**: 
   - Type a username (examples: `scheduler`, `matp`, or your first name)
   - **IMPORTANT**: Write this down! You'll need it later.
   - Let's say you choose: `scheduler`
   dh_quhiu7
   
   **Nickname**: 
   - Optional — this is just for you to remember what this user is for
   - You can type: "Staff Scheduler App"
   
   **Server**: 
   - Click the dropdown menu
   - Select your VPS server (it will look like "ps123456" or similar)
   - There should only be one option if you have one VPS
   
   **User Type**: 
   - **THIS IS CRITICAL!** Choose **"Shell User"**
   - Do NOT choose "SFTP Only" or "FTP Only" — those won't work
   
   **Shell Type**: 
   - Choose **"/bin/bash"**
   - This is the default and it's what we need

8. **Click the "Create User" button** at the bottom

## Step 2.3: Wait for User Creation

- **A message will appear** saying the user is being created
- **This takes 5-10 minutes** — DreamHost needs to set things up on the server
- **Refresh the page** after a few minutes until you see your new user in the list

## Step 2.4: Write Down Your Server Information

1. **Click on your new username** in the users list
2. You'll see details about this user
3. **Write down these two things** (you'll need them later):

   - **Username**: (example: `scheduler`)
   - **Server**: (example: `ps123456.dreamhostps.com` or an IP address like `12.34.56.78`)

---

# PART 3: Set Up SSH Keys on Your Computer

> 💡 **Note**: You already found your web directory path when you created the subdomain in Part 1! It should be something like `/home/yourusername/scheduler.makealltheprojects.com`

## What are SSH Keys?
Instead of typing a password every time you want to upload files, SSH keys are like a special secret handshake between your computer and the server. You create two files:
- **Private key** — stays on YOUR computer (never share this!)
- **Public key** — you give this to DreamHost (safe to share)

## Step 3.1: Check if OpenSSH is Installed

1. **On your keyboard**, press the **Windows key + X** together
2. **Click** on **"Windows PowerShell"** or **"Terminal"**
   - A black or blue window will open with text in it
3. **Type this** and press Enter:
   ```powershell
   ssh -V
   ```
4. **Look at what happens**:
   - ✅ **If you see** something like `OpenSSH_8.x` or `OpenSSH_9.x`: Great! Skip to Step 3.2
   - ❌ **If you see** "command not found" or an error: Continue below

### If OpenSSH is NOT installed:
1. **Press the Windows key** on your keyboard
2. **Type** "Settings" and press Enter
3. **Click** "Apps"
4. **Click** "Optional Features" (or "Apps & Features" then "Optional Features")
5. **Click** "Add a feature"
6. **Type** "OpenSSH" in the search box
7. **Click** on **"OpenSSH Client"**
8. **Click** "Install"
9. **Wait** for it to install (1-2 minutes)
10. **Close PowerShell** and **open it again**
11. **Try** `ssh -V` again — you should see a version number now

## Step 3.2: Create Your SSH Key

1. **In PowerShell**, type this command exactly and press Enter:
   ```powershell
   ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519
   ```

2. **It will ask you questions** — here's how to answer:

   **Question 1**: `Enter file in which to save the key`
   - Just press **Enter** (don't type anything)
   - This uses the default location
   
   **Question 2**: `Enter passphrase (empty for no passphrase)`
   - You have two choices:
     - Press **Enter** for no password (easier, less secure)
     - OR type a password (you'll need to remember it and type it each time you deploy)
   - **I recommend**: Just press **Enter** for now (no passphrase)
   
   **Question 3**: `Enter same passphrase again`
   - Press **Enter** again

3. **You'll see a message** like:
   ```
   Your public key has been saved in C:\Users\YourName\.ssh\id_ed25519.pub
   ```
   This means it worked! ✅

## Step 3.3: Copy Your Public Key

1. **Press Windows key + R** on your keyboard
2. **Type this** and press Enter:
   ```
   notepad %USERPROFILE%\.ssh\id_ed25519.pub
   ```
3. **Notepad will open** with a bunch of random-looking text
4. The text starts with `ssh-ed25519` and is all on one line
5. **Press Ctrl+A** (select all)
6. **Press Ctrl+C** (copy)
7. **Keep Notepad open** for now (or minimize it)

## Step 3.4: Give Your Public Key to DreamHost

1. **Go back to DreamHost panel** in your browser
2. **Click "Users"** in the sidebar
3. **Click "Manage Users"**
4. **Click on your SSH user** (the one you created in Part 1)
5. **Scroll down** until you see a section called **"Public Key"** or **"Authorized Keys"** or **"SSH Keys"**
6. **Click in the text box**
7. **Press Ctrl+V** to paste your public key
8. **Click "Save Changes"** or **"Update"** button
9. **Wait 5-10 minutes** for DreamHost to process this change
ssh dh_quhiu7@vps30327.dreamhostps.com
---

# PART 4: Build Your React App

## What does "building" mean?
Your React app is written in modern JavaScript that browsers can't understand directly. "Building" converts it into regular HTML, CSS, and JavaScript files that any browser can use.

## Step 4.1: Open PowerShell in Your Project Folder

1. **Open File Explorer** (the folder icon in your taskbar)
2. **Navigate to your project**:
   ```
   C:\Users\felti\OneDrive\Documents\Coding\SchedulingMadison\staff-scheduler
   ```
3. **Click once** in the address bar at the top (where the path shows)
4. **Type**: `powershell`
5. **Press Enter**
6. **A PowerShell window will open** in that exact folder

## Step 4.2: Install Dependencies

**What are dependencies?** These are code libraries that your app needs to work.

1. **In PowerShell**, type:
   ```powershell
   npm install
   ```
2. **Press Enter**
3. **Wait** — this takes 2-5 minutes
4. You'll see lots of text scrolling by — this is normal!
5. **When it stops** and you see the prompt again (the `>` symbol), it's done

## Step 4.3: Build the Website Files

1. **Type this** in PowerShell:
   ```powershell
   npm run build
   ```
2. **Press Enter**
3. **Wait** — this takes 1-2 minutes
4. When it finishes, you'll see a message like **"✓ built in..."** or **"Build complete"**
5. **Look in your file explorer** — you should now see a **`dist`** folder in your project

> 📁 The `dist` folder contains your complete website, ready to upload!

---

# PART 5: Upload to DreamHost

## Step 5.1: Get Your Information Ready

You wrote these down earlier. Get them now:

1. **RemoteUser**: Your SSH username (example: `scheduler`)
2. **RemoteHost**: Your server address (example: `ps123456.dreamhostps.com`)
3. **RemotePath**: Your subdomain's web directory (example: `/home/scheduler/scheduler.makealltheprojects.com`)

## Step 5.2: Run the Deploy Script

1. **In PowerShell** (still in the staff-scheduler folder), you'll run the deploy script
2. **Type this command**, but **REPLACE** the example values with YOUR actual values:

```powershell
.\deploy\deploy.ps1 -RemoteUser dh_quhiu7 -RemoteHost vps30327.dreamhostps.com -RemotePath /home/dh_quhiu7/scheduler.makealltheprojects.com -KeyPath $env:USERPROFILE\.ssh\id_ed25519
```

**Here's what to replace**:
- Replace `scheduler` (first one) with YOUR SSH username
- Replace `ps123456.dreamhostps.com` with YOUR server address
- Replace `/home/scheduler/scheduler.makealltheprojects.com` with YOUR subdomain's web directory path (from Part 1)
- Keep `$env:USERPROFILE\.ssh\id_ed25519` exactly as shown

3. **Press Enter**

## Step 5.3: What Happens Next
cd
The script will:
1. Zip up your `dist` folder
2. Upload it to your DreamHost server
3. Unzip it in the right location
4. Set permissions so the web server can read the files

**You'll see text scrolling by** — this is normal!

## Step 5.4: Possible Questions/Errors

### If it asks: "Are you sure you want to continue connecting (yes/no)?"
- **Type**: `yes`
- **Press Enter**
- This only happens the first time

### If you see: "Permission denied"
- Your SSH key might not be set up right
- Go back to Part 3, Step 3.4 and make sure you pasted the PUBLIC key (the .pub file)

### If you see: An error about `chown` or `sudo`
- **This is okay!** The files still uploaded correctly
- The script tried to change file ownership but you might not have permission
- Continue to the next step

---

# PART 6: Upload the .htaccess File

## What is .htaccess?
This is a special configuration file that tells Apache (the web server) how to handle your React app. Without it, if someone refreshes a page (or bookmarks a page that's not the homepage), they'll get a 404 error.

## Step 6.1: Upload Using DreamHost File Manager (Easiest Way)

1. **In DreamHost panel**, search for **"Manage Files"** (use the search box)
2. **Click "Manage Files"** or **"WebFTP"**
3. **Navigate to your subdomain folder**:
   - Click through folders until you get to `/home/dh_quhiu7/scheduler.makealltheprojects.com` (your subdomain's web directory)
4. **Click the "Upload" button**
5. **Click "Choose File"** or **"Browse"**
6. **Navigate on your computer** to:
   ```
   C:\Users\felti\OneDrive\Documents\Coding\SchedulingMadison\staff-scheduler\deploy\.htaccess
   ```
7. **Select the `.htaccess` file**
8. **Click "Upload"**
9. **Make sure it's in the same folder** as your `index.html` file

> ⚠️ **Important**: The file is named `.htaccess` — it starts with a dot! Make sure you're uploading the right file.

---

# PART 7: Enable HTTPS (Secure Connection)

## What is HTTPS?
It's the secure version of HTTP — it encrypts the data between your website and visitors. You'll get the padlock icon 🔒 in the browser.

## Step 7.1: Enable Let's Encrypt for Your Subdomain

1. **In DreamHost panel**, click **"Secure"** in the left sidebar
   - Or search for "Secure" or "SSL"
2. **Look for your subdomain** `scheduler.makealltheprojects.com` in the list
3. **Find the Let's Encrypt option** for that subdomain
4. **Click the button or toggle** to enable **"Let's Encrypt"**
5. **Confirm** if it asks you to confirm
6. **Wait 10-15 minutes** for DreamHost to set it up
7. **Come back and check** — it should say "Active" or show a green checkmark

> 💡 **Note**: Your main domain (www.makealltheprojects.com) probably already has HTTPS enabled. We're adding it specifically for the scheduler subdomain.

---

# PART 8: Test Your Website!

## Step 8.1: Visit Your Subdomain

1. **Open a web browser**
2. **Type in the address bar**:
   ```
   https://scheduler.makealltheprojects.com
   ```
3. **Press Enter**

**What you should see**: Your Staff Scheduler app! 🎉

> 💡 **Note**: Your WordPress site at www.makealltheprojects.com is still there — untouched!

## Step 8.2: Test the Routes

1. **Click around** in your app
2. **Go to different pages** (like Employees, Schedule, etc.)
3. **On a page OTHER than the homepage**, press **F5** to refresh
4. **It should stay on that page** (not show a 404 error)

### If you get a 404 error when refreshing:
- The `.htaccess` file is missing or in the wrong place
- Go back to Part 6 and upload it again
- Make sure it's in the ROOT folder (same folder as index.html)

---

# Troubleshooting

## Problem: "Permission denied (publickey)"
**Cause**: SSH key not set up correctly
**Fix**: 
1. Make sure you copied the PUBLIC key (the .pub file) to DreamHost
2. Wait 10 minutes after adding the key to DreamHost
3. Try the deploy script again

## Problem: Website shows a blank white page
**Fix**:
1. Press `F12` in your browser to open Developer Tools
2. Click the "Console" tab
3. Look for error messages
4. Most likely: Clear your browser cache
   - Press `Ctrl+Shift+Delete`
   - Check "Cached images and files"
   - Click "Clear data"
   - Reload the page

## Problem: Website shows old version
**Fix**:
1. Clear browser cache (see above)
2. Try opening in an Incognito/Private window
3. The new version should show there

## Problem: "npm: command not found"
**Cause**: Node.js/npm is not installed
**Fix**:
1. Download Node.js from https://nodejs.org
2. Install it
3. Close and reopen PowerShell
4. Try again

---

# Making Updates in the Future

When you make changes to your app and want to update the live website:

1. **Make your changes** in the `src/` folder
2. **Open PowerShell** in the staff-scheduler folder
3. **Run**:
   ```powershell
   npm run build
   ```
4. **Run the deploy script** again (the same command from Part 5, Step 5.2)
5. **Wait a minute**, then **refresh your website**
6. Done! Your changes are live.

---

# Need Help?

If something doesn't work:

1. **Write down**:
   - The exact error message you see
   - Which Part and Step you're on
   - What you tried
   - What happened

2. **Check**:
   - Did you wait 5-10 minutes after creating the SSH user?
   - Did you wait 5-10 minutes after adding the SSH key?
   - Did you use YOUR actual values (not the examples)?

3. **Common mistakes**:
   - Using the PRIVATE key instead of the PUBLIC key (.pub)
   - Forgetting to wait for DreamHost to process changes
   - Being on the wrong branch in git (should be on MATP)
   - .htaccess file in the wrong folder

---

**You've got this!** Follow the steps one at a time, don't skip anything, and you'll have your app live on the internet soon. 🚀
