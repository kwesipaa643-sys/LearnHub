<!DOCTYPE html>
{{-- resources/views/certificates/template.blade.php --}}
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background: #ffffff;
            width: 297mm;
            height: 210mm;
            overflow: hidden;
        }

        .certificate {
            width: 100%;
            height: 210mm;
            position: relative;
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 50%, #f8f9ff 100%);
            border: 12px solid transparent;
            padding: 30px 50px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        /* Decorative border */
        .certificate::before {
            content: '';
            position: absolute;
            inset: 8px;
            border: 3px solid #6366f1;
            border-radius: 4px;
            pointer-events: none;
        }
        .certificate::after {
            content: '';
            position: absolute;
            inset: 14px;
            border: 1px solid #c7d2fe;
            border-radius: 2px;
            pointer-events: none;
        }

        /* Corner decorations */
        .corner {
            position: absolute;
            width: 60px;
            height: 60px;
        }
        .corner-tl { top: 20px; left: 20px; border-top: 4px solid #6366f1; border-left: 4px solid #6366f1; }
        .corner-tr { top: 20px; right: 20px; border-top: 4px solid #6366f1; border-right: 4px solid #6366f1; }
        .corner-bl { bottom: 20px; left: 20px; border-bottom: 4px solid #6366f1; border-left: 4px solid #6366f1; }
        .corner-br { bottom: 20px; right: 20px; border-bottom: 4px solid #6366f1; border-right: 4px solid #6366f1; }

        .logo {
            font-size: 22px;
            font-weight: 900;
            color: #6366f1;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .logo-sub {
            font-size: 10px;
            color: #818cf8;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        .divider {
            width: 120px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #6366f1, transparent);
            margin: 12px auto;
        }

        .cert-title {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 4px;
        }

        .cert-of {
            font-size: 36px;
            font-weight: 700;
            color: #1e1b4b;
            letter-spacing: 1px;
            margin-bottom: 20px;
            font-style: italic;
        }

        .this-certifies {
            font-size: 13px;
            color: #475569;
            margin-bottom: 8px;
        }

        .recipient-name {
            font-size: 42px;
            font-weight: 700;
            color: #4f46e5;
            border-bottom: 2px solid #e0e7ff;
            padding-bottom: 8px;
            margin-bottom: 12px;
            min-width: 300px;
            display: inline-block;
        }

        .completed-text {
            font-size: 13px;
            color: #475569;
            margin-bottom: 6px;
        }

        .course-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e1b4b;
            max-width: 500px;
            line-height: 1.3;
            margin-bottom: 6px;
        }

        .instructor-text {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 24px;
        }

        .meta-row {
            display: flex;
            justify-content: center;
            gap: 60px;
            margin-top: 10px;
        }

        .meta-item {
            text-align: center;
        }

        .meta-label {
            font-size: 9px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 3px;
        }

        .meta-value {
            font-size: 11px;
            color: #334155;
            font-weight: 600;
        }

        .signature-line {
            width: 160px;
            height: 1px;
            background: #334155;
            margin: 0 auto 4px;
        }

        .verify-text {
            position: absolute;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 9px;
            color: #94a3b8;
            white-space: nowrap;
        }

        .seal {
            position: absolute;
            bottom: 35px;
            right: 60px;
            width: 70px;
            height: 70px;
            border: 3px solid #6366f1;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #6366f1;
        }

        .seal-text {
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
            line-height: 1.3;
        }
    </style>
</head>
<body>
<div class="certificate">
    <!-- Corners -->
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- Logo -->
    <div class="logo">LearnHub</div>
    <div class="logo-sub">Online Learning Platform</div>

    <div class="divider"></div>

    <!-- Certificate type -->
    <div class="cert-title">Certificate</div>
    <div class="cert-of">of Completion</div>

    <!-- Recipient -->
    <div class="this-certifies">This certifies that</div>
    <div class="recipient-name">{{ $user->name }}</div>

    <!-- Course -->
    <div class="completed-text">has successfully completed the course</div>
    <div class="course-title">{{ $course->title }}</div>
    <div class="instructor-text">Instructor: {{ $instructor->name }}</div>

    <div class="divider"></div>

    <!-- Meta info -->
    <div class="meta-row">
        <div class="meta-item">
            <div class="meta-label">Date Issued</div>
            <div class="meta-value">{{ $issued_date }}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Certificate ID</div>
            <div class="meta-value">{{ strtoupper(substr($certificate->uuid, 0, 8)) }}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Duration</div>
            <div class="meta-value">{{ $course->duration_hours }} Hours</div>
        </div>
    </div>

    <!-- Verify URL -->
    <div class="verify-text">
        Verify at: {{ $verify_url }}
    </div>

    <!-- Official seal -->
    <div class="seal">
        <div class="seal-text">OFFICIAL<br>CERTIFICATE<br>✓ VERIFIED</div>
    </div>
</div>
</body>
</html>
