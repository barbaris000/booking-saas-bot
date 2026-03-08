# SaaS Appointment Booking System 📅

A scalable, Telegram-based SaaS booking system designed for local service businesses (barbershops, beauty salons, tattoo studios). This project provides a seamless appointment booking experience for clients via Telegram Bot and a robust backend for business owners.

## 🚀 Features (MVP)
- **Telegram Bot Integration:** Interactive, stateless booking flow using inline keyboards.
- **Multi-tenant Architecture:** Designed to support multiple businesses/salons within a single database.
- **Dynamic Data:** Masters and services are fetched dynamically from the database.
- **Stateless Flow:** Booking steps (Master -> Service -> Date -> Time) are managed via encoded callback data, ensuring reliability even after server restarts.

## 🛠 Tech Stack
- **Runtime:** Node.js (v22+)
- **Language:** TypeScript (Strict mode)
- **Frameworks:** Express.js (API/Admin), grammY (Telegram Bot)
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma (v7+) with `@prisma/adapter-pg` and native `pg` pool.
- **Architecture:** Layered/Clean Architecture (Bot -> Repositories -> DB).

## 📂 Project Structure
\`\`\`text
src/
├── bot/            # Telegram bot logic, scenes, and handlers
├── config/         # Environment variables and DB connection configuration
├── generated/      # Locally generated Prisma Client (avoids TS caching issues)
├── repositories/   # Database access layer (Data encapsulation)
├── utils/          # Helper functions (Date formatting, time slot calculation)
└── index.ts        # App entry point (Express & Bot initialization)
\`\`\`

## ⚙️ Local Setup & Installation

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/your-username/saas-booking.git
cd saas-booking
\`\`\`

**2. Install dependencies**
\`\`\`bash
npm install
\`\`\`

**3. Environment Variables**
Create a \`.env\` file in the root directory:
\`\`\`env
DATABASE_URL="postgresql://admin:rootpassword@localhost:5432/saas_booking?schema=public"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
PORT=3000
\`\`\`

**4. Start PostgreSQL via Docker**
\`\`\`bash
docker-compose up -d
\`\`\`

**5. Run Database Migrations & Generate Prisma Client**
\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

**6. Start the Development Server**
\`\`\`bash
npm run dev
\`\`\`
*The server will start on port 3000 and the Telegram bot will begin polling.*

## 📜 Scripts
- \`npm run dev\` - Starts the development server using \`tsx\` with watch mode.
- \`npm run build\` - Compiles TypeScript to JavaScript into the \`/dist\` directory.
- \`npm run start\` - Runs the compiled production build.