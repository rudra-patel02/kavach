"use client";

import { useState } from "react";

export default function CopilotPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(
    "Hello! I am KAVACH AI Copilot. Ask me about machine health, maintenance, temperature, or plant operations."
  );

  const askAI = () => {
    const q = question.toLowerCase();

    if (q.includes("maintenance")) {
      setResponse(
        "Packaging Machine requires maintenance within 7 days. Conveyor health is reducing gradually."
      );
    } else if (q.includes("temperature")) {
      setResponse(
        "Average plant temperature is 53°C. Mixer temperature is above the recommended range."
      );
    } else if (q.includes("health")) {
      setResponse(
        "Overall plant health is 47.5%. Two machines are in warning state."
      );
    } else if (q.includes("alert")) {
      setResponse(
        "There are currently 2 active alerts. One conveyor warning and one mixer temperature alert."
      );
    } else {
      setResponse(
        "I couldn't understand your question. Try asking about maintenance, health, temperature, or alerts."
      );
    }

    setQuestion("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-2">
        AI Copilot
      </h1>

      <p className="text-slate-400 mb-8">
        Industrial Decision Intelligence Assistant
      </p>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="bg-slate-800 rounded-lg p-5 min-h-[180px]">
          <p className="text-green-400 whitespace-pre-line">
            {response}
          </p>
        </div>

        <div className="flex gap-4 mt-6">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about maintenance, health, alerts..."
            className="flex-1 bg-slate-800 rounded-lg px-4 py-3 outline-none"
          />

          <button
            onClick={askAI}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 rounded-lg font-semibold"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}