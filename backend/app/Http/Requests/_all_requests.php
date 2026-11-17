<?php
/**
 * ============================================================
 * FORM REQUESTS — app/Http/Requests/
 * ============================================================
 */

// ── Auth/RegisterRequest.php ─────────────────────────────────
namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'role'                  => ['sometimes', 'in:student,instructor'],
            'timezone'              => ['sometimes', 'timezone'],
            'language'              => ['sometimes', 'string', 'max:10'],
        ];
    }
}

// ── Auth/LoginRequest.php ────────────────────────────────────
class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}

// ── Auth/ResetPasswordRequest.php ────────────────────────────
class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}

// ── Course/StoreCourseRequest.php ────────────────────────────
namespace App\Http\Requests\Course;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['instructor', 'admin']);
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:255'],
            'category_id'  => ['required', 'exists:categories,id'],
            'level'        => ['required', 'in:beginner,intermediate,advanced,all-levels'],
            'pricing_type' => ['required', 'in:free,paid,subscription'],
            'price'        => ['required_if:pricing_type,paid', 'numeric', 'min:0'],
            'language'     => ['required', 'string', 'max:10'],
        ];
    }
}

// ── Course/UpdateCourseRequest.php ───────────────────────────
class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'          => ['sometimes', 'string', 'max:255'],
            'subtitle'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'description'    => ['sometimes', 'nullable', 'string'],
            'what_you_learn' => ['sometimes', 'array'],
            'what_you_learn.*' => ['string', 'max:255'],
            'requirements'   => ['sometimes', 'array'],
            'requirements.*' => ['string', 'max:255'],
            'for_whom'       => ['sometimes', 'array'],
            'for_whom.*'     => ['string', 'max:255'],
            'level'          => ['sometimes', 'in:beginner,intermediate,advanced,all-levels'],
            'category_id'    => ['sometimes', 'exists:categories,id'],
            'pricing_type'   => ['sometimes', 'in:free,paid,subscription'],
            'price'          => ['sometimes', 'numeric', 'min:0'],
            'sale_price'     => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'sale_ends_at'   => ['sometimes', 'nullable', 'date'],
            'language'       => ['sometimes', 'string', 'max:10'],
            'certificate_enabled' => ['sometimes', 'boolean'],
        ];
    }
}

// ── Review/StoreReviewRequest.php ────────────────────────────
namespace App\Http\Requests\Review;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'title'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
