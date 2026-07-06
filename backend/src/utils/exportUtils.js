const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const toCsv = (rows, columns) => {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value =
          typeof column.value === "function" ? column.value(row) : row[column.key];
        return escapeCsvValue(value);
      })
      .join(",")
  );

  return [header, ...body].join("\r\n");
};

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");

const wrapLine = (line, maxLength = 96) => {
  const words = String(line ?? "").split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) {
      continue;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
};

export const createSimplePdf = ({ lines = [], title = "KAVACH Export" }) => {
  const visibleLines = [
    title,
    `Generated at ${new Date().toISOString()}`,
    "",
    ...lines.flatMap((line) => wrapLine(line)),
  ].slice(0, 48);
  const textCommands = visibleLines
    .map((line, index) => {
      const prefix = index === 0 ? "/F1 16 Tf" : "/F1 9 Tf";
      return `${prefix} (${escapePdfText(line)}) Tj T*`;
    })
    .join("\n");
  const stream = `BT\n50 790 Td\n13 TL\n${textCommands}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};
