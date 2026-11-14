# Private scanner on Ubuntu-1 — owner-approved bounded hosting

On 15 November 2026, after the RAM/headroom concern was explained, the owner directed: “for now host it there.” This supersedes the earlier host-selection blocker. The scanner is now installed and running on the existing Lightsail VPS. The website and real CV intake are not deployed/enabled by this auxiliary service setup.

## Actual installation

- Official `clamav/clamav` stable image resolved and pinned to amd64 digest `sha256:2a9be29239aea6c6fe17da9625f3c192f91974e61059d364e293f20277f931a3`, reporting engine **1.5.4**. [Official image guidance](https://docs.clamav.net/manual/Installing/Docker.html).
- `arms-private-clamav` runs as verified image identity UID 100 / GID 101, with all capabilities dropped, no-new-privileges, read-only root and private temporary memory storage. It has **no network and no published ports**. It receives no bucket/database/SES credentials and mounts no other application data.
- Hard RAM limit **1280 MiB**, memory-plus-swap limit equal to RAM (no container swap allowance), CPU quota **0.5**, PID limit 64 and high OOM kill preference. Docker restart policy is `no`; failures do not create a rapid restart loop.
- Named labelled volumes contain public signatures and private Unix IPC only. Socket `/run/clamav/clamd.sock` uses mode 660, parent 770; worker access requires the approved group. The unprivileged synthetic check successfully used supplementary GID 101. No world-accessible socket or TCP listener.
- Files under `/opt/arms/private-scanner` and only the `arms-private-clamav-*` systemd units are managed. Commands refuse unowned containers/volumes and touch no other service. No server resize, purchase, database migration, app deployment or firewall change occurred.

## Resource behavior and maintenance

`refresh-and-start.sh` stops only the owned scanner before updating. It requires at least 1700 MiB available before attempting the bounded updater/start. The updater has outbound access for official signature updates, but no CVs, scanner socket, host application data or application credentials. It runs under the same RAM/CPU cap; the scanner and updater never run together. Full standard signatures, TLS/signature validation and `TestDatabases yes` remain enabled. No signature sets or security checks were removed to fit RAM.

`ConcurrentDatabaseReload no` avoids parallel engines; scanning pauses during maintenance and clients must fail closed. `clamd.conf` retains PDF scanning, encrypted/limit alerts, 5 MiB input and bounded extracted work. Engine time-limit coverage is version-specific; the application also has a bounded request deadline. Config follows the [official sample](https://github.com/Cisco-Talos/clamav/blob/main/etc/clamd.conf.sample).

The six-hour refresh timer and five-minute monitor timer are enabled, including boot scheduling. First activation completed successfully; next scheduled times were observed. `monitor.py` checks the owner label, resource/network/read-only settings, engine version and a signature build age no greater than 48 hours. It stops only the verified owned scanner if stale/unsafe/unresponsive; it never restarts other services. Monitor and updater share a lock, so expected maintenance is not mistaken for failure. An intentional `--stop` disables both timers as well as stopping the owned containers.

The application-side `scanCurrentPdf` wrapper checks PING and signature freshness before scanning, covering stale running engines even between host monitor checks. It is prepared for the future real worker; public upload/file linkage is still disabled. No real applicant document was scanned.

Observed after startup: scanner **947 MiB / 1.25 GiB**, host approximately **1140 MiB available**, no scanner OOM event. The original host has 3832 MiB total and existing shared workloads/swap. The [general ClamAV recommendation remains 3–4 GiB](https://docs.clamav.net/); passing this bounded trial is not sustained-load, concurrency, memory-pressure or production-capacity approval. The daemon may stop if capacity drops or limits are exceeded, and CV intake must remain unavailable in that case. No automatic increase of its cap is implemented.

## Evidence and operator commands

Real private engine tests passed with fresh daily signature version 28183 built 14 November 2026: benign synthetic PDF accepted; standard harmless EICAR test rejected; oversized input and missing socket refused. Checks passed again after the first maintenance activation. No malware sample, real CV, applicant record, external recipient or public endpoint was involved.

```sh
npm run scanner:plan
npm run scanner:status
npm run check:scanner:instance -- --synthetic
# Intentionally stop scanner and disable its maintenance timers:
node scripts/private-scanner.mjs --stop
```

The explicit operator tool also supports `--install-trial` and `--enable-maintenance` for the already approved same-host resources; it is not an app deployment command. Review resource/identity/image constraints before later changes. Updating the pinned engine requires coordinated config/monitor/readiness review; the updater refreshes signatures, not the engine image.

Outstanding: actual app/worker socket integration, bounded multipart upload linkage and job/application transaction coordination, sustained capacity/failure tests, notification delivery/alerting and applicant acknowledgements, retention/rights/backups, owner/legal privacy approval and every docs/10 website launch gate. The Docker timer health journal is not a staffed incident notification process.
