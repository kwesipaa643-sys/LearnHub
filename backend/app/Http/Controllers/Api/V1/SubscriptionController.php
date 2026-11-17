<?php
// ── app/Http/Controllers/Api/V1/SubscriptionController.php ───
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Subscription as StripeSubscription;

class SubscriptionController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService)
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get();
        return response()->json(['success' => true, 'data' => $plans]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id'           => 'required|exists:subscription_plans,id',
            'billing_cycle'     => 'required|in:monthly,yearly',
            'payment_method_id' => 'required|string',
        ]);

        $user = $request->user();
        $plan = SubscriptionPlan::findOrFail($request->plan_id);
        $customerId = $this->paymentService->getOrCreateStripeCustomer($user);

        // Attach payment method
        $pm = \Stripe\PaymentMethod::retrieve($request->payment_method_id);
        $pm->attach(['customer' => $customerId]);

        \Stripe\Customer::update($customerId, [
            'invoice_settings' => ['default_payment_method' => $request->payment_method_id],
        ]);

        $priceId = $request->billing_cycle === 'yearly'
            ? $plan->stripe_price_yearly_id
            : $plan->stripe_price_monthly_id;

        $stripeSubscription = StripeSubscription::create([
            'customer' => $customerId,
            'items'    => [['price' => $priceId]],
            'expand'   => ['latest_invoice.payment_intent'],
        ]);

        $subscription = Subscription::create([
            'user_id'                => $user->id,
            'plan_id'                => $plan->id,
            'stripe_subscription_id' => $stripeSubscription->id,
            'status'                 => 'active',
            'billing_cycle'          => $request->billing_cycle,
            'current_period_start'   => now(),
            'current_period_end'     => $request->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
        ]);

        return response()->json(['success' => true, 'data' => $subscription], 201);
    }

    public function cancel(Request $request): JsonResponse
    {
        $subscription = Subscription::where('user_id', $request->user()->id)
            ->where('status', 'active')->firstOrFail();

        if ($subscription->stripe_subscription_id) {
            StripeSubscription::update($subscription->stripe_subscription_id, ['cancel_at_period_end' => true]);
        }

        $subscription->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Subscription will end at the current billing period.']);
    }

    public function current(Request $request): JsonResponse
    {
        $subscription = $request->user()->activeSubscription();
        return response()->json(['success' => true, 'data' => $subscription?->load('plan')]);
    }
}
