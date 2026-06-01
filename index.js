import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

import { BOT_NAME, PREFIX, OWNER } from "./config.js";
import { MENU } from "./commands/menu.js";
import { OWNER_INFO } from "./commands/owner.js";
import { profile } from "./commands/profile.js";

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./auth/session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {

    if (connection === "open") {

      console.log(`
╔════════════════════════╗
   🤖 ${BOT_NAME}
╚════════════════════════╝

✅ BOT CONNECTÉ
👑 Créateur : ${OWNER.name}
📞 ${OWNER.number}
`);
    }

    if (
      connection === "close" &&
      lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
    ) {
      startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(" ");
    const command = args.shift().toLowerCase();

    switch (command) {

      case "menu":
      case "help":
        await sock.sendMessage(from, {
          text: MENU
        });
        break;

      case "ping":
        await sock.sendMessage(from, {
          text: "🏓 Pong ! Bot actif."
        });
        break;

      case "owner":
        await sock.sendMessage(from, {
          text: OWNER_INFO
        });
        break;

      case "profile":
        const name =
          msg.pushName || "Utilisateur";

        await sock.sendMessage(from, {
          text: profile(name)
        });
        break;

      default:
        await sock.sendMessage(from, {
          text: `❌ Commande inconnue.\n\nTape ${PREFIX}menu`
        });
    }
  });
}

startBot();