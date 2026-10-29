<?php
declare(strict_types=1);
require __DIR__ . '/server/bootstrap.php';
enforce_request(1024);
$transaction = false;
try {
    $data = json_decode(
        file_get_contents('php://input', false, null, 0, 1025),
        true,
        8,
        JSON_THROW_ON_ERROR,
    );
    if (!is_array($data)) {
        throw new InvalidArgumentException();
    }
    $event = field($data, 'event', 30, true);
    $source = field($data, 'source', 40);
    $language = field($data, 'language', 2);
    if (
        !in_array(
            $event,
            ['calculator_use', 'quote_click', 'phone_click', 'messenger_click'],
            true,
        ) ||
        !in_array($language, ['mn', 'en'], true) ||
        !in_array(
            $source,
            ['', 'facebook', 'google', 'instagram', 'viber', 'direct', 'other'],
            true,
        )
    ) {
        throw new InvalidArgumentException();
    }
    $db = db();
    $db->exec('BEGIN IMMEDIATE');
    $transaction = true;
    if (!check_rate($db, 'events', 30, 60)) {
        $db->exec('ROLLBACK');
        $transaction = false;
        json_response(429, ['success' => false]);
    }
    $db->prepare('INSERT INTO events (created_at,event,source,language) VALUES (?,?,?,?)')->execute(
        [time(), $event, $source, $language],
    );
    $db->exec('COMMIT');
    $transaction = false;
    json_response(200, ['success' => true]);
} catch (InvalidArgumentException | JsonException $e) {
    if ($transaction) {
        $db->exec('ROLLBACK');
    }
    json_response(422, ['success' => false]);
} catch (Throwable $e) {
    if ($transaction) {
        $db->exec('ROLLBACK');
    }
    json_response(503, ['success' => false]);
}
