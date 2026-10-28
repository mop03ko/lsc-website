<?php
declare(strict_types=1);
function env(string $key, string $default = ''): string
{
    return getenv($key) !== false ? (string) getenv($key) : $default;
}
function db(): PDO
{
    static $db;
    if ($db instanceof PDO) {
        return $db;
    }
    $dir = env('LSC_DATA_DIR');
    if (!$dir || !is_dir($dir) || !is_writable($dir)) {
        throw new RuntimeException('private_storage_unavailable');
    }
    $root = str_replace('\\', '/', realpath(dirname(__DIR__)));
    $real = str_replace('\\', '/', realpath($dir));
    if ($real === $root || str_starts_with($real . '/', $root . '/')) {
        throw new RuntimeException('storage_must_be_outside_webroot');
    }
    umask(0077);
    $db = new PDO('sqlite:' . $dir . '/leads.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $db->exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
    $db->exec("CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,payload_hash TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',owner TEXT NOT NULL DEFAULT '',follow_up TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS rate_limits (ip_hash TEXT PRIMARY KEY,started INTEGER NOT NULL,count INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY,lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,channel TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_try INTEGER NOT NULL,sent_at INTEGER,last_error TEXT,UNIQUE(lead_id,channel));
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY,created_at INTEGER NOT NULL,event TEXT NOT NULL,source TEXT NOT NULL,language TEXT NOT NULL)");
    return $db;
}
function pricing(): array
{
    return json_decode(
        file_get_contents(__DIR__ . '/../config/pricing.json'),
        true,
        512,
        JSON_THROW_ON_ERROR,
    );
}
function calculate(array $q): array
{
    $c = pricing();
    $area = $q['area'] ?? null;
    $profile = $q['profile'] ?? '';
    $method = $q['payment'] ?? 'cash';
    $borrower = $q['borrower'] ?? 'person';
    $term = $q['term'] ?? 12;
    if ((!is_string($profile) && !is_int($profile)) || (!is_string($term) && !is_int($term))) {
        throw new InvalidArgumentException('invalid_quote');
    }
    $profile = (string) $profile;
    if (
        !is_numeric($area) ||
        (float) $area !== (float) (int) $area ||
        $area < $c['minArea'] ||
        $area > $c['maxArea'] ||
        !isset($c['rates'][$profile]) ||
        !in_array($method, ['cash', 'loan', 'barter'], true) ||
        !in_array($borrower, ['person', 'business'], true) ||
        !in_array((int) $term, [12, 24, 36, 48, 60], true) ||
        (string) (int) $term !== (string) $term
    ) {
        throw new InvalidArgumentException('invalid_quote');
    }
    $total = (int) $area * ($c['rates'][$profile] + array_sum($c['extras']));
    $b = $c['loan']['borrowers'][$borrower === 'business' ? 1 : 0];
    $amount = min($total, $b['maxAmount']);
    $r = $c['loan']['monthlyRate'] / 100;
    $monthly =
        $r == 0 ? $amount / (int) $term : ($amount * $r) / (1 - pow(1 + $r, -(int) $term));
    $fee = min(($amount * $c['loan']['feePercent']) / 100, $b['feeCap'] ?? PHP_INT_MAX);
    return [
        'area' => (int) $area,
        'profile' => $profile,
        'payment' => $method,
        'borrower' => $borrower,
        'term' => (int) $term,
        'version' => $c['version'],
        'total' => $total,
        'loan_amount' => $amount,
        'monthly' => round($monthly),
        'fee' => $fee,
        'down' => $total - $amount,
        'repayment' => round($monthly * (int) $term + $fee + $total - $amount),
        'barter_cash' => ($total * $c['barterCashPercent']) / 100,
        'barter_goods' => ($total * (100 - $c['barterCashPercent'])) / 100,
    ];
}
function field(array $data, string $name, int $limit, bool $required = false): string
{
    $value = $data[$name] ?? '';
    if (!is_string($value) || mb_strlen($value) > $limit || str_contains($value, "\0")) {
        throw new InvalidArgumentException('invalid_' . $name);
    }
    $value = trim($value);
    if ($required && $value === '') {
        throw new InvalidArgumentException('invalid_' . $name);
    }
    return $value;
}
function normalize_phone(string $phone): string
{
    if (!preg_match('/^[+\d\s()\-]+$/u', $phone)) {
        throw new InvalidArgumentException('invalid_phone');
    }
    $phone = preg_replace('/\D/', '', $phone);
    if (strlen($phone) === 11 && str_starts_with($phone, '976')) {
        $phone = substr($phone, 3);
    }
    if (!preg_match('/^[0-9]{8}$/', $phone)) {
        throw new InvalidArgumentException('invalid_phone');
    }
    return $phone;
}
function json_response(int $status, array $data): never
{
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if (
        str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'text/html') &&
        str_ends_with($_SERVER['SCRIPT_NAME'] ?? '', 'send.php')
    ) {
        header('Content-Type: text/html; charset=utf-8');
        $ok = ($data['success'] ?? false) === true;
        $title = $ok
            ? 'Хүсэлт бүртгэгдлээ · Request saved'
            : 'Хүсэлт бүртгэгдсэнгүй · Request not saved';
        $detail = $ok
            ? htmlspecialchars($data['id'] ?? '', ENT_QUOTES, 'UTF-8')
            : 'Мэдээллээ шалгаад дахин оролдоно уу. Please check your details and retry.';
        echo '<!doctype html><html lang="mn"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' .
            $title .
            '</title><main><h1>' .
            $title .
            '</h1><p>' .
            $detail .
            '</p><p><a href="tel:+97699080126">+976 9908 0126</a></p><a href="/">Нүүр · Home</a></main></html>';
        exit();
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit();
}
function enforce_request(int $maxBytes = 16384): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        json_response(405, ['success' => false, 'code' => 'method_not_allowed']);
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxBytes) {
        json_response(413, ['success' => false, 'code' => 'too_large']);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (
        ($origin !== '' && $origin !== env('LSC_ORIGIN', 'https://lsc.mn')) ||
        ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site'
    ) {
        json_response(403, ['success' => false, 'code' => 'origin_denied']);
    }
}
function check_rate(PDO $db, string $bucket, int $max, int $seconds): bool
{
    $secret = env('LSC_IP_HASH_KEY');
    if (strlen($secret) < 32) {
        throw new RuntimeException('ip_hash_key_not_configured');
    }
    $hash = hash_hmac('sha256', $bucket . ':' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), $secret);
    $now = time();
    $stmt = $db->prepare('SELECT started,count FROM rate_limits WHERE ip_hash=?');
    $stmt->execute([$hash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && $now - $row['started'] < $seconds && $row['count'] >= $max) {
        return false;
    }
    $count = $row && $now - $row['started'] < $seconds ? $row['count'] + 1 : 1;
    $start = $count === 1 ? $now : $row['started'];
    $db->prepare(
        'INSERT INTO rate_limits VALUES (?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET started=excluded.started,count=excluded.count',
    )->execute([$hash, $start, $count]);
    $db->prepare('DELETE FROM rate_limits WHERE started < ?')->execute([$now - 86400]);
    return true;
}
