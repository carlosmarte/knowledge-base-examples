#!/bin/bash

set -e

# File paths
CSV_FILE="./data.csv"
ENCODED_FILE="./data.csv.b64"
DECODED_FILE="./data_decoded.csv"

# ENCODE CSV TO BASE64
encode_base64() {
    echo "🔐 Encoding $CSV_FILE to Base64..."
    base64 "$CSV_FILE" > "$ENCODED_FILE"
    echo "✅ Encoded file saved as $ENCODED_FILE"
}

# DECODE BASE64 TO CSV
decode_base64() {
    echo "🔓 Decoding $ENCODED_FILE back to CSV..."
    base64 --decode "$ENCODED_FILE" > "$DECODED_FILE"
    echo "✅ Decoded file saved as $DECODED_FILE"
}

# LOOP OVER FIRST TWO COLUMNS
process_decoded_csv() {
    echo "📄 Reading first two columns of each row:"
    while IFS=',' read -r col1 col2 _; do
        echo "Column 1: $col1 | Column 2: $col2"
    done < "$DECODED_FILE"
}

# Main control flow
encode_base64
decode_base64
process_decoded_csv
