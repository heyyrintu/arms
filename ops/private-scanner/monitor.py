#!/usr/bin/python3
"""Fail closed for the ARMS scanner only. Never reads CVs, app env or secrets."""
import datetime
import json
import socket
import subprocess
import sys

NAME = 'arms-private-clamav'
OWNER = 'arms-private-cv-scanner'


def check_version(reply, now=None):
    if not reply.endswith(b'\0') or reply.count(b'\0') != 1:
        raise ValueError('INVALID_REPLY')
    text = reply[:-1].decode('ascii')
    prefix, version, built = text.split('/', 2)
    if prefix != 'ClamAV 1.5.4' or not version.isdigit():
        raise ValueError('ENGINE_NOT_APPROVED')
    timestamp = datetime.datetime.strptime(built, '%a %b %d %H:%M:%S %Y').replace(tzinfo=datetime.timezone.utc)
    current = now or datetime.datetime.now(datetime.timezone.utc)
    age = (current - timestamp).total_seconds()
    if age < -300 or age > 48 * 3600:
        raise ValueError('SIGNATURES_STALE')
    return {'engine': '1.5.4', 'signatureVersion': int(version), 'fresh': True}


def main():
    result = subprocess.run(['docker', 'container', 'inspect', NAME], capture_output=True, timeout=5)
    if result.returncode:
        print(json.dumps({'ready': False, 'reason': 'SCANNER_ABSENT'}))
        return 1
    container = json.loads(result.stdout)[0]
    if container['Config'].get('Labels', {}).get('com.arms.owner') != OWNER:
        print(json.dumps({'ready': False, 'reason': 'UNOWNED_CONTAINER_REFUSED'}))
        return 1
    if not container['State']['Running']:
        print(json.dumps({'ready': False, 'reason': 'SCANNER_STOPPED'}))
        return 1
    try:
        host = container['HostConfig']
        if host['Memory'] != 1280 * 1024 * 1024 or host['MemorySwap'] != host['Memory'] or host['NetworkMode'] != 'none' or host['Privileged'] or not host['ReadonlyRootfs'] or host.get('PortBindings'):
            raise ValueError('UNSAFE_CONFIGURATION')
        if container['Config']['User'] != '100:101' or 'ALL' not in (host.get('CapDrop') or []):
            raise ValueError('UNSAFE_CONFIGURATION')
        mounts = [item for item in container['Mounts'] if item['Destination'] == '/run/clamav' and item.get('Name') == 'arms-private-clamav-run']
        if len(mounts) != 1:
            raise ValueError('SOCKET_VOLUME_MISSING')
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
            connection.settimeout(3)
            connection.connect(mounts[0]['Source'] + '/clamd.sock')
            connection.sendall(b'zVERSION\0')
            reply = b''
            while b'\0' not in reply:
                part = connection.recv(1024)
                if not part or len(reply) + len(part) > 1024:
                    raise ValueError('INVALID_REPLY')
                reply += part
        health = check_version(reply)
        print(json.dumps({'ready': True, **health}))
        return 0
    except Exception:
        # Only the verified ARMS-labelled container may be stopped, never restarted.
        subprocess.run(['docker', 'stop', '-t', '10', NAME], capture_output=True, timeout=15)
        print(json.dumps({'ready': False, 'reason': 'SCANNER_STOPPED_BY_HEALTH_GATE'}))
        return 1


if __name__ == '__main__':
    sys.exit(main())
