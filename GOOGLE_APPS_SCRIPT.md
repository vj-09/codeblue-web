# Google Apps Script Setup for Feedback Form

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Analytics RL Feedback"
4. Add headers in Row 1:
   - A1: `Timestamp`
   - B1: `Name`
   - C1: `Email`
   - D1: `Type`
   - E1: `Message`
   - F1: `Source`

## Step 2: Create the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Paste this code:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse the incoming data
    var data = JSON.parse(e.postData.contents);

    // Append a new row with the feedback data
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.type || 'feedback',
      data.message || '',
      data.source || 'unknown'
    ]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Feedback endpoint is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Step 3: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - Description: "Feedback Form Handler"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Authorize** the app when prompted (click through the warnings)
6. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

## Step 4: Add URL to Vercel Environment

1. Go to your Vercel project settings
2. Go to **Environment Variables**
3. Add:
   - Name: `NEXT_PUBLIC_FEEDBACK_URL`
   - Value: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
4. Redeploy the site

Or add to `.env.local` for local testing:
```
NEXT_PUBLIC_FEEDBACK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Testing

1. Open your Google Sheet
2. Submit a test feedback from the website
3. Check the sheet - new row should appear!

## Notes

- The script runs under your Google account
- Data is stored in your Google Drive
- Free unlimited submissions
- You can set up email notifications in Apps Script if needed
