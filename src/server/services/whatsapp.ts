import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason,
  type WASocket
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";

let globalSocket: WASocket | null = null;

export async function getWhatsAppSocket(): Promise<WASocket> {
  if (globalSocket) {
    return globalSocket;
  }

  // Persists session configuration outside rebuild boundaries using Docker Volume mapping
  const authPath = path.join(process.cwd(), "whatsapp-auth-state");
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = 
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("[WhatsApp] Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        globalSocket = null;
        void getWhatsAppSocket();
      }
    } else if (connection === "open") {
      console.log("[WhatsApp] Socket connection established successfully!");
    }
  });

  globalSocket = sock;
  return sock;
}

export async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const sock = await getWhatsAppSocket();
    
    // Clean up input number
    let formattedNumber = to.replace(/[^\d]/g, "");
    if (formattedNumber.startsWith("0") && formattedNumber.length === 11) {
      // Default to Nigerian international format (+234) if starts with 0 and length is 11
      formattedNumber = `234${formattedNumber.slice(1)}`;
    }
    
    const jid = `${formattedNumber}@s.whatsapp.net`;
    console.log(`[WhatsApp] Sending invitation message to: ${jid}`);
    await sock.sendMessage(jid, { text });
    console.log(`[WhatsApp] Message successfully dispatched to: ${jid}`);
  } catch (err) {
    console.error("[WhatsApp] Error sending message:", err);
  }
}
