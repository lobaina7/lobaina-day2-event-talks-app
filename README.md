# BigQuery Release Notes Hub 🚀

Welcome! This is a simple, easy-to-use visual dashboard designed to help you stay updated with the latest changes in **Google BigQuery** (Google's database service) and share those updates on Twitter/X without needing any technical skills.

---

## 🌟 What This App Does

1.  **Gathers Updates Automatically:** It fetches the official Google Cloud list of updates (release notes) and displays them in a clean, chronological timeline.
2.  **Color-Coded Cards:** Updates are organized by color so you can scan them quickly:
    *   🟢 **Features (Green):** New features and tools that have been added.
    *   🔴 **Issues (Red):** Known errors or temporary problems.
    *   🟣 **Announcements (Purple):** General news or warnings about upcoming changes.
3.  **One-Click Refresh:** Press the **Refresh** button at any time to pull the latest changes from Google.
4.  **Draft & Send Tweets:**
    *   Click on any update card in the feed.
    *   The app will automatically format a tweet draft in the composer panel.
    *   You can edit the text, watch the character counter, and click **X.com** to post it to your real account.
5.  **Tweet Simulator:** Click **Simulate** to see exactly how your draft will look in a simulated Twitter feed inside the app, where you can click "Like" or "Retweet" to test interactions.

---

## 🚀 How to Run the App (Step-by-Step)

To start the application, you only need to run a single command in your terminal. 

### Step 1: Open Terminal
Open your computer's **Terminal** app.

### Step 2: Go to the Project Folder
Type the following command in the terminal and press **Enter**:
```bash
cd /home/lobaina/Applications/agy-cli-projects/bg-releases-notes
```

### Step 3: Start the Server
Type the following command in the terminal and press **Enter**:
```bash
./run.sh
```
*Note: If this is the first time you are running it, the script will automatically set up the virtual Python folder and install everything for you.*

### Step 4: Open in Web Browser
Open your web browser (like Google Chrome, Safari, or Firefox) and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🛠️ Troubleshooting

*   **How do I stop the app?**
    Go back to the Terminal window and press **Ctrl + C** on your keyboard. This will close the application.
*   **The page won't load?**
    Make sure you ran the `./run.sh` command and that the terminal window remains open while you browse. Closing the terminal turns off the server.
