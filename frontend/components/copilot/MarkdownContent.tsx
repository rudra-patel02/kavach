"use client";

interface MarkdownContentProps {
  content: string;
}

const keywordSet = new Set([
  "async",
  "await",
  "catch",
  "class",
  "const",
  "else",
  "export",
  "for",
  "from",
  "function",
  "if",
  "import",
  "interface",
  "let",
  "return",
  "try",
  "type",
  "var",
  "while",
]);

const renderInline = (text: string) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-slate-950 px-1.5 py-0.5 text-cyan-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

const highlightCode = (code: string) =>
  code.split(/(\b[A-Za-z_][A-Za-z0-9_]*\b)/g).map((part, index) =>
    keywordSet.has(part) ? (
      <span key={`${part}-${index}`} className="text-fuchsia-300">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = content.split(/```/g);

  return (
    <div className="space-y-3 text-sm leading-6 md:text-[15px]">
      {blocks.map((block, blockIndex) => {
        if (blockIndex % 2 === 1) {
          const [languageLine, ...codeLines] = block.split("\n");
          const language = languageLine.trim();
          const code = codeLines.join("\n").trimEnd();

          return (
            <pre
              key={`code-${blockIndex}`}
              className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-200"
            >
              {language ? (
                <span className="mb-2 block text-[11px] font-bold uppercase text-cyan-300">
                  {language}
                </span>
              ) : null}
              <code>{highlightCode(code)}</code>
            </pre>
          );
        }

        return block
          .split("\n")
          .map((line) => line.trimEnd())
          .filter((line) => line.length > 0)
          .map((line, lineIndex) => {
            const key = `line-${blockIndex}-${lineIndex}`;

            if (line.startsWith("### ")) {
              return (
                <h3 key={key} className="text-base font-bold text-white">
                  {renderInline(line.slice(4))}
                </h3>
              );
            }

            if (line.startsWith("## ")) {
              return (
                <h2 key={key} className="text-lg font-bold text-white">
                  {renderInline(line.slice(3))}
                </h2>
              );
            }

            if (/^[-*]\s+/.test(line)) {
              return (
                <p key={key} className="flex gap-2 text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  <span>{renderInline(line.replace(/^[-*]\s+/, ""))}</span>
                </p>
              );
            }

            if (/^\d+\.\s+/.test(line)) {
              return (
                <p key={key} className="pl-4 text-slate-200">
                  {renderInline(line)}
                </p>
              );
            }

            return (
              <p key={key} className="whitespace-pre-wrap text-slate-200">
                {renderInline(line)}
              </p>
            );
          });
      })}
    </div>
  );
}
