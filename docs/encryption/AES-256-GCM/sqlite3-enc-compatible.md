# Encrypt JSON rows and insert into SQLite3

```sh
#!/bin/bash

set -e

# Get directory of script and set file paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON_FILE="$SCRIPT_DIR/data.json"
DB_FILE="$SCRIPT_DIR/storage"
TABLE="XTABLE"
PASSWORD="mystrongpassword"  # Replace or use `read -s` for secure prompt

# Check dependencies
command -v jq >/dev/null || { echo "jq is required"; exit 1; }
command -v sqlite3 >/dev/null || { echo "sqlite3 is required"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

# Create the SQLite table if it doesn't exist
sqlite3 "$DB_FILE" <<EOF
CREATE TABLE IF NOT EXISTS $TABLE (
  id INTEGER PRIMARY KEY,
  userId TEXT,
  email TEXT,
  iv TEXT,
  salt TEXT,
  authTag TEXT,
  data TEXT
);
EOF

# Encryption function
encrypt_json() {
  local plaintext="$1"
  local salt iv key encrypted authTag

  salt=$(openssl rand -hex 16)
  iv=$(openssl rand -hex 12)
  key=$(openssl pkcs5 -pbkdf2 -pass pass:"$PASSWORD" -salt "$(echo -n "$salt" | xxd -r -p)" -iter 100000 -keylen 32 -digest sha512 | xxd -p)

  echo -n "$plaintext" > tmp_input.json
  openssl enc -aes-256-gcm -K "$key" -iv "$iv" -in tmp_input.json -out tmp_encrypted.bin -e -nosalt -p -a 2>/dev/null

  encrypted=$(head -c -16 tmp_encrypted.bin | xxd -p)
  authTag=$(tail -c 16 tmp_encrypted.bin | xxd -p)

  echo "$iv|$salt|$authTag|$encrypted"
}

# Loop through JSON array and insert each encrypted record
jq -c '.[]' "$JSON_FILE" | while read -r row; do
  userId=$(echo "$row" | jq -r '.userId // empty')
  email=$(echo "$row" | jq -r '.email // empty')

  iv_salt_auth_data=$(encrypt_json "$row")
  IFS='|' read -r iv salt authTag encrypted <<< "$iv_salt_auth_data"

  sqlite3 "$DB_FILE" <<EOF
INSERT INTO $TABLE (userId, email, iv, salt, authTag, data)
VALUES ('$userId', '$email', '$iv', '$salt', '$authTag', '$encrypted');
EOF
done

rm -f tmp_input.json tmp_encrypted.bin

echo "✅ Encrypted records with email and userId stored in SQLite."
```

# Decrypt records from SQLite
```sh
#!/bin/bash

set -e

DB_FILE="./storage"
TABLE="XTABLE"
PASSWORD="mystrongpassword"  # Replace or prompt

# Dependencies check
command -v sqlite3 >/dev/null || { echo "sqlite3 is required"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

# Read and decrypt all rows
sqlite3 -csv "$DB_FILE" "SELECT userId, email, iv, salt, authTag, data FROM $TABLE;" | while IFS=',' read -r userId email iv salt authTag data; do
  key=$(openssl pkcs5 -pbkdf2 -pass pass:"$PASSWORD" -salt "$(echo -n "$salt" | xxd -r -p)" -iter 100000 -keylen 32 -digest sha512 | xxd -p)

  echo -n "$data$authTag" | xxd -r -p > tmp_combined.bin

  openssl enc -d -aes-256-gcm -K "$key" -iv "$iv" -in tmp_combined.bin -nosalt -a -out tmp_output.json 2>/dev/null

  if [ -s tmp_output.json ]; then
    echo "🔓 Decrypted for userId=$userId, email=$email:"
    cat tmp_output.json
    echo ""
  else
    echo "❌ Failed to decrypt for userId=$userId"
  fi
done

rm -f tmp_combined.bin tmp_output.json
```
