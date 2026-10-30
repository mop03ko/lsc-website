<?php
declare(strict_types=1);
// One-time setup for cPanel/shared hosting. Run from the cPanel Terminal (or once as a cron job):
//   php /home/USER/public_html/server/install.php
// Creates the private folder outside the web root with a data directory and an env.php
// settings file. Existing settings are never overwritten. Prints no secrets.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require __DIR__ . '/bootstrap.php';
umask(0077);
$dir = private_dir();
$data = $dir . '/data';
foreach ([$dir, $data] as $d) {
    if (!is_dir($d) && !mkdir($d, 0700, true)) {
        fwrite(STDERR, "Could not create $d\n");
        exit(1);
    }
    chmod($d, 0700);
}
$file = $dir . '/env.php';
if (!is_file($file)) {
    $values = [
        'LSC_ORIGIN' => 'https://lsc.mn',
        'LSC_DATA_DIR' => $data,
        'LSC_IP_HASH_KEY' => bin2hex(random_bytes(32)),
        'LSC_SMTP_HOST' => '',
        'LSC_SMTP_PORT' => '465',
        'LSC_SMTP_TLS' => 'ssl',
        'LSC_SMTP_USER' => '',
        'LSC_SMTP_PASSWORD' => '',
        'LSC_MAIL_FROM' => 'info@lsc.mn',
        'LSC_MAIL_TO' => 'info@lsc.mn',
        'LSC_SHEET_URL' => '',
        'LSC_SHEET_SECRET' => '',
    ];
    $php =
        "<?php\n// LSC.mn private settings. Fill the empty values in cPanel File Manager.\n// Never copy this file into public_html or share it.\nreturn " .
        var_export($values, true) .
        ";\n";
    file_put_contents($file, $php, LOCK_EX);
    chmod($file, 0600);
    echo "Created $file\n";
} else {
    echo "Kept existing $file\n";
}
echo 'PHP ' .
    PHP_VERSION .
    (version_compare(PHP_VERSION, '8.3', '>=') ? ' ok' : ' (needs 8.3+)') .
    "\n";
foreach (['pdo_sqlite', 'mbstring', 'curl'] as $ext) {
    echo $ext . ': ' . (extension_loaded($ext) ? 'ok' : 'MISSING') . "\n";
}
echo "Data folder: $data\n";
echo 'Cron (every minute): ' . PHP_BINARY . ' ' . __DIR__ . "/worker.php\n";
