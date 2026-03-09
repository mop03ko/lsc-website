<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$name    = trim(strip_tags($_POST['name'] ?? ''));
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$type    = trim(strip_tags($_POST['type'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

if (!$name || !$phone) {
    echo json_encode(['success' => false, 'message' => 'Нэр болон утасны дугаар шаардлагатай.']);
    exit;
}

// ── 1. Email илгээх ──────────────────────────────────────────
$to      = 'info@lsc.mn, marketing@antmall.mn';
$subject = '=?UTF-8?B?' . base64_encode('Шинэ захиалга: ' . $name) . '?=';

$body  = "Шинэ захиалга ирлээ!\r\n\r\n";
$body .= "Нэр:            $name\r\n";
$body .= "Утас:           $phone\r\n";
$body .= "Барилгын төрөл: $type\r\n";
$body .= "Нэмэлт мэдэ:   $message\r\n";
$body .= "\r\n---\r\nlsc.mn вэбсайтаас ирсэн.";

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: base64\r\n";
$headers .= "From: =?UTF-8?B?" . base64_encode('LSC Website <info@lsc.mn>') . "?=\r\n";
$headers .= "Reply-To: $name <$phone>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

mail($to, $subject, base64_encode($body), $headers);

// ── 2. Google Sheets руу хадгалах ───────────────────────────
$sheet_url = 'https://script.google.com/macros/s/AKfycbwNjgKTSjVriGDjY1k8N5xkWI1UnDaZtLHr5GWnIF4VVylORlvDQYKhHwWsUwmxxIcc/exec';

$data = http_build_query([
    'name'    => $name,
    'phone'   => $phone,
    'type'    => $type,
    'message' => $message,
]);

$ctx = stream_context_create([
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $data,
        'timeout' => 10,
        'follow_location' => 1,
    ]
]);

@file_get_contents($sheet_url, false, $ctx);

// ── 3. Хариу буцаах ─────────────────────────────────────────
echo json_encode(['success' => true, 'message' => 'Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!']);
