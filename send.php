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

// ── 1. Honeypot шалгах ─────────────────────────────────────
if (!empty($_POST['website'])) {
    // Bot илэрлээ — хуурамч амжилт буцаах
    echo json_encode(['success' => true, 'message' => 'Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!']);
    exit;
}

// ── 2. Үндсэн талбарууд шалгах ────────────────────────────
if (!$name || !$phone) {
    echo json_encode(['success' => false, 'message' => 'Нэр болон утасны дугаар шаардлагатай.']);
    exit;
}

// ── 3. Утасны дугаар: яг 8 орон тоо ──────────────────────
$phone_digits = preg_replace('/\D/', '', $phone);
if (strlen($phone_digits) !== 8) {
    echo json_encode(['success' => false, 'message' => 'Утасны дугаар 8 оронтой байх ёстой.']);
    exit;
}

// ── 4. Rate limiting: 1 IP → 1 минутад 1 илгээлт ─────────
$ip        = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rate_file = sys_get_temp_dir() . '/lsc_rate_' . md5($ip);
if (file_exists($rate_file) && (time() - filemtime($rate_file)) < 60) {
    echo json_encode(['success' => false, 'message' => 'Та хэт олон удаа илгээлээ. 1 минут хүлээнэ үү.']);
    exit;
}
@touch($rate_file);

// ── 5. Email илгээх ───────────────────────────────────────
$to      = 'info@lsc.mn, marketing@antmall.mn';
$subject = '=?UTF-8?B?' . base64_encode('Шинэ захиалга: ' . $name) . '?=';

$body  = "Шинэ захиалга ирлээ!\r\n\r\n";
$body .= "Нэр:            $name\r\n";
$body .= "Утас:           $phone_digits\r\n";
$body .= "Барилгын төрөл: $type\r\n";
$body .= "Нэмэлт мэдэ:   $message\r\n";
$body .= "\r\n---\r\nlsc.mn вэбсайтаас ирсэн.";

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: base64\r\n";
$headers .= "From: =?UTF-8?B?" . base64_encode('LSC Website <info@lsc.mn>') . "?=\r\n";
$headers .= "Reply-To: $name <$phone_digits>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

mail($to, $subject, base64_encode($body), $headers);

// ── 6. Google Sheets руу хадгалах ────────────────────────
$sheet_url = 'https://script.google.com/macros/s/AKfycbxyR4FqmOvEftUY79ZGA2LiLjVlKIRNh6uv-TqSGBoQVGp3g-I6cnZyiWDDwVkUC35n/exec';

$sheet_url .= '?' . http_build_query([
    'name'    => $name,
    'phone'   => $phone_digits,
    'type'    => $type,
    'message' => $message,
]);

$ctx = stream_context_create([
    'http' => [
        'method'          => 'GET',
        'timeout'         => 10,
        'follow_location' => 1,
    ]
]);

@file_get_contents($sheet_url, false, $ctx);

// ── 7. Хариу буцаах ──────────────────────────────────────
echo json_encode(['success' => true, 'message' => 'Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!']);
