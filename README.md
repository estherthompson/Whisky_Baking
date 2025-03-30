# Whisky Baking Project

## Overview
This project consists of a **backend** (Node.js with Express and Supabase) and a **frontend** (React.js) for managing student data. Follow the instructions below to set up and run the project locally.

---

## Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- **Git**

---

## Setup Instructions

### 1️⃣ Clone the Repository
```sh
git clone <repository-url>
cd whisky_baking
```

### 2️⃣ Setup Backend
```sh
cd backend
npm install
```

#### Environment Variables
The `.env` file is already included, so no setup is required.
However, if needed, ensure the `.env` file in `backend/` contains:
```sh
SUPABASE_URL=https://cneqjtwaymrarhpaxvht.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=5001  # Or any preferred port
```

#### Start the Backend Server
```sh
npm start
```
Your backend should now be running on `http://localhost:5001`

---

### 3️⃣ Setup Frontend
```sh
cd ../frontend
npm install
```

#### Start the Frontend
```sh
npm start
```
The React app should now be running on `http://localhost:3000`

---

## API Endpoints
The backend exposes the following API endpoint:
- `GET /api/students` → Fetch all students from the Supabase database

---

## Troubleshooting
- **Port Already in Use**: If you get an `EADDRINUSE` error, kill the process using that port:
  ```sh
  lsof -i :5001  # Find the process ID
  kill -9 <PID>  # Replace <PID> with the actual process ID
  ```
- **CORS Issues**: If frontend requests to the backend are blocked, ensure `cors` middleware is configured in `backend/index.js`:
  ```js
  import cors from 'cors';
  app.use(cors());
  ```

---

## Contributors
- Esther Thompson (@estherthompson)
- [Add other group members here]

Happy coding! 🎉

