#!/bin/sh
set -eu
# Staging signatures are refreshed before every start. Stale engines are
# refused per scan by scanCurrentPdf, even if the container stays running.
freshclam --config-file=/etc/clamav/arms-freshclam.conf --stdout
exec clamd --config-file=/etc/clamav/arms-clamd.conf
