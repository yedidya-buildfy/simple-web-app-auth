# InvoiceMatch - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Environment Variables

Create a `.env` file in this directory (`invoices3/`):

```bash
# Required - Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional - For AI Invoice Parsing
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Supabase Keys:**
1. Go to your Supabase project at https://supabase.com
2. Settings → API → Copy "Project URL" and "anon public" key

**Get Gemini API Key (Optional):**
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into .env

### Step 2: Install Dependencies

```bash
npm install
```

All dependencies are already listed in package.json and will be installed automatically.

### Step 3: Start Development Server

```bash
npm run dev
```

The app will start at http://localhost:5173

### Step 4: Create Your Account

1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Enter your email, password, and name
4. Check your email for verification link
5. Log in

### Step 5: Start Using InvoiceMatch

**Upload Files:**
1. Go to "Upload" page
2. Drag and drop or click to select files:
   - Bank statements (Excel/CSV)
   - Credit card statements (Excel/CSV)
   - Invoices (PDF/images)
3. Click "Process" to extract data

**View Transactions:**
1. Go to "Transactions" page
2. See all extracted transactions
3. Use filters to find specific transactions
4. Edit, split, or link invoices

**Match Invoices:**
1. Go to "Matching" page (or click match button in transactions)
2. Use auto-match for bulk matching
3. Manually match unmatched transactions

**View Reports:**
1. Go to "Reports" page
2. Select date range
3. View charts and analytics
4. Export to CSV/Excel/PDF

**Configure Settings:**
1. Go to "Settings" page
2. Add businesses
3. Create categories
4. Set up vendor aliases
5. Define matching rules

---

## 📁 Project Structure

```
invoices3/
├── src/
│   ├── pages/          # Main pages
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Matching.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   ├── FileUpload.tsx
│   │   └── Auth.tsx
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and libraries
│   │   ├── parsers/    # Bank, credit, invoice parsers
│   │   ├── ai/         # Gemini AI integration
│   │   ├── matching/   # Matching engine
│   │   └── storage.ts  # Supabase Storage helpers
│   └── types/          # TypeScript types
├── .env                # Environment variables (create this!)
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

---

## 🎯 Key Features

### ✅ Completed Features
- User authentication and protected routes
- File upload with drag-and-drop
- Bank statement parsing (5 Israeli banks)
- Credit card parsing (7 providers)
- AI invoice extraction (Gemini)
- Advanced transaction filtering
- Transaction editing and splitting
- Intelligent matching (auto + manual)
- Reports and analytics with charts
- CSV/Excel/PDF export
- Complete settings management

### 🎨 Theme
- Dark mode (black background)
- Green accent color (#10b981)
- Hero Icons (outline style)
- Responsive design

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📊 Supported File Formats

**Bank Statements:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- Supported banks: Leumi, Hapoalim, Discount, Mizrahi, Yahav, Generic

**Credit Cards:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- Supported: Isracard, Cal, Leumi Card, Max, Diners, Amex, Generic

**Invoices:**
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)
- Languages: Hebrew, English

---

## 🔑 API Keys & Limits

**Supabase (Free Tier):**
- 500MB database
- 1GB file storage
- 50K monthly active users
- Row Level Security enabled

**Google Gemini (Free Tier):**
- 60 requests per minute
- 1,500 requests per day
- ~$0.01-0.02 per invoice (paid tier)

---

## 🐛 Troubleshooting

**Issue: "Supabase URL is required"**
- Solution: Add VITE_SUPABASE_URL to .env file

**Issue: "Failed to process invoice"**
- Solution: Add VITE_GEMINI_API_KEY to .env file
- Or process manually in review modal

**Issue: "Transaction table empty"**
- Solution: Upload and process a bank/credit file first

**Issue: TypeScript errors**
- Solution: Run `npm run build` to check for real errors
- Dev mode may show false positives

---

## 📚 Additional Documentation

- **Full Report**: `/Users/yedidya/Desktop/invoices-2/md-files/FINAL-COMPLETION-REPORT.md`
- **Progress Docs**: `/Users/yedidya/Desktop/invoices-2/md-files/*-PROGRESS.md`
- **Architecture**: `/Users/yedidya/Desktop/invoices-2/md-files/ORCHESTRATION-PLAN.md`

---

## 🎉 You're Ready!

The app is fully functional and production-ready. Start by:
1. Uploading a bank statement
2. Processing it to extract transactions
3. Uploading matching invoices
4. Running auto-match or manual matching
5. Viewing reports and analytics

**Enjoy using InvoiceMatch!** 🚀
