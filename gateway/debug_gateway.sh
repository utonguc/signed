#!/bin/sh

echo "[1] POSTFIX LOG LOCATION CHECK"

ls -la /var/log || true
ls -la /var/log/mail* || true

echo ""
echo "[2] ENABLE POSTFIX DEBUG LOGGING"

postconf -e "debug_peer_level=3"
postconf -e "debug_peer_list=0.0.0.0/0"
postconf -e "maillog_file=/var/log/mail.log"

echo ""
echo "[3] RESTART POSTFIX"

postfix stop || true
postfix start

echo ""
echo "[4] SHOW LIVE LOG (if exists)"

sleep 2
tail -n 50 /var/log/mail.log 2>/dev/null || echo "NO MAIL LOG FILE FOUND"

echo ""
echo "[DONE]"
