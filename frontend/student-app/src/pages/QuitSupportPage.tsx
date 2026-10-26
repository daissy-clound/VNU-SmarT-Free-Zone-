import React, { useEffect, useState } from "react";
import { platform } from "../platform";
import {
  PhoneIcon,
  HeartPulseIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from "../components/Icons";

export function QuitSupportPage() {
  const [activeSubTab, setActiveSubTab] = useState<"craving" | "plan" | "fagerstrom">("craving");

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
  const [reason, setReason] = useState<string>("Bảo vệ sức khoẻ bản thân & người thân");

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
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: "1px solid #bbf7d0",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <div style={{ color: "#166534", fontSize: 12, fontWeight: 600 }}>Tổng đài tư vấn cai thuốc lá (Miễn cước):</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d", marginTop: 1 }}>1800 6606</div>
        </div>
        <a
          href="tel:18006606"
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <PhoneIcon size={12} color="#ffffff" />
          <span>Gọi miễn phí</span>
        </a>
      </div>

      {/* Điều hướng 3 công cụ khoa học chính thức (100% chức năng thực tế) */}
      <div className="support-subtabs">
        {[
          { id: "craving", label: "Thư giãn 4D" },
          { id: "plan", label: "Lộ trình cá nhân" },
          { id: "fagerstrom", label: "Đánh giá thói quen" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`subtab-pill ${activeSubTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveSubTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Thư giãn 4D */}
      {activeSubTab === "craving" && (
        <div>
          <div className="breathing-box">
            <h2 className="breathing-title">Thực hành Thư giãn 4D</h2>
            <p className="breathing-sub">
              Cơn thôi thúc thường lắng dịu sau 3 – 5 phút. Hãy cùng hít thở sâu theo nhịp và thư giãn tâm trí nhé.
            </p>

            <div className="breathing-circle">
              <div className="breathing-time">
                {Math.floor(cravingSeconds / 60)}:{(cravingSeconds % 60).toString().padStart(2, "0")}
              </div>
              <div className="breathing-phase">
                {breathingPhase}
              </div>
            </div>

            <button
              type="button"
              className="btn-breathing-action"
              onClick={() => {
                setCravingActive(!cravingActive);
                if (!cravingActive && cravingSeconds === 0) setCravingSeconds(180);
              }}
            >
              <HeartPulseIcon size={16} />
              <span>{cravingActive ? "Tạm dừng bài tập" : "Bắt đầu bài tập thở 3 phút"}</span>
            </button>
          </div>

          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <SparklesIcon size={16} color="var(--primary)" />
                <span>Phương pháp 4D từ Tổ chức Y tế Thế giới (WHO)</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: "var(--primary)" }}>1. Delay (Trì hoãn):</strong> Đợi khoảng 5 phút trước khi quyết định. Phần lớn cảm giác bồn chồn sẽ tự lắng xuống.
              </div>
              <div>
                <strong style={{ color: "var(--primary)" }}>2. Deep breath (Thở sâu):</strong> Hít vào thật chậm bằng mũi trong 4 giây, giữ hơi 7 giây và thở ra từ từ qua miệng trong 8 giây.
              </div>
              <div>
                <strong style={{ color: "var(--primary)" }}>3. Drink water (Uống nước):</strong> Nhấp từng ngụm nước mát để làm dịu cảm giác nơi vòm họng.
              </div>
              <div>
                <strong style={{ color: "var(--primary)" }}>4. Distract (Đổi hoạt động):</strong> Đi dạo vài bước, nghe bài hát yêu thích hoặc trò chuyện cùng bạn bè.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lộ trình cá nhân */}
      {activeSubTab === "plan" && (
        <div>
          {plan ? (
            <div>
              <div
                className="card"
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  border: "1px solid #86efac",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>HÀNH TRÌNH TÍCH CỰC</span>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#166534", marginTop: 2 }}>
                      {daysClean} ngày
                    </div>
                    <div style={{ fontSize: 12, color: "#166534" }}>Bắt đầu từ: {plan.startDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>TIẾT KIỆM ĐƯỢC</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f766e", marginTop: 2 }}>
                      {moneySaved.toLocaleString("vi-VN")} đ
                    </div>
                    <div style={{ fontSize: 11, color: "#166534" }}>
                      Tương đương ~{Math.floor(moneySaved / 30000)} bữa ăn sinh viên
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #86efac", fontSize: 12, color: "#166534" }}>
                  <strong>Mục tiêu của bạn:</strong> "{plan.reason}"
                </div>
              </div>

              {/* Các mốc hồi phục sinh lý */}
              <div className="card">
                <div className="card-title">
                  <span>Các mốc cơ thể hồi phục tự nhiên</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 0 ? 1 : 0.6 }}>
                    <span style={{ fontSize: 16 }}>⏱️</span>
                    <div>
                      <strong>Sau 20 phút:</strong> Huyết áp và nhịp tim bắt đầu trở về mức bình thường.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 1 ? 1 : 0.6 }}>
                    <span style={{ fontSize: 16 }}>🫁</span>
                    <div>
                      <strong>Sau 24 giờ:</strong> Nồng độ khí CO độc hại trong máu giảm hẳn, lượng oxy tăng lên.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 2 ? 1 : 0.6 }}>
                    <span style={{ fontSize: 16 }}>🍎</span>
                    <div>
                      <strong>Sau 48 giờ:</strong> Vị giác và khứu giác cảm nhận hương vị thức ăn tinh tế hơn.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, opacity: daysClean >= 14 ? 1 : 0.6 }}>
                    <span style={{ fontSize: 16 }}>🏃</span>
                    <div>
                      <strong>Sau 2 - 4 tuần:</strong> Thể tích thông khí phổi và sức bền thể lực cải thiện rõ rệt.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm("Bạn có muốn điều chỉnh lại lộ trình đồng hành không?")) {
                    setPlan(null);
                  }
                }}
              >
                Chỉnh sửa lộ trình
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePlan} className="card">
              <div className="card-title">
                <span>Thiết lập lộ trình sống khoẻ</span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.45 }}>
                Dữ liệu chỉ lưu riêng tư trên thiết bị của bạn, giúp bạn theo dõi tiến trình của chính mình.
              </p>

              <div className="form-group">
                <label className="form-label">Chọn ngày bắt đầu:</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điếu thuốc / hơi Pod trung bình mỗi ngày:</label>
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
                <label className="form-label">Chi phí trung bình (VND/gói hoặc đầu pod):</label>
                <input
                  type="number"
                  className="form-input"
                  value={costPerPack}
                  onChange={(e) => setCostPerPack(Number(e.target.value))}
                  step={5000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Động lực lớn nhất để bạn duy trì lối sống lành mạnh:</label>
                <input
                  type="text"
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Tiết kiệm chi phí, bảo vệ sức khoẻ người thân..."
                />
              </div>

              <button type="submit" className="btn-primary">
                <span>Lưu lộ trình đồng hành</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Thang đo Fagerstrom chuẩn quốc tế */}
      {activeSubTab === "fagerstrom" && (
        <div className="card">
          <div className="card-title">
            <span>Đánh giá mức độ phụ thuộc Nicotine (Fagerström FTND)</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.45 }}>
            Thang đo khoa học quốc tế gồm 6 câu hỏi giúp bạn hiểu rõ mức độ phụ thuộc để áp dụng phương pháp phù hợp:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                q: "1. Bạn thường dùng điếu thuốc đầu tiên trong ngày sau khi thức dậy bao lâu?",
                opts: ["Dưới 5 phút (3 điểm)", "Từ 6 - 30 phút (2 điểm)", "Từ 31 - 60 phút (1 điểm)", "Sau 60 phút (0 điểm)"],
                scores: [3, 2, 1, 0],
              },
              {
                q: "2. Bạn có thấy khó kiềm chế ở những khu vực học đường cấm hút thuốc?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "3. Điếu thuốc nào trong ngày làm bạn cảm thấy khó từ bỏ nhất?",
                opts: ["Điếu đầu tiên vào sáng sớm (1 điểm)", "Các điếu khác trong ngày (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "4. Bạn dùng bao nhiêu điếu thuốc mỗi ngày?",
                opts: ["Trên 30 điếu (3 điểm)", "Từ 21 - 30 điếu (2 điểm)", "Từ 11 - 20 điếu (1 điểm)", "Dưới 10 điếu (0 điểm)"],
                scores: [3, 2, 1, 0],
              },
              {
                q: "5. Bạn có hút nhiều hơn vào các buổi sáng so với buổi chiều tối?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
              {
                q: "6. Khi bị cảm cúm hoặc ốm phải nghỉ ngơi, bạn có hút thuốc không?",
                opts: ["Có (1 điểm)", "Không (0 điểm)"],
                scores: [1, 0],
              },
            ].map((item, idx) => (
              <div key={idx} style={{ paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {item.q}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {item.opts.map((opt, oIdx) => (
                    <label key={oIdx} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)" }}>
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
            <span>Xem kết quả đánh giá</span>
          </button>

          {fScore !== null && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: "var(--radius-sm)", background: "#f0fdf4", border: "1px solid #86efac" }}>
              <strong style={{ color: "#166534", fontSize: 14 }}>
                Kết quả: {fScore} / 10 điểm — {fScore <= 2 ? "Phụ thuộc nhẹ" : fScore <= 4 ? "Phụ thuộc vừa" : fScore <= 6 ? "Phụ thuộc đáng chú ý" : "Phụ thuộc cao"}
              </strong>
              <p style={{ fontSize: 12, color: "#15803d", marginTop: 4, lineHeight: 1.45 }}>
                {fScore <= 2
                  ? "Bạn chủ yếu dùng theo thói quen môi trường xung quanh. Bạn hoàn toàn có thể chủ động kiểm soát và thay đổi lối sống một cách nhẹ nhàng."
                  : fScore <= 5
                  ? "Cơ thể đã quen với nhịp sinh hoạt có nicotine. Áp dụng kỹ thuật thở 4D và giảm dần theo từng tuần sẽ mang lại hiệu quả rất tích cực."
                  : "Mức độ gắn bó tương đối cao. Hãy liên hệ Tổng đài 1800 6606 để được chuyên gia y tế đồng hành và hỗ trợ phác đồ khoa học nhé."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
