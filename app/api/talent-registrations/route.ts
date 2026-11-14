import {NextResponse} from "next/server";
// Deliberately fails closed until Codex implements secure authenticated storage,
// server validation, anti-spam, retention, privacy and notification workflows.
export async function POST(){return NextResponse.json({error:"Submission is not enabled until the secure backend is configured."},{status:503,headers:{"Cache-Control":"no-store"}});}
