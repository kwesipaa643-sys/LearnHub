<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Notifications\OrderConfirmed;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService)
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Initiate checkout with Stripe PaymentIntent
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.course_id' => 'required|exists:courses,id',
            'coupon_code' => 'nullable|string',
        ]);

        $user = $request->user();

        // Fetch courses and verify they're purchasable
        $courseIds = collect($request->items)->pluck('course_id');
        $courses = Course::published()
            ->whereIn('id', $courseIds)
            ->where('pricing_type', 'paid')
            ->get();

        if ($courses->count() !== $courseIds->unique()->count()) {
            return response()->json([
                'success' => false,
                'message' => 'One or more courses are not available for purchase.',
            ], 422);
        }

        // Check for existing enrollments
        $alreadyEnrolled = Enrollment::where('user_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->where('status', 'active')
            ->pluck('course_id');

        if ($alreadyEnrolled->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'You are already enrolled in one or more courses.',
            ], 422);
        }

        // Calculate totals
        $subtotal = $courses->sum('effective_price');
        $discount = 0;
        $coupon = null;

        if ($request->coupon_code) {
            $coupon = Coupon::where('code', strtoupper($request->coupon_code))->first();

            if (!$coupon || !$coupon->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired coupon code.',
                    'errors' => ['coupon_code' => ['This coupon is not valid.']],
                ], 422);
            }

            $discount = $coupon->calculateDiscount($subtotal);
        }

        $total = max(0, $subtotal - $discount);

        DB::beginTransaction();
        try {
            // Create order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'currency' => 'USD',
                'coupon_id' => $coupon?->id,
                'status' => 'pending',
                'payment_method' => 'stripe',
            ]);

            // Create order items
            foreach ($courses as $course) {
                $order->items()->create([
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'price' => $course->effective_price,
                    'currency' => $course->currency,
                ]);
            }

            // If total is 0 (100% coupon), complete immediately
            if ($total == 0) {
                $this->paymentService->completeOrder($order);
                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'order_id' => $order->id,
                        'free' => true,
                        'redirect' => '/my-courses',
                    ],
                ]);
            }

            // Create Stripe PaymentIntent
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => (int) ($total * 100), // cents
                'currency' => strtolower('USD'),
                'customer' => $this->paymentService->getOrCreateStripeCustomer($user),
                'metadata' => [
                    'order_id' => $order->id,
                    'user_id' => $user->id,
                ],
                'automatic_payment_methods' => ['enabled' => true],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'client_secret' => $paymentIntent->client_secret,
                    'amount' => $total,
                    'currency' => 'USD',
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Checkout error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to process checkout. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle Stripe webhooks
     */
    public function stripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                config('services.stripe.webhook_secret')
            );
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        match ($event->type) {
            'payment_intent.succeeded' => $this->handlePaymentSuccess($event->data->object),
            'payment_intent.payment_failed' => $this->handlePaymentFailed($event->data->object),
            'customer.subscription.deleted' => $this->handleSubscriptionCancelled($event->data->object),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($event->data->object),
            default => null,
        };

        return response()->json(['received' => true]);
    }

    /**
     * Handle successful payment
     */
    private function handlePaymentSuccess(object $paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;
        if (!$orderId) return;

        $order = Order::find($orderId);
        if (!$order || $order->status !== 'pending') return;

        DB::transaction(function () use ($order, $paymentIntent) {
            // Record payment
            Payment::create([
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'provider' => 'stripe',
                'provider_payment_id' => $paymentIntent->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => strtoupper($paymentIntent->currency),
                'status' => 'succeeded',
                'paid_at' => now(),
                'provider_response' => (array) $paymentIntent,
            ]);

            // Complete order (creates enrollments, sends email)
            $this->paymentService->completeOrder($order);
        });
    }

    /**
     * Handle failed payment
     */
    private function handlePaymentFailed(object $paymentIntent): void
    {
        $orderId = $paymentIntent->metadata->order_id ?? null;
        if (!$orderId) return;

        Order::where('id', $orderId)->update(['status' => 'failed']);
    }

    /**
     * Get order history
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.course:id,title,thumbnail', 'payments'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Download invoice PDF
     */
    public function invoice(Request $request, Order $order): mixed
    {
        // Ensure user owns this order
        abort_if($order->user_id !== $request->user()->id, 403);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.order', compact('order'));

        return $pdf->download("invoice-{$order->order_number}.pdf");
    }

    /**
     * Validate a coupon code
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'course_ids' => 'required|array',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'This coupon code is invalid or has expired.',
            ], 422);
        }

        $courses = Course::whereIn('id', $request->course_ids)->get();
        $subtotal = $courses->sum('effective_price');
        $discount = $coupon->calculateDiscount($subtotal);

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount_amount' => $discount,
                'final_total' => max(0, $subtotal - $discount),
            ],
        ]);
    }
}
