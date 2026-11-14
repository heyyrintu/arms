import nextEnv from '@next/env';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const action=process.argv[2]||'--plan';
if(!['--plan','--install-trial','--status','--stop','--enable-maintenance'].includes(action)||process.argv.length>3)throw new Error('Invalid scanner action');
if(action==='--plan'){
 console.log(JSON.stringify({host:'approved Ubuntu-1',engine:'official ClamAV 1.5.4 image, digest pinned',memoryMiB:1280,swapAllowed:false,cpus:.5,publicPorts:0,scannerNetwork:'none',signatureTesting:true,updatesRunSeparately:true,automaticRestart:false,realCollection:false}));process.exit(0);
}
const url=new URL(process.env.DATABASE_URL),user=process.env.DATABASE_SSH_USER||'ubuntu';
if(!/^[a-z_][a-z0-9_-]*$/.test(user))throw new Error('Invalid SSH identity');
let script='set -eu\n';
if(action==='--install-trial') {
 script+='sudo -n install -d -m 0755 /opt/arms/private-scanner\n';
 for(const name of ['clamd.conf','freshclam.conf','refresh-and-start.sh']) {
  const value=(await readFile(new URL('../ops/private-scanner/'+name,import.meta.url))).toString('base64');
  script+=`printf '%s' '${value}' | base64 -d | sudo -n tee /opt/arms/private-scanner/${name} >/dev/null\n`;
 }
 script+='sudo -n chmod 0755 /opt/arms/private-scanner/refresh-and-start.sh\nsudo -n /opt/arms/private-scanner/refresh-and-start.sh\n';
} else if(action==='--enable-maintenance') {
 for(const name of ['monitor.py','arms-private-clamav-refresh.service','arms-private-clamav-refresh.timer','arms-private-clamav-monitor.service','arms-private-clamav-monitor.timer']) {
  const value=(await readFile(new URL('../ops/private-scanner/'+name,import.meta.url))).toString('base64');
  const destination=name==='monitor.py'?'/opt/arms/private-scanner/'+name:'/etc/systemd/system/'+name;
  script+=`printf '%s' '${value}' | base64 -d | sudo -n tee ${destination} >/dev/null\n`;
 }
 script+='sudo -n chmod 0644 /opt/arms/private-scanner/monitor.py\nsudo -n python3 /opt/arms/private-scanner/monitor.py\nsudo -n systemctl daemon-reload\nsudo -n systemctl enable --now arms-private-clamav-refresh.timer arms-private-clamav-monitor.timer\nsudo -n systemctl list-timers arms-private-clamav-refresh.timer arms-private-clamav-monitor.timer --no-pager\n';
} else if(action==='--status') {
 script+=`free -m
sudo -n docker ps -a --filter label=com.arms.owner=arms-private-cv-scanner --format '{{.Names}} | {{.Status}}'
for name in arms-private-clamav arms-private-clamav-update; do
 if sudo -n docker container inspect "$name" >/dev/null 2>&1; then
  sudo -n docker container inspect "$name" --format '{{.Name}} | running={{.State.Running}} oom={{.State.OOMKilled}} exit={{.State.ExitCode}} memory={{.HostConfig.Memory}} swapLimit={{.HostConfig.MemorySwap}} network={{.HostConfig.NetworkMode}}'
  sudo -n docker logs --tail 12 "$name"
 fi
done
`;
} else {
 script+='sudo -n systemctl disable --now arms-private-clamav-refresh.timer arms-private-clamav-monitor.timer 2>/dev/null || true\n';
 script+=`for name in arms-private-clamav arms-private-clamav-update; do
 if sudo -n docker container inspect "$name" >/dev/null 2>&1; then
  test "$(sudo -n docker container inspect -f '{{index .Config.Labels "com.arms.owner"}}' "$name")" = arms-private-cv-scanner
  sudo -n docker stop -t 10 "$name"
 fi
done
`;
}
const child=spawn('ssh',['-F','/dev/null','-T','-i',process.env.DATABASE_SSH_KEY_PATH||homedir()+'/.ssh/arms-lightsail-ap-south-1.pem','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','--',user+'@'+url.hostname,'sh','-s'],{stdio:['pipe','inherit','inherit']});
child.stdin.end(script);child.stdin.on('error',()=>{});
child.on('error',()=>{console.error('Private scanner operation unavailable.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
