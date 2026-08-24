## 2025-02-14 - Fix IP Spoofing via X-Forwarded-For Bypass
**Vulnerability:** IP Spoofing in Rate Limiting and Audit Logs
**Learning:** Blindly trusting `HTTP_X_FORWARDED_FOR` (such as taking the first element `.split(",")[0]`) allows attackers to spoof their IP address. In DRF, this can lead to rate limit bypasses.
**Prevention:** Use Django Rest Framework's native `NUM_PROXIES` configuration for `LoginIPThrottle` and securely parse the rightmost proxy-appended IP using `api_settings.NUM_PROXIES`.
