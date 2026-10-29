<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;

function deliver_email(array $lead): void
{
    if (!env('LSC_SMTP_HOST') || !env('LSC_MAIL_TO')) {
        throw new RuntimeException('smtp_not_configured');
    }
    $p = json_decode($lead['payload'], true, 512, JSON_THROW_ON_ERROR);
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = env('LSC_SMTP_HOST');
    $mail->Port = (int) env('LSC_SMTP_PORT', '587');
    $mail->SMTPAuth = true;
    $mail->Username = env('LSC_SMTP_USER');
    $mail->Password = env('LSC_SMTP_PASSWORD');
    $mail->SMTPSecure = env('LSC_SMTP_TLS', 'tls');
    $mail->Timeout = 15;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom(env('LSC_MAIL_FROM', 'info@lsc.mn'), 'Light Steel Construction');
    foreach (explode(',', env('LSC_MAIL_TO')) as $address) {
        $mail->addAddress(trim($address));
    }
    $mail->Subject = 'LSC request ' . $lead['id'];
    $mail->MessageID = '<' . strtolower($lead['id']) . '@lsc.mn>';
    $mail->Body =
        'Request: ' .
        $lead['id'] .
        "\nName: " .
        $p['name'] .
        "\nPhone: " .
        $p['phone'] .
        "\nType: " .
        $p['type'] .
        "\nDetails: " .
        $p['message'] .
        "\nQuote: " .
        json_encode($p['quote'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $mail->send();
}
function deliver_sheet(array $lead): void
{
    $url = env('LSC_SHEET_URL');
    $secret = env('LSC_SHEET_SECRET');
    if (!str_starts_with($url, 'https://script.google.com/macros/s/') || strlen($secret) < 32) {
        throw new RuntimeException('sheet_not_configured');
    }
    $payload = json_encode(
        [
            'id' => $lead['id'],
            'created_at' => $lead['created_at'],
            'data' => json_decode($lead['payload'], true),
        ],
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
    );
    $ts = time();
    $body = json_encode(
        [
            'timestamp' => $ts,
            'payload' => $payload,
            'signature' => hash_hmac('sha256', $ts . '.' . $payload, $secret),
        ],
        JSON_THROW_ON_ERROR,
    );
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    $result = is_string($response) ? json_decode($response, true) : null;
    if (
        $status !== 200 ||
        !is_array($result) ||
        ($result['success'] ?? false) !== true ||
        ($result['id'] ?? '') !== $lead['id']
    ) {
        throw new RuntimeException('sheet_not_acknowledged');
    }
}
try {
    $db = db();
    $lock = fopen(env('LSC_DATA_DIR') . '/worker.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        exit(0);
    }
    $rows = $db->prepare(
        'SELECT o.*,l.payload,l.created_at FROM outbox o JOIN leads l ON l.id=o.lead_id WHERE o.sent_at IS NULL AND o.next_try<=? ORDER BY o.id LIMIT 20',
    );
    $rows->execute([time()]);
    $failed = 0;
    $jobs = $rows->fetchAll(PDO::FETCH_ASSOC);
    foreach ($jobs as $row) {
        try {
            $lead = [
                'id' => $row['lead_id'],
                'payload' => $row['payload'],
                'created_at' => $row['created_at'],
            ];
            if ($row['channel'] === 'email') {
                deliver_email($lead);
            } else {
                deliver_sheet($lead);
            }
            $db->prepare('UPDATE outbox SET sent_at=?,last_error=NULL WHERE id=?')->execute([
                time(),
                $row['id'],
            ]);
        } catch (Throwable $e) {
            $attempts = $row['attempts'] + 1;
            $delay = min(3600, 60 * 2 ** min($attempts, 6));
            $code =
                $e instanceof RuntimeException &&
                in_array(
                    $e->getMessage(),
                    ['smtp_not_configured', 'sheet_not_configured', 'sheet_not_acknowledged'],
                    true,
                )
                    ? $e->getMessage()
                    : 'delivery_failed';
            $db->prepare(
                'UPDATE outbox SET attempts=?,next_try=?,last_error=? WHERE id=?',
            )->execute([$attempts, time() + $delay, $code, $row['id']]);
            error_log('LSC notification ' . $row['channel'] . ' ' . $code);
            $failed++;
        }
    }
    flock($lock, LOCK_UN);
    fclose($lock);
    echo json_encode(['processed' => count($jobs), 'failed' => $failed]) . "\n";
    exit($failed ? 1 : 0);
} catch (Throwable $e) {
    error_log('LSC worker_unavailable');
    exit(1);
}
