# InvoiceMatch - Product Requirements Document

## Overview

InvoiceMatch is a web app that helps small business owners match their bank/credit card transactions to invoices. It uses AI to extract data from invoices and automatically match them to transactions.

## Problem

Business owners spend hours manually matching bank statements to invoices for bookkeeping and tax purposes. This is tedious, error-prone, and time-consuming.

## Solution

A simple tool that:
1. Imports transactions from bank/credit card exports (Excel/CSV)
2. Uploads and extracts data from invoices (PDF/images) using AI
3. Automatically matches transactions to invoices
4. Tracks which transactions have invoices and which don't

## Core Features

### 1. Transaction Import
- Upload Excel/CSV files from banks or credit cards
- Automatic duplicate detection
- Categorize transactions (income/expense)

### 2. Invoice Upload
- Upload PDF or image invoices
- Support for Hebrew invoices
- AI extracts:
  - Vendor name
  - Document type (invoice/receipt/credit note/quote)
  - Document number
  - Expense date
  - Total amount
  - Subtotal (before VAT)
  - VAT amount
  - VAT rate (%)
  - Currency
  - Line items (for multi-row invoices): date, description, amount, reference

**Important AI understanding:**
- AI must determine if an invoice contains **multiple separate charges** (e.g., Facebook yearly invoice with 12 monthly charges = 12 transactions to match) vs **breakdown of a single payment** (e.g., itemized receipt for one purchase = 1 transaction to match)
- Line items must be extracted accurately to enable proper expense categorization and reporting based on the actual goods/services purchased

### 3. Matching
- Auto-match transactions to invoices by amount/date/vendor
- **Approval system**: All auto-matches require user approval before being finalized (user will be able to control it in settings how much he want to trust the system)
- Manual matching controls:
  - Connect: Manually link a transaction to an invoice
  - Disconnect: Unlink a matched transaction from its invoice
  - Retry: Re-run auto-matching on unmatched/disconnected items
- Match quality indicators (exact, partial, AI-matched)

### 4. Dashboard
- Overview of matched vs unmatched transactions
- Quick stats and progress tracking

### 5. Settings
- how much to trust the ai matching system

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Google Gemini 3 flash as in https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-flash for invoice extraction
- **Database**: PostgreSQL (supabase you connect via the mcp)

## Users

Small business owners in Israel who need to track expenses and match invoices for tax reporting (VAT).

## Success Metrics

- can actually prase bank and credit card data, even huge files
- can get the data well from the invoice and recite no matter the form (xlsx, csv, pdf, image, ect)
- Match accuracy (target: 90%+ auto-match rate), and to have also an acurrecy muserment that will tell the user how mutch it actually persice
- show exactlly how many transactions dont connected to an invoice/recite and how many docs we have that not connected to transaction 
