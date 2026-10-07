import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html
    
    cat << 'EOF' > index.php
<?php
// Define the backend URL
$target = "http://127.0.0.1:5000" . $_SERVER['REQUEST_URI'];
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

// Pass request headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    $headers[] = "$name: $value";
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Pass POST data if any
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
} elseif ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'OPTIONS');
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
} elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
}

// Forward Response Headers
curl_setopt($ch, CURLOPT_HEADERFUNCTION,
  function($curl, $header) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    if (count($header) < 2) // ignore invalid headers
      return $len;

    $headerName = strtolower(trim($header[0]));
    
    // Ignore headers that shouldn't be forwarded
    if (in_array($headerName, ['transfer-encoding', 'connection'])) {
        return $len;
    }
    
    header(trim($header[0]) . ': ' . trim($header[1]), false);
    return $len;
  }
);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
?>
EOF
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
