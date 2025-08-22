<?php
// Replace with your own verify token
$verify_token = '123456';
 
// Check if the request is a GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Retrieve the parameters sent by Facebook
    $mode = isset($_GET['hub_mode']) ? $_GET['hub_mode'] : '';
    $challenge = isset($_GET['hub_challenge']) ? $_GET['hub_challenge'] : '';
    $verify_token_received = isset($_GET['hub_verify_token']) ? $_GET['hub_verify_token'] : '';
 
    // Verify the token matches what you expect
    if ($mode === 'subscribe' && $verify_token === $verify_token_received) {
        // Return the challenge code to complete the verification
        echo $challenge;
    } else {
        // If the verification fails
        echo 'Verification failed.';
    }
} else {
    // Handle other methods if needed
    echo 'Invalid request method.';
}
?>