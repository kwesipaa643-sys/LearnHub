<?php
// routes/web.php
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/up', fn() => response()->json(['status' => 'ok', 'timestamp' => now()]));

// OAuth social callbacks handled via API routes
// but we need a web redirect fallback
Route::get('/auth/{provider}/callback', function (string $provider) {
    return redirect(config('app.frontend_url') . '/auth/callback?provider=' . $provider);
});
