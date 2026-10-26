#!/usr/bin/python3
"""Root-owned, argument-free deployment entry point for one aaPanel application."""
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import shutil
import signal
import socket
import stat
import subprocess
import sys
import time
import urllib.request
import zipfile

APP = Path('/www/wwwroot/kindsight')
STATE = Path('/www/kindsight-deploy')
INCOMING = Path('/home/kindsight_deploy/incoming')
PROJECT = 'kindsight_api'
NODE_BIN = Path('/www/server/nodejs/v22.22.2/bin')
START_SCRIPT = Path('/www/server/nodejs/vhost/scripts/kindsight_api.sh')
PID_FILE = Path('/www/server/nodejs/vhost/pids/kindsight_api.pid')
CONFIG = Path('/etc/kindsight-deploy.json')
UNITS = ('server', 'shared', 'src', 'node_modules', 'package.json', 'package-lock.json', 'dist')
FORBIDDEN = {'.env', '.git', 'node_modules', 'storage', 'deploy-artifacts'}
ALLOWED = {'server', 'shared', 'src', 'dist', 'scripts', 'deployment', 'tests', 'docs', 'public'}


def check_member(name, mode=0):
    path = PurePosixPath(name)
    parts = path.parts
    if '\\' in name or path.is_absolute() or '..' in parts or not parts or parts[0] != 'kindsight':
        raise ValueError('Unsafe archive path')
    if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
        raise ValueError('Special archive entry')
    relative = parts[1:]
    if not relative:
        return None
    if any(part in FORBIDDEN or part.startswith('.env') or part.endswith(('.local', '.sql', '.pem', '.key')) for part in relative):
        raise ValueError('Persistent data or credentials in archive')
    top = relative[0]
    if top not in ALLOWED and top not in {'PACKAGE-MANIFEST.json', 'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'vite.legacy.config.js', 'tsconfig.json', 'tsconfig.server.json'}:
        raise ValueError('Unexpected archive root')
    return Path(*relative)


def extract_verified(archive, target):
    seen = set()
    total = 0
    with zipfile.ZipFile(archive) as bundle:
        for item in bundle.infolist():
            relative = check_member(item.filename, item.external_attr >> 16)
            if relative is None:
                continue
            key = relative.as_posix()
            if key in seen:
                raise ValueError('Duplicate archive entry')
            seen.add(key)
            total += item.file_size
            if total > 256 * 1024 * 1024 or len(seen) > 5000:
                raise ValueError('Archive exceeds deployment limit')
            destination = target / relative
            if item.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open('xb') as output, bundle.open(item) as source:
                    shutil.copyfileobj(source, output)
        manifest = json.loads((target / 'PACKAGE-MANIFEST.json').read_text())
        expected = {}
        for entry in manifest['files']:
            relative = check_member('kindsight/' + entry['path'])
            if relative is None or relative.as_posix() in expected:
                raise ValueError('Invalid manifest')
            expected[relative.as_posix()] = entry['sha256']
        actual = {p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()} - {'PACKAGE-MANIFEST.json'}
        if actual != set(expected):
            raise ValueError('Manifest file set mismatch')
        for name, checksum in expected.items():
            if hashlib.sha256((target / name).read_bytes()).hexdigest() != checksum:
                raise ValueError('Manifest checksum mismatch')
        for name in ('server/index.ts', 'shared/react-content.json', 'src/scripts/data/partners.js', 'package.json', 'package-lock.json', 'dist/index.html'):
            if name not in expected:
                raise ValueError('Missing application files')
        return manifest


def scoped_process(uid, cwd, tag, expected_uid):
    return uid == expected_uid and cwd == str(APP) and tag == PROJECT


def processes():
    result = {}
    for item in Path('/proc').iterdir():
        if not item.name.isdigit():
            continue
        try:
            if item.stat().st_uid != pwd.getpwnam('www').pw_uid or os.readlink(item / 'cwd') != str(APP):
                continue
            environment = (item / 'environ').read_bytes().split(b'\0')
            tag = next((value.split(b'=', 1)[1].decode() for value in environment if value.startswith(b'NODE_PROJECT_NAME=')), '')
            if not scoped_process(item.stat().st_uid, os.readlink(item / 'cwd'), tag, pwd.getpwnam('www').pw_uid):
                raise RuntimeError('Unexpected process in Kindsight working directory')
            status = (item / 'stat').read_text().rsplit(')', 1)[1].split()
            if status[0] != 'Z':
                result[int(item.name)] = status[19]  # Linux starttime, guards PID reuse.
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return result


def stop_api():
    selected = processes()
    if not selected:
        raise RuntimeError('No verified Kindsight process; refusing activation')
    if not PID_FILE.is_file() or int(PID_FILE.read_text().strip()) not in selected:
        raise RuntimeError('aaPanel PID does not match Kindsight process')
    for sig, timeout in ((signal.SIGTERM, 8), (signal.SIGKILL, 2)):
        for pid, token in selected.items():
            if processes().get(pid) == token:
                os.kill(pid, sig)
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline and any(processes().get(pid) == token for pid, token in selected.items()):
            time.sleep(.2)
        if not any(processes().get(pid) == token for pid, token in selected.items()):
            break
    if processes():
        raise RuntimeError('Kindsight process still active or restarted by monitor')


def identity():
    account = pwd.getpwnam('www')
    def demote():
        os.initgroups('www', account.pw_gid)
        os.setgid(account.pw_gid)
        os.setuid(account.pw_uid)
    return demote


def runtime_env():
    return {'PATH': str(NODE_BIN) + ':/usr/local/bin:/usr/bin:/bin', 'HOME': pwd.getpwnam('www').pw_dir,
            'LANG': 'C.UTF-8', 'NODE_ENV': 'production'}


def ready(port=3101, attempts=40):
    for _ in range(attempts):
        try:
            with urllib.request.urlopen('http://127.0.0.1:%d/api/v1/ready' % port, timeout=2) as response:
                if response.status == 200 and json.load(response)['data']['status'] == 'ready':
                    return
        except Exception:
            pass
        time.sleep(.5)
    raise RuntimeError('Kindsight readiness check failed')


def start_api():
    if not processes():
        subprocess.run(['/bin/bash', str(START_SCRIPT)], cwd=APP, env=runtime_env(), preexec_fn=identity(),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    ready()
    if not processes() or int(PID_FILE.read_text().strip()) not in processes():
        raise RuntimeError('Started API identity does not match aaPanel PID')


def snapshot_input(name):
    source = INCOMING / name
    fd = os.open(source, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != pwd.getpwnam('kindsight_deploy').pw_uid or info.st_size > 64 * 1024 * 1024:
            raise ValueError('Invalid incoming file')
        return stream.read()



def activate_units(app, release, backup, preserved, moved):
    storage = app / 'server/storage'
    if storage.exists():
        if storage.is_symlink() or not storage.is_dir() or preserved.exists():
            raise RuntimeError('Unexpected user storage path')
        storage.rename(preserved)
    for unit in UNITS:
        (app / unit).rename(backup / unit)
        moved.append(unit)
        (release / unit).rename(app / unit)
    if preserved.exists():
        preserved.rename(app / 'server/storage')


def restore_units(app, release, backup, preserved, moved):
    current_storage = app / 'server/storage'
    if 'server' in moved and current_storage.exists() and not preserved.exists():
        current_storage.rename(preserved)
    for unit in reversed(moved):
        if (app / unit).exists():
            (app / unit).rename(release / unit)
        (backup / unit).rename(app / unit)
    if preserved.exists():
        preserved.rename(app / 'server/storage')


def main():
    if os.geteuid() != 0 or len(sys.argv) != 1:
        raise RuntimeError('This entry point accepts no arguments and requires scoped sudo')
    os.umask(0o077)
    with (STATE / 'deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        config = json.loads(CONFIG.read_text())
        if APP.is_symlink() or not APP.is_dir() or not (APP / '.env').is_file() or (APP / '.env').is_symlink():
            raise RuntimeError('Unexpected application/env path')
        if hashlib.sha256(START_SCRIPT.read_bytes()).hexdigest() != config['startup_sha256']:
            raise RuntimeError('aaPanel startup script changed; review required')
        if (STATE / 'activation.json').exists():
            raise RuntimeError('Previous activation incomplete; recovery required')
        if APP.stat().st_dev != STATE.stat().st_dev:
            raise RuntimeError('Application and staging must be on the same filesystem')
        ready(attempts=1)
        payload = snapshot_input('package.zip')
        checksum = snapshot_input('package.sha256').decode().strip()
        if not re.fullmatch('[a-f0-9]{64}', checksum) or hashlib.sha256(payload).hexdigest() != checksum:
            raise ValueError('ZIP checksum mismatch')
        release = STATE / 'releases' / (time.strftime('%Y%m%dT%H%M%S') + '-' + checksum[:12])
        release.mkdir(mode=0o755)
        archive = STATE / 'package.zip'
        archive.write_bytes(payload)
        manifest = extract_verified(archive, release)
        if not re.fullmatch('[a-f0-9]{40}', manifest.get('baseCommit', '')) or manifest.get('localChanges') or manifest.get('untrackedIncluded'):
            raise ValueError('Only clean committed GitHub releases are accepted')
        account = pwd.getpwnam('www')
        for parent, dirs, files in os.walk(release):
            os.chown(parent, account.pw_uid, account.pw_gid)
            os.chmod(parent, 0o755)
            for name in files:
                file = Path(parent) / name
                os.chown(file, account.pw_uid, account.pw_gid)
                os.chmod(file, 0o644)
        with (STATE / 'npm-install.log').open('w') as log:
            subprocess.run([str(NODE_BIN / 'npm'), 'ci', '--include=dev', '--no-audit', '--no-fund'], cwd=release,
                           env=runtime_env(), preexec_fn=identity(), stdout=log, stderr=log, check=True, timeout=240)
        for unit in UNITS:
            if not (release / unit).exists() or (release / unit).is_symlink() or (APP / unit).is_symlink():
                raise RuntimeError('Unexpected release/live unit')
        if (release / 'server/storage').exists():
            raise RuntimeError('Release must not supply user storage')
        # Preserve content-addressed assets referenced by clients from the previous version.
        old_assets = APP / 'dist/assets'
        if old_assets.is_dir():
            for old in old_assets.iterdir():
                if old.is_symlink() or not old.is_file():
                    raise RuntimeError('Unexpected static asset entry')
                new = release / 'dist/assets' / old.name
                if new.exists() and hashlib.sha256(new.read_bytes()).digest() != hashlib.sha256(old.read_bytes()).digest():
                    raise RuntimeError('Static asset hash collision')
                if not new.exists():
                    shutil.copyfile(old, new)
                    os.chown(new, account.pw_uid, account.pw_gid)
                    os.chmod(new, 0o644)
        # Preflight backend on an isolated port, with the existing env but no mutation requests.
        (release / '.env').symlink_to(APP / '.env')
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0)); port = probe.getsockname()[1]
        env = runtime_env(); env['API_PORT'] = str(port)
        with (STATE / 'preflight.log').open('w') as log:
            child = subprocess.Popen([str(NODE_BIN / 'node'), '--import', 'tsx', 'server/index.ts'],
                                     cwd=release, env=env, preexec_fn=identity(), start_new_session=True, stdout=log, stderr=log)
            try:
                ready(port)
            finally:
                child.terminate()
                try: child.wait(timeout=6)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait(timeout=3)
        # Database schema changes need a separate reviewed rollout.
        old_migrations = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (APP / 'server/db/migrations').glob('*.js')}
        new_migrations = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (release / 'server/db/migrations').glob('*.js')}
        if old_migrations != new_migrations:
            raise RuntimeError('Database migrations differ; manual reviewed rollout required')
        backup = STATE / 'backups' / release.name
        backup.mkdir(mode=0o700)
        journal = STATE / 'activation.json'
        journal.write_text(json.dumps({'release': release.name, 'commit': manifest['baseCommit']}))
        storage = APP / 'server/storage'
        preserved = STATE / 'preserved-storage'
        moved = []
        stopped = False
        try:
            stop_api(); stopped = True
            activate_units(APP, release, backup, preserved, moved)
            start_api()
            with urllib.request.urlopen('https://kindsight.owwteam.dev/api/v1/ready', timeout=10) as response:
                if json.load(response)['data']['status'] != 'ready':
                    raise RuntimeError('Public API readiness failed')
            with urllib.request.urlopen('https://kindsight.owwteam.dev/?deploy=' + manifest['baseCommit'], timeout=10) as response:
                if hashlib.sha256(response.read()).digest() != hashlib.sha256((APP / 'dist/index.html').read_bytes()).digest():
                    raise RuntimeError('Public frontend does not match the deployed release')
            print('DEPLOYED ' + manifest['baseCommit'], flush=True)
            journal.unlink()
        except Exception:
            if stopped:
                if processes():
                    stop_api()
                restore_units(APP, release, backup, preserved, moved)
                start_api()
                journal.unlink()
                print('ROLLED BACK: previous Kindsight version restored', flush=True)
            raise


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Deployment stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
