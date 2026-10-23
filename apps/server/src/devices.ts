import "./env.js";
import { DEVICES_FILE, loadDevices, saveDevices } from "./auth.js";

const [cmd, id] = process.argv.slice(2);
const devices = loadDevices();

function find(): number {
  const i = devices.findIndex((d) => d.id === id?.toUpperCase());
  if (i < 0) {
    console.error(`No device with id ${id ?? "(missing)"}. Run: npm run devices -- list`);
    process.exit(1);
  }
  return i;
}

if (cmd === "approve") {
  devices[find()].approved = true;
  saveDevices(devices);
  console.log(`Approved ${id!.toUpperCase()}`);
} else if (cmd === "revoke") {
  devices.splice(find(), 1);
  saveDevices(devices);
  console.log(`Revoked ${id!.toUpperCase()}`);
} else if (cmd === "list" || !cmd) {
  if (!devices.length) console.log("No devices.");
  for (const d of devices) {
    console.log(`${d.id}  ${d.approved ? "approved" : "PENDING "}  ${d.requestedAt}  ${d.ip}  ${d.name}`);
  }
  console.log(`\nFile: ${DEVICES_FILE}`);
} else {
  console.error("Usage: npm run devices -- [list | approve <id> | revoke <id>]");
  process.exit(1);
}
