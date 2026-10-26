#!/bin/bash
# Run once as root after reviewing this installer and the adjacent Python helper.
set -euo pipefail
cd -- "$(dirname -- "$0")"
[[ $(id -u) = 0 ]] || { echo 'Run from the aaPanel root terminal.'; exit 1; }
app=/www/wwwroot/kindsight
startup=/www/server/nodejs/vhost/scripts/kindsight_api.sh
[[ -d "$app" && ! -L "$app" && -f "$app/.env" && ! -L "$app/.env" ]]
[[ -f "$startup" && -x /www/server/nodejs/v22.22.2/bin/node ]]
[[ ! -e /etc/sudoers.d/kindsight-deploy && ! -e /etc/kindsight-deploy.json ]] || { echo 'Existing deploy setup found; refusing overwrite.'; exit 1; }
id kindsight_deploy >/dev/null
command -v visudo >/dev/null
command -v runuser >/dev/null
[[ -x /usr/bin/python3 ]]
/usr/bin/python3 -m py_compile kindsight-deploy.py
# Verify the one startup script; do not invoke aaPanel's global restart routine.
/usr/bin/python3 - "$startup" <<'PY'
import sys
from pathlib import Path
s=Path(sys.argv[1]).read_text()
import hashlib
if hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest() != '9a7de0c2692eac3ecbd27354f6cd1727c44174c3f58652f957af09d2194ab4ad':
    raise SystemExit('Startup script differs from the reviewed Kindsight script; stop for review.')
required=['export NODE_PROJECT_NAME="kindsight_api"','cd /www/wwwroot/kindsight','nohup npm run start:api','/www/server/nodejs/vhost/pids/kindsight_api.pid']
if not all(value in s for value in required) or any(value in s for value in ['chown ', 'chmod ', 'pm2 ', 'systemctl ', 'service ']):
    raise SystemExit('Unexpected startup script; review before installing.')
PY
install -d -m 700 -o kindsight_deploy -g kindsight_deploy /home/kindsight_deploy/incoming
install -d -m 755 -o root -g root /www/kindsight-deploy /www/kindsight-deploy/releases
install -d -m 700 -o root -g root /www/kindsight-deploy/backups
install -m 700 -o root -g root kindsight-deploy.py /usr/local/sbin/kindsight-deploy
/usr/bin/python3 - "$startup" <<'PY'
import hashlib,json,sys,os
from pathlib import Path
p=Path('/etc/kindsight-deploy.json')
p.write_text(json.dumps({'startup_sha256':hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()}))
os.chmod(p,0o600)
PY
# Only this argument-free, fixed-target entry point is permitted.
printf '%s\n' 'kindsight_deploy ALL=(root) NOPASSWD: /usr/local/sbin/kindsight-deploy ""' > /etc/sudoers.d/.kindsight-deploy-check
chmod 440 /etc/sudoers.d/.kindsight-deploy-check
visudo -cf /etc/sudoers.d/.kindsight-deploy-check
mv /etc/sudoers.d/.kindsight-deploy-check /etc/sudoers.d/kindsight-deploy
chown www:www "$app/.env"
chmod 600 "$app/.env"
echo 'Installed scoped Kindsight deployment helper. No application was restarted.'
