<?php
declare(strict_types=1);
require __DIR__ . '/server/bootstrap.php';
enforce_request();
$transaction = false;
try {
    $type = strtolower(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]);
    if ($type === 'application/json') {
        $raw = file_get_contents('php://input', false, null, 0, 16385);
        if (strlen($raw) > 16384) {
            json_response(413, ['success' => false, 'code' => 'too_large']);
        }
        $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($data) || array_is_list($data)) {
            throw new InvalidArgumentException('invalid_payload');
        }
    } elseif (in_array($type, ['application/x-www-form-urlencoded', 'multipart/form-data'], true)) {
        $data = $_POST;
    } else {
        json_response(415, ['success' => false, 'code' => 'unsupported_media_type']);
    }
    if (field($data, 'website', 200) !== '') {
        json_response(422, ['success' => false, 'code' => 'invalid_request']);
    }
    $name = field($data, 'name', 100, true);
    if (preg_match('/[\x00-\x1f\x7f]/', $name)) {
        throw new InvalidArgumentException('invalid_name');
    }
    $phone = normalize_phone(field($data, 'phone', 30, true));
    $building = field($data, 'type', 30);
    if (
        !in_array(
            $building,
            [
                '',
                'house',
                'apartment',
                'tourist_camp',
                'mining_camp',
                'mobile',
                'extension',
                'other',
            ],
            true,
        )
    ) {
        throw new InvalidArgumentException('invalid_type');
    }
    $language = field($data, 'language', 2) ?: 'mn';
    if (!in_array($language, ['mn', 'en'], true)) {
        throw new InvalidArgumentException('invalid_language');
    }
    $key = field($data, 'request_id', 80);
    if ($key === '') {
        $key = bin2hex(random_bytes(16));
    }
    if (!preg_match('/^[a-zA-Z0-9-]{16,80}$/', $key)) {
        throw new InvalidArgumentException('invalid_request_id');
    }
    $quote = null;
    if (array_key_exists('quote', $data) && $data['quote'] !== null) {
        if (!is_array($data['quote']) || array_is_list($data['quote'])) {
            throw new InvalidArgumentException('invalid_quote');
        }
        $quote = calculate($data['quote']);
    }
    $source = field($data, 'source', 40);
    if (
        !in_array(
            $source,
            ['', 'facebook', 'google', 'instagram', 'viber', 'direct', 'other'],
            true,
        )
    ) {
        $source = 'other';
    }
    $payload = [
        'name' => $name,
        'phone' => $phone,
        'type' => $building,
        'message' => field($data, 'message', 3000),
        'language' => $language,
        'quote' => $quote,
        'source' => $source,
        'privacy_version' => '2026-10-28',
    ];
    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $hash = hash('sha256', $encoded);
    $db = db();
    $db->exec('BEGIN IMMEDIATE');
    $transaction = true;
    $stmt = $db->prepare('SELECT id,payload_hash FROM leads WHERE request_key=?');
    $stmt->execute([$key]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        $db->exec('COMMIT');
        $transaction = false;
        if (!hash_equals($existing['payload_hash'], $hash)) {
            json_response(409, ['success' => false, 'code' => 'request_conflict']);
        }
        json_response(200, ['success' => true, 'code' => 'accepted', 'id' => $existing['id']]);
    }
    if (!check_rate($db, 'lead', 5, 600)) {
        $db->exec('COMMIT');
        $transaction = false;
        header('Retry-After: 600');
        json_response(429, ['success' => false, 'code' => 'rate_limited']);
    }
    $id = 'LSC-' . strtoupper(bin2hex(random_bytes(8)));
    $now = time();
    $db->prepare(
        'INSERT INTO leads (id,request_key,payload_hash,created_at,updated_at,payload) VALUES (?,?,?,?,?,?)',
    )->execute([$id, $key, $hash, $now, $now, $encoded]);
    foreach (['email', 'sheet'] as $channel) {
        $db->prepare('INSERT INTO outbox (lead_id,channel,next_try) VALUES (?,?,?)')->execute([
            $id,
            $channel,
            $now,
        ]);
    }
    $db->exec('COMMIT');
    $transaction = false;
    json_response(201, ['success' => true, 'code' => 'accepted', 'id' => $id]);
} catch (InvalidArgumentException | JsonException $e) {
    if ($transaction) {
        $db->exec('ROLLBACK');
    }
    json_response(422, [
        'success' => false,
        'code' => $e instanceof JsonException ? 'invalid_payload' : $e->getMessage(),
    ]);
} catch (Throwable $e) {
    if ($transaction) {
        $db->exec('ROLLBACK');
    }
    error_log('LSC lead_storage_failure ' . get_class($e));
    json_response(503, ['success' => false, 'code' => 'temporarily_unavailable']);
}
