# Car Rental System (AutoNest) – Final Year Project

This repository contains the source code for **AutoZone Car Rental**, a full‑stack web application designed as a final year project.  It consists of a responsive front‑end for customers and administrators, a Node/Express back‑end with a MySQL database, and an AI‑powered support chatbot.  Follow the instructions below to set up and run the project locally.

> **Note:**  These instructions assume you have basic familiarity with command‑line tools and web development.  If you encounter any issues, consult your instructor or teaching assistant for support.

##  Project structure

The zip archive extracts into a folder called `project/` with the following important subdirectories:

| Folder/Path | Description |
|-------------|-------------|
| `index.html` | Main entry point for the website.  Loads all page sections and includes the chatbot widget. |
| `css/`, `js/`, `sections/` | Front‑end assets (styles, scripts and HTML fragments) used by the customer‑facing website. |
| `admin/` and `user/` | HTML pages for administrators (dashboard, login) and customers (login/register/forgot password). |
| `server/` | Node/Express back‑end serving APIs, static files and handling bookings, payments and notifications. |
| `server/config/db.js` | Database connection file.  Update it with your MySQL credentials. |
| `server/migrations/` | SQL scripts for creating the required tables (admin, bookings, cars, users, etc.).  Run these on your MySQL server before starting the back‑end. |
| `server/utils/notifier.js` | Helper functions to send emails (SMTP) and SMS (Twilio) when a booking is confirmed. |
| `autozone-chatbot/` | A separate Node server powering the AI chatbot widget.  It communicates with the OpenRouter API. |
| `uploads/` | Folder where customer uploaded documents (e.g. CNIC images) will be stored at runtime. |

##  Prerequisites

Make sure the following software is installed on your system:

1. **Node.js and npm** – Download from [https://nodejs.org/](https://nodejs.org/) (LTS version recommended).  Both the front‑end and back‑end are written in JavaScript and use npm packages.
2. **MySQL** – You can use XAMPP, WAMP or a standalone MySQL server.  Create a database named `car_rental_system` and import the migrations (see below).
3. **Git (optional)** – Useful for version control, but not required if you are only extracting the zip.

Optional services:

* **Stripe account** – Needed if you want to test card payments.  You must set your `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the `.env` file (see below).
* **Twilio account** – Required for sending SMS notifications.  Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM`.
* **SMTP credentials** – To send booking confirmation emails you need SMTP server details (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).  Without these the application will still run, but emails/SMS will be skipped.
* **OpenRouter API key** – For the AI chatbot.  Sign up at [https://openrouter.ai/](https://openrouter.ai/) and obtain an `OPENROUTER_API_KEY`.

##  Setting up the MySQL database

1. Start your MySQL server (via XAMPP/WAMP or your preferred method).
2. **Create a new database:**

   ```sql
   CREATE DATABASE car_rental_system;
   
   

3. **Import the migration scripts** found in `project/server/migrations/`.  You can run them in any MySQL client (e.g. phpMyAdmin, MySQL Workbench or the MySQL CLI).  The scripts create the required tables:

   - `create_user_table.sql` – stores user accounts
   - `create_admin_table.sql` – stores admin accounts
   - `create_cars_table.sql` – stores car details
   - `create_booking_table.sql` – stores booking records
   - `create_payment_table.sql` – stores payment transactions
   - `create_contact_us_table.sql` – stores contact‑us submissions
   - `create_customer_table.sql` – stores customer profiles

4. (Optional) Insert sample data into the `cars` table if you want pre‑defined vehicles.  You can do this through your MySQL client or by writing your own `INSERT` statements.

5. Open `server/config/db.js` and edit the `mysql.createConnection(...)` parameters to match your local MySQL credentials (hostname, username and password).  For example, if you use XAMPP with the default root user and no password, leave `user: "root"` and `password: ""`.

## 🔧 Configuring environment variables

Both the back‑end and the chatbot rely on configuration values stored in `.env` files.  These files are **not included** in the repository for security reasons.  You must create them yourself:

### `project/server/.env`

Create a file named `.env` inside `project/server/` and define the following variables (remove options you don’t need):

```env
# Port for the Express server
PORT=5000

# Stripe configuration for payments
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SMTP configuration (email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM="AutoZone <noreply@example.com>"

# Optional: If you embed the AI chatbot in the main server instead of running the separate chatbot server
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-oss-120b:free

# Any additional variables you need (e.g. database credentials can also be defined here)

```

### `project/autozone-chatbot/.env`

If you prefer to run the chatbot server separately (useful when deploying micro‑services), create another `.env` file inside `autozone-chatbot/` with at least these values:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-oss-120b:free
PORT=3000

# If your back‑end and chatbot run on different domains or ports, configure CORS accordingly in autozone-chatbot/server/server.js.
```

##  Running the application

Once the database is set up and the `.env` files are configured, follow these steps to start the servers.

### 1. Install dependencies

Open a terminal/command prompt and navigate to the project directory:

```bash
cd server
npm install



> **Tip:**  You only need to run `npm install` once per folder.  The zip contains `node_modules`, but installing dependencies yourself ensures you have the correct versions for your environment.

### 2. Start the back‑end server

From the `project/server` directory, run:

```bash
npm start
# OR
node server.js
```

This will start the Express API at `http://localhost:5000/`.  When it starts you should see logs similar to:

```
Server running on http://localhost:5000
MySQL Connected Successfully
```

The server serves the static front‑end files (HTML, CSS, JS) and provides APIs under `/api` for bookings, payments, car listings, users and admin routes.

### 3. (Optional) Start the chatbot server

If you want to run the chatbot separately, open another terminal, navigate to `project/autozone-chatbot` and run:

```bash
npm start
# OR
node server.js
```

By default the chatbot server listens on port `3000`.  The front‑end widget (loaded in `index.html`) sends chat messages to `/api/chat`, which proxies to OpenRouter using your API key.

### 4. View the application

With the back‑end server running, open a web browser and visit:

```
http://localhost:5000/
```

You should see the AutoZone homepage with sections for Hero, About, Rent, Wedding, Out‑of‑City, Services, Different and Contact.  Click **Login** to access the admin or user portals.  The AI chatbot widget floats in the bottom‑right corner and can answer customer questions about cars, prices and booking procedures.

## Admin and user accounts

The system supports two types of authenticated users:

* **Admin** – can manage cars, view bookings, set prices, and approve or cancel reservations via the admin dashboard.  Admin credentials are stored in the `admin` table.  You can manually insert an admin record via SQL, for example:

   ```sql
   INSERT INTO admin (name, email, password) VALUES ('Admin', 'admin@example.com', 'hashed_password');
   ```

   The passwords should ideally be hashed.  For testing purposes you can insert them as plain text and update the `adminController` accordingly.

* **User/Customer** – can register, log in, submit bookings and manage their profile.  Users are stored in the `user` table.

Use the login pages in `project/admin/login.html` and `project/user/login.html` to access these interfaces.  The front‑end uses the API endpoints in `/api/user/…` and `/api/admin/…` for authentication and operations.

