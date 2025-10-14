# Google Apps Script Setup Guide
## Staff Scheduling Application

### 📋 **Phase 1: Create Your Google Apps Script Project**

1. **Go to Google Apps Script**
   - Visit [script.google.com](https://script.google.com)
   - Click **"New project"**
   - Rename to **"Staff Scheduling App"**

2. **Create the Project Files**
   - Delete the default `Code.gs` content
   - Create these 4 script files (.gs) and 1 HTML file:

### **Script Files (.gs):**

#### **Code.gs** (Main Entry Point)
```javascript
// Copy content from: google-apps-script/Code.gs
```

#### **Auth.gs** (Authentication)
```javascript
// Copy content from: google-apps-script/Auth.gs
```

#### **Staff.gs** (Staff Management)
```javascript
// Copy content from: google-apps-script/Staff.gs
```

#### **Utils.gs** (Data Management)
```javascript
// Copy content from: google-apps-script/Utils.gs
```

### **HTML File:**

#### **Index.html** (Web Interface)
```html
<!-- Copy content from: google-apps-script/Index.html -->
```

### 🚀 **Phase 2: Initial Setup & Testing**

1. **Save Your Project**
   - Press `Ctrl+S` or click the save icon
   - Make sure all files are saved

2. **Run Initial Setup**
   - In the Apps Script editor, select the `setupApplication` function
   - Click the **Run** button (▶️)
   - **First time**: You'll need to authorize the script
     - Click **"Review permissions"**
     - Choose your Google account
     - Click **"Advanced"** → **"Go to Staff Scheduling App (unsafe)"**
     - Click **"Allow"**

3. **Check the Setup**
   - Look at the **Execution log** (View → Logs)
   - You should see "Application setup complete!"

### 📊 **Phase 3: Deploy as Web App**

1. **Deploy the Web Interface**
   - Click **Deploy** → **New deployment**
   - Choose type: **Web app**
   - Description: "Staff Scheduling v1.0"
   - Execute as: **Me**
   - Who has access: **Anyone with the link** (or restrict as needed)
   - Click **Deploy**

2. **Get Your Web App URL**
   - Copy the web app URL provided
   - Open it in a new tab to test

### 🧪 **Phase 4: Test Your Setup**

1. **Test the Web Interface**
   - Open your web app URL
   - You should see the Staff Scheduling dashboard
   - Click the "Test Setup" button
   - Check for success messages

2. **Verify Data Storage**
   - In Google Drive, you should see a new spreadsheet called "Staff Scheduling Data"
   - It should have sheets: Staff, Availability, TimeOffRequests, Schedules, Templates

### ✅ **What You've Accomplished**

- ✅ Created Google Apps Script project
- ✅ Set up basic authentication system
- ✅ Created data storage structure (Google Sheets)
- ✅ Built initial web interface
- ✅ Set up error logging
- ✅ Deployed as web application

### 🎯 **Next Steps**

Once your basic setup is working, we can move on to:
- **Task 2**: Configure Google Cloud project and APIs
- **Task 3**: Enhance the file structure
- **Task 4**: Implement advanced error handling

### 🔧 **Troubleshooting**

**Common Issues:**

1. **Authorization Problems**
   - Make sure you click "Allow" for all permissions
   - The script needs access to Sheets, Drive, and Gmail

2. **Web App Not Loading**
   - Check that deployment settings are correct
   - Try redeploying with a new version

3. **Data Not Saving**
   - Check execution logs for errors
   - Verify spreadsheet was created in your Drive

### 📞 **Need Help?**

If you run into issues:
1. Check the **Execution logs** in Apps Script
2. Look for error messages in the web interface
3. Make sure all permissions are granted
4. Try running `setupApplication()` again

---

**Ready to proceed?** Let me know when you've completed these steps and we'll move on to the next phase!