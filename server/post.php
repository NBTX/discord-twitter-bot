<?php

/* Generate a token and add it here. */
$token = "";

if($_SERVER['REQUEST_METHOD'] !== "POST") die("Bad method.");
if(!$_GET["token"] || $_GET["token"] != $token) die("Unauthorized.");

$providedFileName = $_GET["file"];
$providedFileName = preg_replace('/[^a-zA-Z0-9_-]+/', '-', strtolower($providedFileName));

$target_dir = "./tweet/";
$target_file = isset($_GET["file"]) ? str_replace( "/", "", $providedFileName) : uuid_create() . ".png";

file_put_contents($target_dir . $target_file, base64_decode(file_get_contents("php://input")));
echo $target_file;