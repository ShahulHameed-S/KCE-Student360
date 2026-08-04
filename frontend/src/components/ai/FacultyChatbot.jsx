import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { askFacultyAssistant } from "../../services/facultyAssistantService";
import { useAuth } from "../../hooks/useAuth";
import { MessageSquare, X, Bot, Send, ArrowRight } from "lucide-react";
import { safePercent } from "../../utils/formatters";

const getRowScore = (row) => {
  const value =
    row?.score ??
    row?.overall_score ??
    row?.overallScore ??
    row?.average_score ??
    row?.averageScore ??
    row?.percentage ??
    row?.domain_score ??
    row?.domainScore ??
    row?.readiness_score ??
    row?.readinessScore ??
    row?.placement_readiness ??
    row?.placementReadiness ??
    row?.placement_readiness_score ??
    row?.placementReadinessScore;

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const FacultyChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (user?.role === "student") {
    return null;
  }
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Welcome to KCE Faculty AI Assistant. I can help you compile ranked student lists across skills and domains.",
      type: "text"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Top 10 DSA students",
    "Top 10 Full Stack students",
    "Top 10 DBMS students",
    "Overall toppers",
    "Students for placement"
  ];

  // Auto scroll to bottom when message log changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (textToSend) => {
    const trimmed = textToSend?.trim() || inputText.trim();
    if (!trimmed) return;

    // Clear input
    setInputText("");
    setLoading(true);

    // 1. Add User Message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: trimmed,
        type: "text"
      }
    ]);

    try {
      // 2. Fetch AI Response
      const response = await askFacultyAssistant(trimmed);

      // 3. Add Assistant Message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: response.message,
          type: response.type, // 'recommendation' or 'unknown'
          students: response.students || [],
          domain: response.domain
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: "assistant",
          text: "An error occurred while communicating with the assistant engine.",
          type: "text"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#C76F2B] hover:bg-[#A8561F] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-md transition-colors duration-200 select-none cursor-pointer"
        >
          <Bot size={16} />
          <span>AI Assistant</span>
        </button>
      )}

      {/* Chat panel drawer */}
      {isOpen && (
        <div className="w-[380px] h-[540px] bg-white border border-[#D1D5DB] flex flex-col shadow-lg animate-fade-in relative">
          
          {/* Header */}
          <header className="bg-[#163941] text-white px-4 py-3 flex items-center justify-between border-b border-[#D1D5DB]">
            <div className="flex items-center space-x-2">
              <Bot size={16} className="text-[#C76F2B]" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Faculty AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#E5E5E5] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          {/* Dialog Log Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F7F7F7]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`p-3 text-xs font-semibold leading-relaxed max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-[#C76F2B] text-white rounded-none border border-[#A8561F]"
                      : "bg-white text-[#111827] border border-[#D1D5DB] rounded-none"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* If query returned student candidates */}
                  {msg.type === "recommendation" && msg.students?.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {/* Compact Table */}
                      <div className="border border-[#D1D5DB] overflow-hidden text-[10px]">
                        <table className="w-full text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-[#E5E5E5] text-[#214C55] font-extrabold uppercase border-b border-[#D1D5DB]">
                              <th className="px-2 py-1 text-center w-8">R</th>
                              <th className="px-2 py-1">Name</th>
                              <th className="px-2 py-1 text-center">Score</th>
                              <th className="px-2 py-1 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5E5] text-[#111827] font-bold">
                            {msg.students.map((student, idx) => {
                              const rank = student.rank || (idx + 1);
                              const name = student.name || student.student_name || student.studentName || "Unknown";
                              const score = getRowScore(student);
                              
                              return (
                                <tr key={student.id || idx} className="hover:bg-[#F7F7F7]">
                                  <td className="px-2 py-1 text-center text-[#6B7280]">
                                    {rank}
                                  </td>
                                  <td className="px-2 py-1 font-extrabold text-[#214C55] truncate max-w-[90px]" title={name}>
                                    {name}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    {score !== null ? safePercent(score, 1) : "N/A"}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    <Link
                                      to={`/students/${student.register_no || student.registerNo || student.id || student.student_id}`}
                                      onClick={() => setIsOpen(false)} // Close chatbot on navigate
                                      className="text-[#C76F2B] hover:text-[#A8561F] hover:underline"
                                    >
                                      View
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Open recommendations view */}
                      <Link
                        to="/recommendations"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-1.5 bg-[#F7F7F7] border border-[#D1D5DB] text-[10px] font-extrabold uppercase text-[#214C55] hover:bg-[#C76F2B] hover:text-white transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Open Recommendations Page</span>
                        <ArrowRight size={10} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Simulated delay loading spinner */}
            {loading && (
              <div className="flex items-center space-x-2 text-[#6B7280] text-xs font-bold pl-1">
                <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-[#C76F2B] rounded-full animate-spin" />
                <span>Assistant is querying records...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-white border-t border-[#D1D5DB] flex flex-wrap gap-1">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#F7F7F7] text-[#214C55] border border-[#D1D5DB] hover:bg-[#C76F2B] hover:text-white hover:border-[#C76F2B] transition-colors disabled:opacity-50 cursor-pointer rounded-none"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#D1D5DB] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask assistant, e.g. Top 5 DSA students..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs font-bold text-[#111827] bg-white border border-[#D1D5DB] focus:outline-none focus:border-[#C76F2B]"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 bg-[#C76F2B] hover:bg-[#A8561F] text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
export default FacultyChatbot;
