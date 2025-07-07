
# PymeGo - Business Management System for Small Enterprises

![PymeGo Banner](https://github.com/user-attachments/assets/7cd71df2-354c-4b17-a2cb-d5e42be47e6d)

**PymeGo** is a full-stack web application (SaaS) designed to empower small business owners by providing intuitive tools to manage finances, inventory, and performance analytics — all in one place.

**🌐 Live Demo:** [https://pymego.netlify.app/](https://pymego.netlify.app/)

---

## 🚀 Demo & Test Account

Explore the app without registering by using the following credentials:

- **Email:** `test@gmail.com`
- **Password:** `123456`

This test account is preloaded with sample data (products, sales, expenses) to demonstrate all features, including charts and analytics.

---

## ✨ Key Features

- **Analytics Dashboard:** Get a clear overview of your business with key metrics like revenue, expenses, net profit, and low stock alerts.
- **Financial Management:** Log income (sales) and expenses (operational or inventory) with customizable categories.
- **Interactive Charts:**
  - Sales trends (daily/monthly).
  - Expense analysis by category in pie charts.
  - Product performance and cash flow tracking.
- **Inventory Management:**
  - Full CRUD operations for products.
  - Automatic profit margin calculation.
  - Stock is automatically deducted after each recorded sale.
- **Secure Authentication:** User registration and login system using JWT (JSON Web Tokens).
- **File Uploads:** Users can upload their business logo, securely stored in the cloud (via Cloudinary).
- **Fully Responsive Design:** Smooth user experience on both mobile and desktop devices.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose, hosted on MongoDB Atlas)
- **Authentication:** JWT (jsonwebtoken)
- **File Handling:** Multer & Cloudinary
- **Validation:** express-validator & Zod (frontend)

### Frontend
- **Framework:** React with Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Routing:** React Router DOM
- **State Management:** Zustand
- **API Requests:** Axios

---

## 🏁 Getting Started (Local Installation)

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- pnpm (or npm/yarn)
- A MongoDB Atlas and Cloudinary account

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/PymeGo.git
cd PymeGo
```

### 2. Backend Setup
```bash
cd Backend
pnpm install

# Create a .env file inside the Backend folder and add the following variables:

# MONGODB_URI=your_mongodb_atlas_uri
# JWT_SECRET=a_very_long_secret_string
# CLOUDINARY_CLOUD_NAME=your_cloudinary_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret

# Start the backend server
pnpm run dev
```
Backend will run at `http://localhost:3000`.

### 3. Frontend Setup
```bash
# From the project root
cd front
pnpm install

# Create a .env file inside the front folder and add the following variable:

# VITE_API_BASE_URL=http://localhost:3000/api

# Start the frontend development server
pnpm run dev
```
Frontend will run at `http://localhost:5173`.

---

## 🚀 Deployment

- The **Backend** is deployed on **Render**.
- The **Frontend** is deployed on **Netlify**.

Deployment is managed automatically via GitHub integrations on both platforms.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
