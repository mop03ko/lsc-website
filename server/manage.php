<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require __DIR__ . '/bootstrap.php';
try {
    $db = db();
    $command = $argv[1] ?? 'health';
    switch ($command) {
        case 'health':
            $pending = (int) $db
                ->query('SELECT count(*) FROM outbox WHERE sent_at IS NULL')
                ->fetchColumn();
            $oldest = $db
                ->query(
                    'SELECT min(l.created_at) FROM outbox o JOIN leads l ON l.id=o.lead_id WHERE o.sent_at IS NULL',
                )
                ->fetchColumn();
            $age = $oldest ? time() - (int) $oldest : 0;
            echo json_encode(
                [
                    'storage' => 'ok',
                    'pending' => $pending,
                    'oldest_pending_seconds' => $age,
                    'smtp_configured' => env('LSC_SMTP_HOST') !== '' && env('LSC_MAIL_TO') !== '',
                    'sheet_configured' =>
                        env('LSC_SHEET_URL') !== '' && strlen(env('LSC_SHEET_SECRET')) >= 32,
                ],
                JSON_PRETTY_PRINT,
            ) . "\n";
            exit($age > 900 ? 1 : 0);
        case 'list':
            echo json_encode(
                $db
                    ->query(
                        'SELECT id,created_at,status,owner,follow_up FROM leads ORDER BY created_at DESC LIMIT 100',
                    )
                    ->fetchAll(PDO::FETCH_ASSOC),
                JSON_PRETTY_PRINT,
            ) . "\n";
            break;
        case 'show':
            $s = $db->prepare('SELECT * FROM leads WHERE id=?');
            $s->execute([$argv[2] ?? '']);
            echo json_encode(
                $s->fetch(PDO::FETCH_ASSOC),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE,
            ) . "\n";
            break;
        case 'update':
            [$id, $status, $owner, $follow] = array_pad(array_slice($argv, 2), 4, '');
            if (
                !in_array($status, ['new', 'assigned', 'quoted', 'closed'], true) ||
                strlen($owner) > 100 ||
                strlen($follow) > 40
            ) {
                throw new InvalidArgumentException('Invalid status/owner/follow-up');
            }
            $s = $db->prepare(
                'UPDATE leads SET status=?,owner=?,follow_up=?,updated_at=? WHERE id=?',
            );
            $s->execute([$status, $owner, $follow, time(), $id]);
            if ($s->rowCount() !== 1) {
                throw new RuntimeException('Lead not found');
            }
            echo "Updated\n";
            break;
        case 'backup':
            $target = $argv[2] ?? '';
            if ($target === '' || file_exists($target)) {
                throw new InvalidArgumentException(
                    'Provide a new absolute backup path outside webroot',
                );
            }
            $parent = realpath(dirname($target));
            $root = realpath(dirname(__DIR__));
            if (
                !$parent ||
                str_starts_with(
                    str_replace('\\', '/', $parent) . '/',
                    str_replace('\\', '/', $root) . '/',
                )
            ) {
                throw new InvalidArgumentException('Backup must be outside webroot');
            }
            $db->exec('VACUUM INTO ' . $db->quote($target));
            echo "Backup created\n";
            break;
        case 'metrics':
            echo json_encode(
                [
                    'events' => $db
                        ->query(
                            'SELECT event,source,language,count(*) AS count FROM events GROUP BY event,source,language',
                        )
                        ->fetchAll(PDO::FETCH_ASSOC),
                    'accepted_leads' => (int) $db
                        ->query('SELECT count(*) FROM leads')
                        ->fetchColumn(),
                ],
                JSON_PRETTY_PRINT,
            ) . "\n";
            break;
        default:
            throw new InvalidArgumentException(
                'Commands: health, list, show ID, update ID STATUS OWNER FOLLOW_UP, backup ABS_PATH, metrics',
            );
    }
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}
