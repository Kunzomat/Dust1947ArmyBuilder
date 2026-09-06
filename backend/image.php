<?php
// Simple image serving endpoint
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$imageName = $_GET['name'] ?? '';

if (empty($imageName)) {
    http_response_code(400);
    echo json_encode(["error" => "No image name provided"]);
    exit;
}

// Sanitize filename to prevent directory traversal
$imageName = basename($imageName);
$imagePath = __DIR__ . "/images/" . $imageName;

if (!file_exists($imagePath)) {
    // Return a placeholder or 404
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Image not found: $imageName"]);
    exit;
}

// Determine MIME type
$ext = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
$mimeTypes = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'svg' => 'image/svg+xml',
    'webp' => 'image/webp'
];

$mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';

header("Content-Type: $mimeType");
header("Content-Length: " . filesize($imagePath));
header("Cache-Control: public, max-age=86400"); // 1 day cache

readfile($imagePath);

