<?php
$fields = ['merchant' => 'SP-TEST-ND95A838', 'order_invoice_number' => 'HQ-1', 'order_amount' => 1000, 'currency' => 'VND', 'order_description' => 'Test', 'operation' => 'PURCHASE'];
$s = []; foreach($fields as $k => $v) $s[] = $k.'='.$v;
$sig = base64_encode(hash_hmac('sha256', implode(',', $s), 'spsk_test_QH4UYiJPB3t3S5BjJ2JBF3pkhFUo7vGr', true));
$fields['signature'] = $sig;
$ch = curl_init('https://pay-sandbox.sepay.vn/v1/checkout/init');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
echo curl_exec($ch);
