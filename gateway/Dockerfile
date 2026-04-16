FROM boky/postfix

RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    && pip3 install requests --break-system-packages \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY signature-filter.cf /tmp/signature-filter.cf
COPY main-overrides.cf   /tmp/main-overrides.cf
COPY processor.py        /processor.py

RUN chmod +x /processor.py

# Append our additions to the image's default Postfix config at startup,
# then hand off to the image's own run script.
# We do NOT replace master.cf — that would remove internal Postfix services.
CMD ["sh", "-c", "\
    cat /tmp/signature-filter.cf >> /etc/postfix/master.cf && \
    cat /tmp/main-overrides.cf   >> /etc/postfix/main.cf   && \
    postconf -e 'mynetworks = 0.0.0.0/0'                   && \
    [ -n \"$MYHOSTNAME\" ] && postconf -e \"myhostname = $MYHOSTNAME\"; \
    [ -n \"$RELAYHOST\" ]  && postconf -e \"relayhost = $RELAYHOST\"; \
    postfix start-fg"]
