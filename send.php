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

$sent = mail($to, $subject, base64_encode($body), $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Илгээхэд алдаа гарлаа. Утсаар холбогдоно уу.']);
}
