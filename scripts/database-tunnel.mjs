import {spawn} from "node:child_process";
import {homedir} from "node:os";
import {accessSync,constants} from "node:fs";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
try {
  const url=new URL(process.env.DATABASE_URL);
  if(!["postgres:","postgresql:"].includes(url.protocol)) throw new Error();
  const user=process.env.DATABASE_SSH_USER||"ubuntu";
  if(!/^[a-z_][a-z0-9_-]*$/i.test(user)) throw new Error();
  const key=process.env.DATABASE_SSH_KEY_PATH||`${homedir()}/.ssh/arms-lightsail-ap-south-1.pem`;
  accessSync(key,constants.R_OK);
  const remotePort=url.port||"5432";
  const ssh=spawn("ssh",["-F","/dev/null","-N","-i",key,"-o","IdentitiesOnly=yes","-o","BatchMode=yes","-o","StrictHostKeyChecking=yes","-o","ExitOnForwardFailure=yes","-o","ConnectTimeout=10","-o","ServerAliveInterval=30","-o","ServerAliveCountMax=3","-L",`127.0.0.1:15499:127.0.0.1:${remotePort}`,"--",`${user}@${url.hostname}`],{stdio:"inherit"});
  console.log("Starting local-only database SSH forwarding on port 15499. Run npm run check:database:tunnel in another terminal. Keep this process running; Ctrl+C closes the tunnel.");
  ssh.on("error",()=>{console.error("Unable to start SSH forwarding.");process.exitCode=1;});
  ssh.on("exit",code=>{process.exitCode=code??1;});
  for(const signal of ["SIGINT","SIGTERM"]) process.on(signal,()=>ssh.kill(signal));
} catch {
  console.error("SSH forwarding needs a valid DATABASE_URL and a readable private key. Check the ignored environment settings; no credentials were displayed.");
  process.exitCode=1;
}
