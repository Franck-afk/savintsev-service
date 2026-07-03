import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { auth } from "@/shared/config/auth";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

async function getData() {
  const messages = await prisma.message.findMany({
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
      order: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const dialogs = new Map<string, {
    participants: { id: string; name: string | null; email: string | null; role: string }[];
    order: { id: string; title: string } | null;
    messages: typeof messages;
  }>();

  for (const msg of messages) {
    const key = msg.orderId
      ? `${msg.senderId}-${msg.receiverId}-${msg.orderId}`
      : [msg.senderId, msg.receiverId].sort().join("-");

    if (!dialogs.has(key)) {
      dialogs.set(key, {
        participants: [
          { id: msg.sender.id, name: msg.sender.name, email: msg.sender.email, role: msg.sender.role },
          { id: msg.receiver.id, name: msg.receiver.name, email: msg.receiver.email, role: msg.receiver.role },
        ],
        order: msg.order,
        messages: [],
      });
    }

    dialogs.get(key)!.messages.push(msg);
  }

  return { totalMessages: messages.length, dialogs: Array.from(dialogs.values()) };
}

function formatParticipant(p: { name: string | null; email: string | null; role: string }) {
  const name = p.name || "Без имени";
  const roleLabels: Record<string, string> = { Owner: "Владелец", Master: "Мастер", Client: "Клиент" };
  return `${name} (${roleLabels[p.role] || p.role}, ${p.email || "нет email"})`;
}

function formatDialogHeader(dialog: { participants: { name: string | null; email: string | null; role: string }[]; order: { title: string } | null }) {
  const p1 = formatParticipant(dialog.participants[0]);
  const p2 = formatParticipant(dialog.participants[1]);
  const orderInfo = dialog.order ? `\n  Заказ: ${dialog.order.title}` : "";
  return `Диалог: ${p1} ↔ ${p2}${orderInfo}`;
}

function generateTxt(data: Awaited<ReturnType<typeof getData>>): string {
  const lines: string[] = [
    `Экспорт диалогов — ${new Date().toLocaleDateString("ru-RU")}`,
    `Всего сообщений: ${data.totalMessages}`,
    `Всего диалогов: ${data.dialogs.length}`,
    "=".repeat(80),
    "",
  ];

  for (const dialog of data.dialogs) {
    lines.push(formatDialogHeader(dialog));
    lines.push("-".repeat(60));

    for (const msg of dialog.messages) {
      const senderName = msg.sender.name || "Без имени";
      const time = new Date(msg.createdAt).toLocaleString("ru-RU");
      const readMark = msg.readAt ? " ✓" : "";
      lines.push(`[${time}] ${senderName}${readMark}:`);
      if (msg.content) lines.push(`  ${msg.content}`);
      const atts = msg.attachments as { name: string }[] | null;
      if (atts && atts.length > 0) {
        for (const att of atts) {
          lines.push(`  📎 ${att.name}`);
        }
      }
    }

    lines.push("");
    lines.push("=".repeat(80));
    lines.push("");
  }

  return lines.join("\n");
}

function generateXlsx(data: Awaited<ReturnType<typeof getData>>): Buffer {
  const wb = XLSX.utils.book_new();

  const mainRows: unknown[][] = [
    ["Диалог", "Участник 1", "Участник 2", "Заказ", "Всего сообщений"],
  ];

  const msgsRows: unknown[][] = [
    ["Диалог", "Отправитель", "Получатель", "Дата", "Сообщение", "Вложения", "Прочитано"],
  ];

  for (const dialog of data.dialogs) {
    const p1 = dialog.participants[0];
    const p2 = dialog.participants[1];
    const p1Label = `${p1.name || "Без имени"} (${p1.role})`;
    const p2Label = `${p2.name || "Без имени"} (${p2.role})`;
    const orderTitle = dialog.order?.title || "";

    mainRows.push([
      `${p1Label} ↔ ${p2Label}`,
      p1Label,
      p2Label,
      orderTitle,
      dialog.messages.length,
    ]);

    for (const msg of dialog.messages) {
      const atts = msg.attachments as { name: string }[] | null;
      const attNames = atts?.map((a) => a.name).join(", ") || "";
      msgsRows.push([
        `${p1Label} ↔ ${p2Label}`,
        msg.sender.name || "Без имени",
        msg.receiver.name || "Без имени",
        new Date(msg.createdAt).toLocaleString("ru-RU"),
        msg.content,
        attNames,
        msg.readAt ? "Да" : "Нет",
      ]);
    }
  }

  const mainSheet = XLSX.utils.aoa_to_sheet(mainRows);
  XLSX.utils.book_append_sheet(wb, mainSheet, "Диалоги");

  const msgsSheet = XLSX.utils.aoa_to_sheet(msgsRows);
  XLSX.utils.book_append_sheet(wb, msgsSheet, "Сообщения");

  // column widths
  mainSheet["!cols"] = [{ wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
  msgsSheet["!cols"] = [{ wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 60 }, { wch: 30 }, { wch: 10 }];

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function generatePdf(data: Awaited<ReturnType<typeof getData>>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 30, bottom: 30, left: 25, right: 25 },
      info: {
        Title: "Экспорт диалогов",
        Author: "Shinny Master",
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text("Экспорт диалогов", { align: "center" });
    doc.fontSize(10).font("Helvetica")
      .text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, { align: "center" })
      .text(`Всего сообщений: ${data.totalMessages}  •  Диалогов: ${data.dialogs.length}`, { align: "center" });
    doc.moveDown(1.5);

    const roleLabels: Record<string, string> = { Owner: "Владелец", Master: "Мастер", Client: "Клиент" };

    for (let dIdx = 0; dIdx < data.dialogs.length; dIdx++) {
      const dialog = data.dialogs[dIdx];

      doc.addPage();

      doc.font("Helvetica-Bold").fontSize(14).text(`Диалог ${dIdx + 1}`, { underline: true });
      doc.moveDown(0.3);

      for (const p of dialog.participants) {
        doc.font("Helvetica").fontSize(10)
          .text(`${p.name || "Без имени"} — ${roleLabels[p.role] || p.role} (${p.email || "нет email"})`);
      }

      if (dialog.order) {
        doc.font("Helvetica-Oblique").fontSize(10).text(`Заказ: ${dialog.order.title}`);
      }

      doc.moveDown(0.5);

      // header
      doc.font("Helvetica-Bold").fontSize(9)
        .text("Дата", 25, doc.y, { width: 55, continued: true })
        .text("Отправитель", 80, doc.y, { width: 65, continued: true })
        .text("Сообщение", 145, doc.y, { width: 340 });
      doc.moveDown(0.2);

      const pageBottom = 770;

      for (const msg of dialog.messages) {
        if (doc.y > pageBottom) {
          doc.addPage();
        }

        const dateStr = new Date(msg.createdAt).toLocaleString("ru-RU", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        });
        const senderName = msg.sender.name || "Без имени";

        doc.font("Helvetica").fontSize(8);
        const content = msg.content || (msg.attachments && (msg.attachments as unknown[]).length > 0 ? "[Вложения]" : "");

        doc.text(dateStr, 25, doc.y, { width: 55, continued: true });
        doc.text(senderName, 80, doc.y, { width: 65, continued: true });
        doc.text(content, 145, doc.y, { width: 340 });
        doc.moveDown(0.15);
      }

      doc.moveDown(0.5);
    }

    doc.end();
  });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "txt";

  const data = await getData();
  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "xlsx") {
    const buf = generateXlsx(data);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="chat-export-${dateStr}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buf = await generatePdf(data);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="chat-export-${dateStr}.pdf"`,
      },
    });
  }

  const txt = generateTxt(data);
  return new NextResponse(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="chat-export-${dateStr}.txt"`,
    },
  });
}
