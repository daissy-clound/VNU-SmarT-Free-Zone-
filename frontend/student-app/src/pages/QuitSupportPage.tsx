import React, { useEffect, useState } from "react";
import { platform } from "../platform";

export function QuitSupportPage() {
  const [activeSubTab, setActiveSubTab] = useState<"craving" | "plan" | "fagerstrom" | "chat">("craving");

  // Craving 4D State
  const [cravingActive, setCravingActive] = useState<boolean>(false);
  const [cravingSeconds, setCravingSeconds] = useState<number>(180); // 3 phút
  const [breathingPhase, setBreathingPhase] = useState<"Hít vào (4s)" | "Giữ hơi (7s)" | "Thở ra chậm (8s)">("Hít vào (4s)");

  // Fagerstrom State
  const [fAnswers, setFAnswers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [fScore, setFScore] = useState<number | null>(null);

  // Quit Plan State
  const [plan, setPlan] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [cigsPerDay, setCigsPerDay] = useState<number>(10);
  const [costPerPack, setCostPerPack] = useState<number>(30000);
  const [reason, setReason] = useState<string>("Bảo vệ sức khoẻ bản thân & gia đình");

  // Chatbot State
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    {
      sender: "bot",
      text: "Xin chào bạn! Mình là Trợ lý Đồng hành Cai thuốc lá. Bạn đang cảm thấy thế nào hôm nay? Có cơn thèm thuốc nào xuất hiện không?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");

  useEffect(() => {
    const saved = platform.getQuitPlan();
    if (saved) {
      setPlan(saved);
      setStartDate(saved.startDate);
      setCigsPerDay(saved.cigsPerDay);
      setCostPerPack(saved.costPerPack);
    }
  }, []);

  // Craving Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (cravingActive && cravingSeconds > 0) {
      interval = setInterval(() => {
        setCravingSeconds((prev) => {
          const next = prev - 1;
          const cycle = (180 - next) % 19;
          if (cycle < 4) setBreathingPhase("Hít vào (4s)");
          else if (cycle < 11) setBreathingPhase("Giữ hơi (7s)");
          else setBreathingPhase("Thở ra chậm (8s)");
          return next;
        });
      }, 1000);
    } else if (cravingSeconds === 0) {
      setCravingActive(false);
    }
    return () => clearInterval(interval);
  }, [cravingActive, cravingSeconds]);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan = {
      startDate: startDate || new Date().toISOString().split("T")[0],
      cigsPerDay: Number(cigsPerDay) || 10,
      costPerPack: Number(costPerPack) || 30000,
      reason,
      created_at: new Date().toISOString(),
    };
    platform.saveQuitPlan(newPlan);
    setPlan(newPlan);
  };

  const handleCalculateFagerstrom = () => {
    const total = fAnswers.reduce((a, b) => a + b, 0);
    setFScore(total);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const newMsgList: { sender: "user" | "bot"; text: string }[] = [...messages, { sender: "user", text: userText }];
    setMessages(newMsgList);
    setInputMessage("");

    // Giả lập bot phản hồi đồng cảm theo khoa học
    setTimeout(() => {
      let reply = "Cơn thèm thuốc thường chỉ đạt đỉnh trong vòng 3 đến 5 phút rồi sẽ giảm dần. Bạn hãy thử uống ngay 1 cốc nước lọc lớn hoặc rửa mặt bằng nước mát nhé!";
      const lower = userText.toLowerCase();
      if (lower.includes("thèm") || lower.includes("nhớ")) {
        reply = "Cảm giác thèm thuốc là dấu hiệu cơ thể bạn đang tự thải độc nicotine ra ngoài. Hãy bấm vào nút 'Cấp cứu Cơn thèm' ở trên và thở theo nhịp 4-7-8 cùng mình nhé!";
      } else if (lower.includes("nản") || lower.includes("khó") || lower.includes("mệt")) {
        reply = "Cai thuốc là một hành trình cần sự kiên nhẫn với chính mình. Mỗi điếu thuốc bạn từ chối hôm nay đã giúp phổi bạn có cơ hội phục hồi thêm một chút rồi. Cố lên nhé!";
      } else if (lower.includes("bác sĩ") || lower.includes("tổng đài") || lower.includes("tư vấn")) {
        reply = "Bạn có thể gọi ngay Tổng đài Quốc gia Tư vấn Cai thuốc lá miễn cước 1800 6606 (từ 8h - 22h hàng ngày) hoặc liên hệ Trạm Y tế ĐHQGHN để được cán bộ y tế đồng hành.";
      }
      setMessages([...newMsgList, { sender: "bot", text: reply }]);
    }, 600);
  };

  // Tính số ngày và tiền tiết kiệm
  let daysClean = 0;
  let moneySaved = 0;
  if (plan?.startDate) {
    const start = new Date(plan.startDate).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    daysClean = diffDays;
    const costPerCig = (plan.costPerPack || 30000) / 20;
    moneySaved = Math.round(diffDays * (plan.cigsPerDay || 10) * costPerCig);
  }

  return (
    <div className="page-quit-support">
      {/* Banner Tổng đài Quốc gia & Y tế trường */}
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ color: "#166534", fontSize: 13 }}>Tổng đài Quốc gia Cai thuốc lá (Miễn phí):</strong>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>1800 6606</div>
        </div>
        <a
          href="tel:18006606"
          style={{ background: "var(--primary)", color: "#fff", textDecoration: "none", padding: "8px 14px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700 }}
        >
          Gọi miễn cước
        </a>
      </div>

      {/* Điều hướng sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { id: "craving", label: "Vượt cơn thèm (4D)" },
          { id: "plan", label: "Kế hoạch cai thuốc" },
          { id: "fagerstrom", label: "Đo mức nghiện" },
          { id: "chat", label: "Trợ lý đồng hành" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            style={{
              flex: "none",
              padding: "7px 12px",
              borderRadius: 20,
              border: activeSubTab === tab.id ? "1.5px solid #17634c" : "1px solid #e2e8f0",
              background: activeSubTab === tab.id ? "#17634c" : "#ffffff",
              color: activeSubTab === tab.id ? "#ffffff" : "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Cấp cứu cơn thèm 4D */}
      {activeSubTab === "craving" && (
        <div>
          <div className="breathing-box">
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>VƯỢT CƠN THÈM THUỐC 4D</h2>
            <p style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
              Cơn thèm nicotine sinh lý chỉ kéo dài 3 – 5 phút. Hãy cùng thở sâu để vượt qua!
            </p>

            <div className="breathing-circle">
              <span style={{ fontSize: 28, fontWeight: 800 }}>
                {Math.floor(cravingSeconds / 60)}:{(cravingSeconds % 60).toString().padStart(2, "0")}
              </span>
              <span style={{ fontSize: 11, marginTop: 4, textAlign: "center", padding: "0 8px" }}>
                {breathingPhase}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setCravingActive(!cravingActive);
                if (!cravingActive && cravingSeconds === 0) setCravingSeconds(180);
              }}
              style={{
                background: "#ffffff",
                color: "#17634c",
                border: "none",
                padding: "10px 22px",
                borderRadius: 20,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              }}
            >
              {cravingActive ? "Tạm dừng" : "BẮT ĐẦU VƯỢT CƠN THÈM (3 PHÚT)"}
            </button>
          </div>

          <div className="card">
            <div className="card-title">💡 Kỹ thuật 4D Khoa học từ WHO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div>
                <strong style={{ color: "#17634c" }}>1. Delay (Trì hoãn):</strong> Đợi ít nhất 5 phút trước khi quyết định. 90% cơn thèm sẽ tự biến mất.
              </div>
              <div>
                <strong style={{ color: "#17634c" }}>2. Deep breath (Thở sâu):</strong> Hít vào thật sâu bằng mũi trong 4 giây, giữ 7 giây và thở ra từ từ bằng miệng trong 8 giây.
              </div>
              <div>
                <strong style={{ color: "#17634c" }}>3. Drink water (Uống nước):</strong> Uống từng ngụm nước lạnh nhỏ để xoa dịu cảm giác bồn chồn ở khoang miệng.
              </div>
              <div>
                <strong style={{ color: "#17634c" }}>4. Distract (Làm việc khác):</strong> Đứng dậy đi bộ, nghe một bản nhạc yêu thích hoặc trò chuyện cùng bạn bè.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kế hoạch cai thuốc của tôi */}
      {activeSubTab === "plan" && (
        <div>
          {plan ? (
            <div>
              <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #86efac" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>HÀNH TRÌNH TỰ DO</span>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#166534" }}>{daysClean} ngày</div>
                    <div style={{ fontSize: 12, color: "#166534" }}>Bắt đầu từ: {plan.startDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>TIẾT KIỆM ĐƯỢC</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f766e" }}>
                      {moneySaved.toLocaleString("vi-VN")} đ
                    </div>
                    <div style={{ fontSize: 11, color: "#166534" }}>Tương đương ~{Math.floor(moneySaved / 30000)} bữa ăn SV</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed #86efac", fontSize: 12, color: "#166534" }}>
                  <strong>Lý do của bạn:</strong> "{plan.reason}"
                </div>
              </div>

              {/* Các mốc hồi phục sinh lý */}
              <div className="card">
                <div className="card-title">🌱 Các mốc Cơ thể Phục hồi</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 0 ? 1 : 0.5 }}>
                    <span style={{ fontSize: 18 }}>⏱️</span>
                    <div>
                      <strong>Sau 20 phút:</strong> Huyết áp và nhịp tim bắt đầu hạ dần về mức bình thường.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 1 ? 1 : 0.5 }}>
                    <span style={{ fontSize: 18 }}>🫁</span>
                    <div>
                      <strong>Sau 24 giờ:</strong> Nồng độ khí CO độc hại trong máu giảm xuống 0, lượng oxy tăng tối đa.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 2 ? 1 : 0.5 }}>
                    <span style={{ fontSize: 18 }}>🍎</span>
                    <div>
                      <strong>Sau 48 giờ:</strong> Các đầu mút dây thần kinh bắt đầu mọc lại; khứu giác và vị giác hồi phục rõ rệt.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 14 ? 1 : 0.5 }}>
                    <span style={{ fontSize: 18 }}>🏃</span>
                    <div>
                      <strong>Sau 2 - 4 tuần:</strong> Chức năng lưu thông tuần hoàn máu và thể tích thông khí phổi tăng tới 30%.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm("Bạn có muốn điều chỉnh lại kế hoạch cai thuốc không?")) {
                    setPlan(null);
                  }
                }}
              >
                Chỉnh sửa kế hoạch
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePlan} className="card">
              <div className="card-title">🎯 Thiết lập Kế hoạch Cai thuốc</div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                Dữ liệu chỉ lưu riêng tư trên máy của bạn. Không gửi lên máy chủ, không liên quan đến xử lý kỷ luật.
              </p>

              <div className="form-group">
                <label className="form-label">Chọn ngày bắt đầu không hút:</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điếu thuốc/hơi Pod trung bình mỗi ngày:</label>
                <input
                  type="number"
                  className="form-input"
                  value={cigsPerDay}
                  onChange={(e) => setCigsPerDay(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giá trung bình 1 bao thuốc / 1 đầu Pod (VND):</label>
                <input
                  type="number"
                  className="form-input"
                  value={costPerPack}
                  onChange={(e) => setCostPerPack(Number(e.target.value))}
                  step={5000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Động lực lớn nhất để bạn từ bỏ thuốc:</label>
                <input
                  type="text"
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Tiết kiệm tiền mua laptop, bảo vệ người yêu..."
                />
              </div>

              <button type="submit" className="btn-primary">
                LƯU KẾ HOẠCH & BẮT ĐẦU ĐẾM NGÀY
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Thang đo Fagerstrom */}
      {activeSubTab === "fagerstrom" && (
        <div className="card">
          <div className="card-title">📊 Đánh giá Mức độ Phụ thuộc Nicotine</div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            Thang đo Fagerström Test for Nicotine Dependence (FTND) chuẩn quốc tế gồm 6 câu hỏi:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                q: "1. Bạn hút điếu thuốc đầu tiên trong ngày sau khi thức dậy bao lâu?",
                opts: ["Dưới 5 phút (3 điểm)", "Từ 6 - 30 phút (2 điểm)", "Từ 31 - 60 phút (1 điểm)", "Sau 60 phút (0 điểm)"],
                scores: [3, 2, 1, 0],
              },
              {
                q: "2. Bạn có thấy khó kiềm chế việc hút thuốc ở những nơi bị cấm (như phòng học, KTX)?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "3. Điếu thuốc nào trong ngày làm bạn cảm thấy khó từ bỏ nhất?",
                opts: ["Điếu đầu tiên vào sáng sớm (1 điểm)", "Bất kỳ điếu nào khác (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "4. Bạn hút bao nhiêu điếu thuốc mỗi ngày?",
                opts: ["Trên 30 điếu (3 điểm)", "Từ 21 - 30 điếu (2 điểm)", "Từ 11 - 20 điếu (1 điểm)", "Dưới 10 điếu (0 điểm)"],
                scores: [3, 2, 1, 0],
              },
              {
                q: "5. Bạn có hút nhiều hơn vào các buổi sáng so với phần còn lại của ngày không?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "6. Bạn có vẫn hút thuốc khi bị ốm liệt giường không?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
            ].map((item, idx) => (
              <div key={idx} style={{ paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                <strong style={{ fontSize: 13, color: "#1e293b" }}>{item.q}</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {item.opts.map((opt, oIdx) => (
                    <label key={oIdx} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`f_q_${idx}`}
                        checked={fAnswers[idx] === item.scores[oIdx]}
                        onChange={() => {
                          const updated = [...fAnswers];
                          updated[idx] = item.scores[oIdx];
                          setFAnswers(updated);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 14 }}
            onClick={handleCalculateFagerstrom}
          >
            TÍNH ĐIỂM & XEM KẾT QUẢ
          </button>

          {fScore !== null && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
              <strong style={{ color: "#166534", fontSize: 15 }}>
                Kết quả: {fScore} / 10 điểm — {fScore <= 2 ? "Phụ thuộc rất thấp" : fScore <= 4 ? "Phụ thuộc trung bình" : fScore <= 6 ? "Phụ thuộc nặng" : "Phụ thuộc rất nặng"}
              </strong>
              <p style={{ fontSize: 12, color: "#15803d", marginTop: 4 }}>
                {fScore <= 2
                  ? "Bạn chủ yếu hút thuốc theo thói quen tâm lý xã hội. Việc bỏ thuốc hoàn toàn khả thi chỉ bằng ý chí và thay đổi môi trường."
                  : fScore <= 5
                  ? "Cơ thể bạn đã bắt đầu quen với nồng độ nicotine. Bạn nên áp dụng kế hoạch cai giảm dần kết hợp liệu pháp tâm lý 4D."
                  : "Mức độ phụ thuộc nicotine cao. Bạn nên liên hệ Tổng đài 1800 6606 để được bác sĩ hướng dẫn phác đồ hỗ trợ phù hợp."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Trợ lý AI Cai thuốc */}
      {activeSubTab === "chat" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", height: 440 }}>
          <div className="card-title">🤖 Trợ lý Đồng hành Cai thuốc (AI Coach)</div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: 8, background: "#f8fafc", borderRadius: 8 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  background: m.sender === "user" ? "#17634c" : "#ffffff",
                  color: m.sender === "user" ? "#ffffff" : "#1e293b",
                  padding: "8px 12px",
                  borderRadius: 12,
                  maxWidth: "80%",
                  fontSize: 13,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập tâm sự hoặc câu hỏi của bạn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 16px" }}>
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
