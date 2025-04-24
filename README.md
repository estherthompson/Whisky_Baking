**Whisk-Y Baking Application Setup Guide**

---

## Introduction
Welcome to the Whisk-Y Baking web application! This guide will walk you through how to set up and run the project locally on your computer. You have two options:
1. Clone the repository from GitHub
2. Use a compressed ZIP file version of the project

---

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js and npm](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A code editor like [VS Code](https://code.visualstudio.com/)

---

## Option 1: Clone the Repository

### Step 1: Clone the Repository
Open your terminal and run the following command:
```bash
git clone https://github.com/estherthompson/Whisky_Baking.git
```

### Step 2: Navigate to the Project Folder
```bash
cd Whisky_Baking
```

### Step 3: Switch to the Main Branch (if necessary)
```bash
git checkout main
```

### Step 4: Start the Backend
```bash
cd backend
npm install
npm start
```
Wait for the message:
```bash
Server running on port 5001
```

### Step 5: Start the Frontend
Open a new terminal window or tab, then run:
```bash
cd frontend
npm install
npm start
```

---

## Option 2: Run from a Compressed File

### Step 1: Extract the ZIP File
Unzip the `Whisky_Baking.zip` file you downloaded.

### Step 2: Open the Project in VS Code
Navigate to the unzipped folder and open it in VS Code.

### Step 3: Follow the Same Steps as in Option 1
Begin from Step 3: Switch to the Main Branch and continue with backend and frontend setup.

---

## Features of the Website
Once the frontend and backend are running, the website will automatically open in your browser. Here’s what you can do:

- Search for baking recipes by keyword or category
- Filter recipes based on ingredients in your pantry
- View recipe ratings and read reviews
- Write your own reviews after logging in
- Create a user account using the "User" icon on the top right
- Upload your own recipes using the "Upload Recipe" section

---

## Need Help?
If you run into any issues, feel free to open an issue on the GitHub repository or reach out to the project maintainer.

Happy Baking!


