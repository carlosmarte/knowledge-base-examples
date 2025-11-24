#!/bin/bash

set -e

# File paths
CSV_FILE="./data.csv"
ENCRYPTED_FILE="./data.csv.enc"
DECRYPTED_FILE="./data_decrypted.csv"

# Prompt for password securely
read -s -p "Enter password for encryption/decryption: " PASSPHRASE
echo

# ENCRYPT CSV FILE
encrypt_file() {
    echo "🔒 Encrypting $CSV_FILE..."
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "$CSV_FILE" -out "$ENCRYPTED_FILE" -pass pass:"$PASSPHRASE"
    echo "✅ File encrypted as $ENCRYPTED_FILE"
}

# DECRYPT CSV FILE
decrypt_file() {
    echo "🔓 Decrypting $ENCRYPTED_FILE..."
    openssl enc -aes-256-cbc -d -pbkdf2 -in "$ENCRYPTED_FILE" -out "$DECRYPTED_FILE" -pass pass:"$PASSPHRASE"
    echo "✅ File decrypted to $DECRYPTED_FILE"
}

# LOOP OVER FIRST TWO COLUMNS
process_decrypted_csv() {
    echo "📄 Reading first two columns of each row:"
    while IFS=',' read -r col1 col2 _; do
        echo "Column 1: $col1 | Column 2: $col2"
    done < "$DECRYPTED_FILE"
}

# Main control flow
encrypt_file
decrypt_file
process_decrypted_csv
