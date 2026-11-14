import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('host monitor fails closed for stale/unsafe scanner and never stops an unowned container',()=>{
 const code=String.raw`
import datetime,json,types
from pathlib import Path
ns={'__name__':'private_monitor_test'}
exec(compile(Path('ops/private-scanner/monitor.py').read_text(),'monitor.py','exec'),ns)
now=datetime.datetime(2026,11,15,tzinfo=datetime.timezone.utc)
assert ns['check_version'](b'ClamAV 1.5.4/28183/Sat Nov 14 06:24:17 2026\0'.replace(b'\\0',bytes([0])),now)['fresh']
for value in [b'bad',b'ClamAV 1.5.4/28177/Sun Nov  8 06:23:52 2026\0'.replace(b'\\0',bytes([0]))]:
 try: ns['check_version'](value,now)
 except ValueError: pass
 else: raise AssertionError('unsafe version accepted')
container={'Config':{'Labels':{'com.arms.owner':'someone-else'},'User':'100:101'},'State':{'Running':True},'HostConfig':{'Memory':1342177280,'MemorySwap':1342177280,'NetworkMode':'none','Privileged':False,'ReadonlyRootfs':True,'PortBindings':{},'CapDrop':['ALL']},'Mounts':[]}
calls=[]
def run(args,**kwargs):
 calls.append(args)
 return types.SimpleNamespace(returncode=0,stdout=json.dumps([container]).encode())
ns['subprocess']=types.SimpleNamespace(run=run)
assert ns['main']()==1
assert len(calls)==1
container['Config']['Labels']['com.arms.owner']='arms-private-cv-scanner'
container['HostConfig']['NetworkMode']='host'
calls.clear()
assert ns['main']()==1
assert calls[-1]==['docker','stop','-t','10','arms-private-clamav']
print('Monitor permission and fail-closed checks passed')
`;
 const result=spawnSync('python3',['-c',code],{encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/checks passed/);
});
