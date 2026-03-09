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

$to      = 'info@lsc.mn';
$subject = 'Шинэ захиалга: ' . $name;

$body  = "Шинэ захиалга ирлээ!\n\n";
$body .= "Нэр:           $name\n";
$body .= "Утас:          $phone\n";
$body .= "Барилгын төрөл: $type\n";
$body .= "Нэмэлт мэдэ:   $message\n";
$body .= "\n---\nlsc.mn вэбсайтаас ирсэн.";

$headers  = "From: noreply@lsc.mn\r\n";
$headers .= "Reply-To: $phone\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Илгээхэд алдаа гарлаа. Утсаар холбогдоно уу.']);
}
