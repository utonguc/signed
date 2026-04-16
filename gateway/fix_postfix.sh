#!/bin/sh

echo "[1] FIX master.cf"
cat <<EOC > /etc/postfix/master.cf
smtp      inet  n       -       n       -       -       smtpd

signature-filter unix  -       n       n       -       -       pipe
  flags=Rq user=root argv=/usr/bin/python3 /processor.py
EOC

echo "[2] FIX main.cf"
cat <<EOC > /etc/postfix/main.cf
myhostname = signature.local
inet_interfaces = all
inet_protocols = ipv4

mynetworks = 0.0.0.0/0
smtpd_recipient_restrictions = permit_mynetworks,reject

content_filter = signature-filter:
EOC

echo "[3] START POSTFIX"
postfix stop 2>/dev/null
postfix start

echo "[DONE]"
