# ✅ Recommended Unused / Uncommon Port Ranges
| **Range** | **Description** | **Use Case** |
| --- | --- | --- |
| **49152-65535** | 🔒 **Ephemeral ports / Dynamic ports** (RFC 6335) | Ideal for temporary, local, or internal services |
| **3000-3999** | 🚧 Common for dev tools but still flexible | Node.js, Vite, dev servers, etc. |
| **10000-20000** | 🛠️ Often safe, used by some custom services | Internal-only apps, RPC, gRPC |
| **60000-60999** | 🧪 Very uncommon, low collision risk | Experimental tools, private services |

# 🚫 Avoid These Ranges
| **Range** | **Reason** |
| --- | --- |
| 0-1023 | Reserved/privileged ports (e.g., HTTP, SSH, DNS) |
| 1024-49151 | Registered ports (many are claimed by known services) |

# Very common dev servers
3000, 3001, 3333, 5000, 5173, 8081

# Internal tools
10080, 10443, 12000, 12345

# High dynamic range
54545, 60400, 65000

# Make it configurable
```
PORT=${PORT:-54545}
```
