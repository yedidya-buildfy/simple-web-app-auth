# AI Invoice Parser - Quick Start Guide

## Setup (One-Time)

### 1. Get a Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Configure Environment

Add to your `.env` file:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## Usage

### Process an Invoice File

```typescript
import { useFileProcessor } from '@/hooks/useFileProcessor'

function MyComponent() {
  const { processFile, processing, error, progress } = useFileProcessor()

  const handleProcess = async (fileId: string) => {
    try {
      await processFile(fileId)
      console.log('Invoice processed successfully!')
    } catch (err) {
      console.error('Processing failed:', err)
    }
  }

  return (
    <div>
      {processing && <p>{progress}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

### Review Low-Confidence Invoices

```typescript
import InvoiceReviewModal from '@/components/InvoiceReviewModal'
import { supabase } from '@/lib/supabase'

function InvoiceReview() {
  const [invoice, setInvoice] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleSave = async (id, updates, lineItems) => {
    // Update invoice
    await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)

    // Delete existing line items
    await supabase
      .from('invoice_rows')
      .delete()
      .eq('invoice_id', id)

    // Insert updated line items
    await supabase
      .from('invoice_rows')
      .insert(lineItems.map(item => ({ 
        ...item, 
        invoice_id: id 
      })))
  }

  return (
    <InvoiceReviewModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      invoice={invoice}
      onSave={handleSave}
    />
  )
}
```

### Parse Invoice Directly

```typescript
import { parseInvoiceWithAI } from '@/lib/parsers/invoiceParser'

const fileUrl = 'https://your-storage.com/invoice.pdf'
const invoiceData = await parseInvoiceWithAI(fileUrl, 'pdf')

console.log('Vendor:', invoiceData.vendor_name)
console.log('Total:', invoiceData.total_amount)
console.log('Confidence:', invoiceData.extraction_confidence)
console.log('Line Items:', invoiceData.line_items.length)
```

## What Gets Extracted

### Invoice Data
- Vendor name (Hebrew & English supported)
- Document date (YYYY-MM-DD)
- Document type (invoice, receipt, credit_note, quote, other)
- Document number
- Currency (ILS, USD, EUR, GBP)
- Subtotal
- VAT rate and amount (handles Israeli 17% VAT)
- Total amount

### Line Items
- Description
- Quantity
- Unit price
- Amount
- Optional: Date, Reference

## Confidence Scoring

- **≥ 70%**: Automatically approved, status = 'unmatched'
- **< 70%**: Requires manual review, status = 'manual'

After manual review, confidence is set to 100% and status changes to 'unmatched'.

## Database Tables

### invoices
Stores main invoice data with extraction confidence and raw AI response.

### invoice_rows
Stores individual line items linked to invoices via `invoice_id`.

### files
Updated with processing status, items count, and completion timestamp.

## Error Handling

The system handles:
- Missing API key
- Rate limits (with retry)
- Network errors
- Invalid responses
- File access issues

Errors are saved to the `files.error_message` field.

## Cost

Using Gemini 1.5 Flash:
- ~$0.01-0.02 per invoice
- Free tier: 60 requests/min, 1,500/day

## Support

For issues or questions, check:
- `/Users/yedidya/Desktop/invoices-2/md-files/AI-INVOICE-PROGRESS.md`
- `/Users/yedidya/Desktop/invoices-2/invoices3/AI_INVOICE_IMPLEMENTATION_SUMMARY.md`

---

**Happy Invoice Processing!**
