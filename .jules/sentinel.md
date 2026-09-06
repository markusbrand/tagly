## 2025-02-14 - Fix IP Spoofing via X-Forwarded-For Bypass
**Vulnerability:** IP Spoofing in Rate Limiting and Audit Logs
**Learning:** Blindly trusting `HTTP_X_FORWARDED_FOR` (such as taking the first element `.split(",")[0]`) allows attackers to spoof their IP address. In DRF, this can lead to rate limit bypasses.
**Prevention:** Use Django Rest Framework's native `NUM_PROXIES` configuration for `LoginIPThrottle` and securely parse the rightmost proxy-appended IP using `api_settings.NUM_PROXIES`.

## 2025-02-14 - Security Headers
**Vulnerability:** Missing security headers (X-Content-Type-Options, X-XSS-Protection) in Django settings.
**Learning:** Default Django settings don't always include basic security headers natively in `settings.py` unless explicitly added, making the application slightly more vulnerable to MIME sniffing and XSS.
**Prevention:** Always verify and enforce `SECURE_CONTENT_TYPE_NOSNIFF = True` and `SECURE_BROWSER_XSS_FILTER = True` when initializing `settings.py`.

## 2024-08-20 - Centralized and Enhanced IP Extraction
**Vulnerability:** Inconsistent IP extraction logic was used across the backend. While `borrowing/views.py` used `HTTP_X_FORWARDED_FOR` to identify client IPs behind proxies, critical areas like authentication logs (`users/views.py`) and audit logs (`audit/middleware.py`) only checked `REMOTE_ADDR`, potentially logging reverse proxy IPs instead of actual clients.
**Learning:** Security-critical functions like retrieving user IP addresses should be centralized and consistently applied to prevent bypassing logs or throttling mechanisms when behind proxies.
**Prevention:** Always use the centralized `get_client_ip` utility from `core/utils.py` across the application to ensure consistent IP handling. Future enhancements should consider robust proxy IP validation against trusted CIDR blocks (e.g. using `django-ipware`).

## 2024-05-25 - Prevent CSV/Excel Macro Injection
**Vulnerability:** User inputs exported to XLSX via xlsxwriter can execute macros if they start with '='.
**Learning:** xlsxwriter parses strings starting with '=' as formulas by default.
**Prevention:** Set 'strings_to_formulas': False in xlsxwriter.Workbook options.

## 2024-05-18 - Missing Authentication on QR Template Endpoints
**Vulnerability:** Unauthenticated access to GET endpoints for Sticker Templates.
**Learning:** Overriding DRF's `get_permissions` completely bypasses `DEFAULT_PERMISSION_CLASSES`. By returning `[]` for GET methods, the view was inadvertently exposed as `AllowAny`.
**Prevention:** Always ensure a fallback to `[IsAuthenticated()]` or `super().get_permissions()` when overriding `get_permissions()` for role-specific access controls.
