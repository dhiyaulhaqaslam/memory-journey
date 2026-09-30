import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";

const root = resolve(import.meta.dirname);
const dataDir = resolve(process.env.DATA_DIR || join(root, "data", "journeys"));
const port = Number(process.env.PORT || 3000);
const maxBody = 20 * 1024 * 1024;
const imagePattern = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
const mime = {
   ".html": "text/html; charset=utf-8",
   ".js": "text/javascript; charset=utf-8",
   ".css": "text/css; charset=utf-8",
   ".svg": "image/svg+xml",
   ".png": "image/png",
   ".jpg": "image/jpeg",
   ".webp": "image/webp",
   ".ico": "image/x-icon",
};

function sendJson(res, status, value) {
   res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
   });
   res.end(JSON.stringify(value));
}

function cleanJourney(input) {
   if (
      !input ||
      typeof input !== "object" ||
      typeof input.recipient !== "string" ||
      !Array.isArray(input.memories) ||
      input.memories.length !== 3
   )
      throw new Error("Isi cerita belum lengkap.");
   const recipient = input.recipient.trim();
   if (!recipient || recipient.length > 80)
      throw new Error("Nama penerima tidak valid.");
   const memories = input.memories.map((memory) => {
      if (
         !memory ||
         typeof memory.title !== "string" ||
         !Array.isArray(memory.moments) ||
         memory.moments.length < 1 ||
         memory.moments.length > 3
      )
         throw new Error("Setiap memori perlu 1–3 momen.");
      const title = memory.title.trim();
      if (!title || title.length > 100)
         throw new Error("Judul memori tidak valid.");
      const moments = memory.moments.map((moment) => {
         if (
            !moment ||
            typeof moment.description !== "string" ||
            typeof moment.image !== "string"
         )
            throw new Error("Foto dan cerita harus diisi.");
         const description = moment.description.trim();
         if (
            !description ||
            description.length > 1200 ||
            !imagePattern.test(moment.image) ||
            moment.image.length > 2_500_000
         )
            throw new Error("Foto atau cerita tidak valid.");
         return { description, image: moment.image };
      });
      return { title, moments };
   });
   return { recipient, memories };
}

async function readBody(req) {
   let size = 0;
   const chunks = [];
   for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBody) {
         const error = new Error(
            "Ukuran cerita terlalu besar. Coba gunakan foto yang lebih kecil.",
         );
         error.status = 413;
         throw error;
      }
      chunks.push(chunk);
   }
   return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

await mkdir(dataDir, { recursive: true });
const development =
   process.env.NODE_ENV !== "production" &&
   !process.argv.includes("--production");
const vite = development
   ? await (
        await import("vite")
     ).createServer({ root, server: { middlewareMode: true }, appType: "spa" })
   : null;

async function servePage(req, res) {
   if (vite) {
      vite.middlewares(req, res, async () => {
         try {
            const html = await readFile(join(root, "index.html"), "utf8");
            res.writeHead(200, { "Content-Type": mime[".html"] });
            res.end(await vite.transformIndexHtml(req.url, html));
         } catch {
            res.writeHead(500);
            res.end("Failed to load page");
         }
      });
      return;
   }
   const pathname = new URL(req.url, "http://localhost").pathname;
   const file = pathname.startsWith("/assets/")
      ? resolve(root, "dist", pathname.slice(1))
      : resolve(root, "dist", "index.html");
   if (!file.startsWith(resolve(root, "dist") + sep)) {
      res.writeHead(404);
      res.end();
      return;
   }
   try {
      const content = await readFile(file);
      res.writeHead(200, {
         "Content-Type": mime[extname(file)] || "application/octet-stream",
         "X-Content-Type-Options": "nosniff",
      });
      res.end(content);
   } catch {
      res.writeHead(404);
      res.end("Not found");
   }
}

createServer(async (req, res) => {
   const pathname = new URL(req.url, "http://localhost").pathname;
   if (pathname === "/api/journeys" && req.method === "POST") {
      try {
         const journey = cleanJourney(await readBody(req));
         const id = randomUUID();
         await writeFile(join(dataDir, `${id}.json`), JSON.stringify(journey), {
            flag: "wx",
         });
         sendJson(res, 201, { id });
      } catch (error) {
         sendJson(
            res,
            error.status || (error instanceof SyntaxError ? 400 : 422),
            { error: error.message || "Cerita tidak dapat disimpan." },
         );
      }
      return;
   }
   const match = pathname.match(/^\/api\/journeys\/([a-f0-9-]{36})$/);
   if (match && req.method === "GET") {
      try {
         const journey = await readFile(
            join(dataDir, `${match[1]}.json`),
            "utf8",
         );
         res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
         });
         res.end(journey);
      } catch {
         sendJson(res, 404, { error: "Cerita tidak ditemukan." });
      }
      return;
   }
   if (pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "Halaman tidak ditemukan." });
      return;
   }
   if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
   }
   await servePage(req, res);
}).listen(port, "0.0.0.0", () =>
   console.log(`Memory Journey ready on http://localhost:${port}`),
);
