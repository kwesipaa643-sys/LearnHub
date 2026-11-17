<!DOCTYPE html>
{{-- resources/views/invoices/order.blade.php --}}
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice #{{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
        .container { max-width: 750px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #6366f1; }
        .logo-sub { font-size: 10px; color: #818cf8; letter-spacing: 2px; }
        .invoice-meta { text-align: right; }
        .invoice-title { font-size: 24px; font-weight: 700; color: #1e1b4b; margin-bottom: 6px; }
        .invoice-number { color: #64748b; font-size: 11px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-completed { background: #dcfce7; color: #15803d; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px; font-weight: 700; }
        .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-block p { line-height: 1.7; color: #475569; }
        .info-block strong { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        thead tr { background: #f8fafc; }
        th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .totals { margin-left: auto; width: 280px; margin-top: 16px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #475569; }
        .totals-row.total { border-top: 2px solid #6366f1; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 14px; color: #1e1b4b; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; line-height: 1.8; }
    </style>
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="header">
        <div>
            <div class="logo">LearnHub</div>
            <div class="logo-sub">Online Learning Platform</div>
        </div>
        <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">{{ $order->order_number }}</div>
            <div style="margin-top: 6px;">
                <span class="badge badge-completed">{{ strtoupper($order->status) }}</span>
            </div>
        </div>
    </div>

    <!-- Billing info -->
    <div class="section">
        <div class="billing-grid">
            <div class="info-block">
                <div class="section-title">Billed To</div>
                <p><strong>{{ $order->user->name }}</strong></p>
                <p>{{ $order->user->email }}</p>
            </div>
            <div class="info-block" style="text-align: right;">
                <div class="section-title">Invoice Details</div>
                <p><strong>Date:</strong> {{ $order->created_at->format('F j, Y') }}</p>
                <p><strong>Invoice #:</strong> {{ $order->order_number }}</p>
                <p><strong>Payment:</strong> {{ ucfirst($order->payment_method ?? 'stripe') }}</p>
            </div>
        </div>
    </div>

    <!-- Items -->
    <div class="section">
        <div class="section-title">Order Items</div>
        <table>
            <thead>
                <tr>
                    <th>Course</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->course_title }}</td>
                    <td style="text-align: right;">${{ number_format($item->price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>${{ number_format($order->subtotal, 2) }}</span>
            </div>
            @if($order->discount > 0)
            <div class="totals-row" style="color: #16a34a;">
                <span>Discount</span>
                <span>-${{ number_format($order->discount, 2) }}</span>
            </div>
            @endif
            @if($order->tax > 0)
            <div class="totals-row">
                <span>Tax</span>
                <span>${{ number_format($order->tax, 2) }}</span>
            </div>
            @endif
            <div class="totals-row total">
                <span>Total</span>
                <span>{{ $order->currency }} ${{ number_format($order->total, 2) }}</span>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Thank you for learning with LearnHub!</p>
        <p>Questions? Contact support@learnhub.dev | learnhub.dev</p>
        <p style="margin-top: 6px;">LearnHub · Online Learning Platform</p>
    </div>
</div>
</body>
</html>
