#!/bin/sh
# Only manages ARMS-owned scanner containers and volumes. No app restart/ports.
set -eu
exec 9>/var/lock/arms-private-clamav.lock
flock -n 9 || exit 0
image=clamav/clamav@sha256:2a9be29239aea6c6fe17da9625f3c192f91974e61059d364e293f20277f931a3
base=/opt/arms/private-scanner
owner=arms-private-cv-scanner
scanner=arms-private-clamav
updater=arms-private-clamav-update
owned_container() {
 if docker container inspect "$1" >/dev/null 2>&1; then
  test "$(docker container inspect -f '{{index .Config.Labels "com.arms.owner"}}' "$1")" = "$owner" || { echo 'Refusing unowned container'; exit 1; }
 fi
}
owned_volume() {
 if docker volume inspect "$1" >/dev/null 2>&1; then
  test "$(docker volume inspect -f '{{index .Labels "com.arms.owner"}}' "$1")" = "$owner" || { echo 'Refusing unowned volume'; exit 1; }
 else
  docker volume create --label "com.arms.owner=$owner" "$1" >/dev/null
 fi
}
for name in "$scanner" "$updater"; do
 owned_container "$name"
 if docker container inspect "$name" >/dev/null 2>&1; then docker stop -t 10 "$name" >/dev/null || true; docker rm "$name" >/dev/null; fi
done
available=$(awk '/MemAvailable:/{print int($2/1024)}' /proc/meminfo)
if [ "$available" -lt 1700 ]; then echo 'Scanner stopped: insufficient safe RAM headroom'; exit 1; fi
owned_volume arms-private-clamav-db
owned_volume arms-private-clamav-run
docker image inspect "$image" >/dev/null
# These named volumes contain only public signatures and scanner IPC.
docker run --rm --network none --read-only --cap-drop ALL --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE --security-opt no-new-privileges --memory 192m --memory-swap 192m --cpus .5 --pids-limit 32 --mount source=arms-private-clamav-db,target=/var/lib/clamav --mount source=arms-private-clamav-run,target=/run/clamav --entrypoint sh "$image" -c 'chown -R 100:101 /var/lib/clamav /run/clamav; chmod 0770 /run/clamav'
# Stop the daemon for updates; keep engine verification and all signature sets.
# The updater has outbound network, but no CV files, socket or app credentials.
if ! timeout --signal=TERM --kill-after=10s 300 docker run --name "$updater" --label "com.arms.owner=$owner" --read-only --user 100:101 --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 --memory 1280m --memory-swap 1280m --cpus .5 --oom-score-adj 1000 --tmpfs /tmp:rw,noexec,nosuid,size=64m,uid=100,gid=101,mode=700 --mount source=arms-private-clamav-db,target=/var/lib/clamav --mount "type=bind,source=$base/freshclam.conf,target=/etc/clamav/freshclam.conf,readonly" --entrypoint freshclam "$image" --foreground --stdout --config-file=/etc/clamav/freshclam.conf; then
 docker stop -t 5 "$updater" >/dev/null 2>&1 || true
 echo 'Signature update failed; scanner remains stopped'
 exit 1
fi
docker rm "$updater" >/dev/null
# Engine has no network, published ports, host app data or bucket credentials.
docker run -d --name "$scanner" --label "com.arms.owner=$owner" --restart no --network none --read-only --user 100:101 --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 --memory 1280m --memory-swap 1280m --cpus .5 --oom-score-adj 1000 --tmpfs /tmp:rw,noexec,nosuid,size=64m,uid=100,gid=101,mode=700 --mount source=arms-private-clamav-db,target=/var/lib/clamav,readonly --mount source=arms-private-clamav-run,target=/run/clamav --mount "type=bind,source=$base/clamd.conf,target=/etc/clamav/clamd.conf,readonly" --no-healthcheck --entrypoint clamd "$image" --config-file=/etc/clamav/clamd.conf >/dev/null
attempt=0
while [ "$attempt" -lt 60 ]; do
 if [ "$(docker inspect -f '{{.State.Running}}' "$scanner")" != true ]; then echo 'Scanner failed to start'; exit 1; fi
 if docker exec "$scanner" clamdscan --config-file=/etc/clamav/clamd.conf --ping=1 >/dev/null 2>&1; then echo 'Scanner is responding on private socket'; exit 0; fi
 attempt=$((attempt+1))
 sleep 2
done
docker stop -t 10 "$scanner" >/dev/null
echo 'Scanner startup timed out; scanner stopped'
exit 1
