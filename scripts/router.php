<?php
// Local preview only. Production uses Apache's .htaccess.
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if(preg_match('~^/(server|config|vendor)(/|$)|/\.~',$path)){http_response_code(404);exit;}
$file=realpath(__DIR__.'/../dist'.$path);
if($file&&str_starts_with($file,realpath(__DIR__.'/../dist'))&&is_file($file))return false;
if($file&&is_dir($file)&&is_file($file.'/index.html')){readfile($file.'/index.html');exit;}
http_response_code(404);readfile(__DIR__.'/../dist/404.html');
