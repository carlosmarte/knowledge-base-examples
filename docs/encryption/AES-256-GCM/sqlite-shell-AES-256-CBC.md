# Encrypt JSON rows and insert into SQLite3

```sh
#!/bin/bash

set -e

# Constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON_FILE="$SCRIPT_DIR/data.json"
DB_FILE="$SCRIPT_DIR/storage"
TABLE="XTABLE"
PASSWORD="mystrongpassword"  # You can prompt securely instead

# Check dependencies
command -v jq >/dev/null || { echo "jq is required"; exit 1; }
command -v sqlite3 >/dev/null || { echo "sqlite3 is required"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

# Initialize SQLite DB
sqlite3 "$DB_FILE" <<EOF
CREATE TABLE IF NOT EXISTS $TABLE (
  id INTEGER PRIMARY KEY,
  userId TEXT,
  email TEXT,
  iv TEXT,
  salt TEXT,
  data TEXT
);
EOF

# Encrypt a JSON object using AES-256-CBC
encrypt_json_cbc() {
  local plaintext="$1"
  local salt iv key data_hex

  salt=$(openssl rand -hex 8)
  iv=$(openssl rand -hex 16)

  # Derive key using PBKDF2 (openssl enc handles salt internally only for file mode, so we do it manually)
  key=$(openssl enc -aes-256-cbc -pass pass:"$PASSWORD" -S "$salt" -P -md sha256 2>/dev/null | grep key | awk '{print $2}')

  # Encrypt
  echo -n "$plaintext" > tmp_input.json
  openssl enc -aes-256-cbc -K "$key" -iv "$iv" -in tmp_input.json -out tmp_encrypted.bin -nosalt 2>/dev/null
  data_hex=$(xxd -p tmp_encrypted.bin | tr -d '\n')

  echo "$iv|$salt|$data_hex"
}

# Process each JSON object
jq -c '.[]' "$JSON_FILE" | while read -r row; do
  userId=$(echo "$row" | jq -r '.userId // empty')
  email=$(echo "$row" | jq -r '.email // empty')
  if [[ -z "$userId" || -z "$email" ]]; then
    echo "⚠️ Skipping: missing userId/email"
    continue
  fi

  iv_salt_data=$(encrypt_json_cbc "$row")
  IFS='|' read -r iv salt data <<< "$iv_salt_data"

  sqlite3 "$DB_FILE" <<EOF
INSERT INTO $TABLE (userId, email, iv, salt, data)
VALUES ('$userId', '$email', '$iv', '$salt', '$data');
EOF
done

rm -f tmp_input.json tmp_encrypted.bin
echo "✅ Encrypted records stored in SQLite using AES-256-CBC"
```

# Decrypt records from SQLite
```sh
#!/bin/bash

set -e

DB_FILE="./storage"
TABLE="XTABLE"
PASSWORD="mystrongpassword"

# Check dependencies
command -v sqlite3 >/dev/null || { echo "sqlite3 is required"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

# Read and decrypt all records
sqlite3 -csv "$DB_FILE" "SELECT userId, email, iv, salt, data FROM $TABLE;" | while IFS=',' read -r userId email iv salt data; do
  key=$(openssl enc -aes-256-cbc -pass pass:"$PASSWORD" -S "$salt" -P -md sha256 2>/dev/null | grep key | awk '{print $2}')

  echo "$data" | xxd -r -p > tmp_encrypted.bin

  openssl enc -d -aes-256-cbc -K "$key" -iv "$iv" -in tmp_encrypted.bin -out tmp_output.json -nosalt 2>/dev/null

  if [ -s tmp_output.json ]; then
    echo "🔓 Decrypted record for userId=$userId"
    cat tmp_output.json
    echo ""
  else
    echo "❌ Failed to decrypt userId=$userId"
  fi
done

rm -f tmp_encrypted.bin tmp_output.json
```
