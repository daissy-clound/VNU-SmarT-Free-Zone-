import type {
  Ticket,
  TicketHistory,
  TicketStatus,
  UserRole,
} from "../../../backend/src/contracts";

/**
 * Quy trình xử lý phiếu trên dashboard, dựa trên luật 6 bước của A:
 * received → assigned → verifying → handled → responded → closed.
 * Mỗi nút bấm có thể gồm vài bước liền nhau, nhưng luôn gửi TỪNG bước một (PATCH /status)
 * để lịch sử ghi đủ: ai làm, lúc nào.
 */
export type ActionKey =
  | "en_route"
  | "arrived"
  | "false_alarm"
  | "resolve"
  | "assign"
  | "dismiss"
  | "respond"
  | "close";

export interface Step {
  status: TicketStatus;
  note: string;
  assignToSelf?: boolean;
}

export const ARRIVED_NOTE = "Cán bộ trực đã có mặt tại hiện trường";
export const EN_ROUTE_NOTE = "Cán bộ trực nhận kiểm tra, đang đến hiện trường";
export const FALSE_ALARM_PREFIX = "Báo nhầm";
/** Ban quản lý xác minh từ dữ liệu và kết luận không cần cử người: bước "Đang xác minh" này không phải giờ có mặt */
export const DISMISS_NOTE = "Ban quản lý xác minh thông tin từ dữ liệu, không cử người kiểm tra";

const ORDER: TicketStatus[] = [
  "received",
  "assigned",
  "verifying",
  "handled",
  "responded",
  "closed",
];
const before = (a: TicketStatus, b: TicketStatus) =>
  ORDER.indexOf(a) < ORDER.indexOf(b);

/** Câu hỏi xác minh nhanh (không có ô ghi tên người vi phạm) */
export const VERIFY_QUESTIONS = [
  { key: "smell", label: "Còn mùi khói?" },
  { key: "butts", label: "Có tàn / đầu lọc thuốc?" },
  { key: "seen", label: "Thấy người đang hút?" },
] as const;
export type VerifyKey = (typeof VERIFY_QUESTIONS)[number]["key"];
export type VerifyAnswer = "yes" | "no" | "unknown";
export type VerifyAnswers = Partial<Record<VerifyKey, VerifyAnswer>>;

const answerText: Record<VerifyAnswer, string> = {
  yes: "Có",
  no: "Không",
  unknown: "Không rõ",
};

export function verifyNote(answers: VerifyAnswers) {
  const parts = VERIFY_QUESTIONS.filter((q) => answers[q.key]).map(
    (q) => `${q.label.replace("?", "")}: ${answerText[answers[q.key]!]}`,
  );
  return parts.length ? `Xác minh — ${parts.join(" · ")}` : "";
}

/** Các bước cần gửi để thực hiện một nút, tính từ trạng thái hiện tại */
export function planSteps(
  status: TicketStatus,
  action: ActionKey,
  detail = "",
): Step[] {
  const toVerifying: Step[] = [];
  if (status === "received")
    toVerifying.push({ status: "assigned", note: EN_ROUTE_NOTE, assignToSelf: true });
  if (before(status, "verifying"))
    toVerifying.push({ status: "verifying", note: ARRIVED_NOTE });

  switch (action) {
    case "assign":
    case "en_route":
      return status === "received"
        ? [{ status: "assigned", note: EN_ROUTE_NOTE, assignToSelf: action === "en_route" }]
        : [];
    case "arrived":
      return toVerifying;
    case "false_alarm":
      if (!before(status, "handled")) return [];
      return [
        ...toVerifying,
        {
          status: "handled",
          note: [FALSE_ALARM_PREFIX + ": không phát hiện vi phạm", detail].filter(Boolean).join(". "),
        },
      ];
    case "dismiss":
      return status === "received"
        ? [
            { status: "verifying", note: DISMISS_NOTE },
            {
              status: "handled",
              note: [FALSE_ALARM_PREFIX + ": Ban quản lý xác minh, không phát hiện vi phạm", detail].filter(Boolean).join(". "),
            },
          ]
        : [];
    case "resolve":
      return status === "verifying"
        ? [{ status: "handled", note: ["Đã xác minh và xử lý tại hiện trường", detail].filter(Boolean).join(". ") }]
        : [];
    case "respond":
      return status === "handled" ? [{ status: "responded", note: detail }] : [];
    case "close":
      return status === "responded"
        ? [{ status: "closed", note: detail || "Đóng phiếu sau rà soát" }]
        : [];
  }
}

const FIELD: ActionKey[] = ["en_route", "arrived", "false_alarm", "resolve"];

/**
 * Ai được bấm gì — khớp phân quyền phía máy chủ:
 * - phòng trực (guard): thao tác hiện trường, chỉ khi phiếu đã điều phối cho phòng mình hoặc mình đã nhận (`mayAct`)
 * - Ban quản lý: điều phối (trang riêng), kết luận báo nhầm khi chưa cử người, phản hồi SV, đóng phiếu
 * - BGK: thao tác hiện trường trên phiếu sandbox
 */
export function canAct(role: UserRole, ticket: Ticket, action: ActionKey, mayAct = true) {
  if (role === "analyst") return false;
  if (role === "viewer") return !!ticket.is_sandbox && action !== "dismiss";
  if (role === "guard") return mayAct && FIELD.includes(action);
  return ["dismiss", "respond", "close"].includes(action);
}

/** Nút hiện ở bước hiện tại (chỉ những nút thực sự có tác dụng) */
export function availableActions(role: UserRole, ticket: Ticket, mayAct = true): ActionKey[] {
  const all: ActionKey[] = ["en_route", "arrived", "false_alarm", "resolve", "dismiss", "respond", "close"];
  return all.filter(
    (a) => canAct(role, ticket, a, mayAct) && planSteps(ticket.status, a).length > 0,
  );
}

/** Lúc ca trực tới hiện trường = lần đầu phiếu vào bước "Đang xác minh" */
export function arrivalTime(history: TicketHistory[]): string | null {
  const entry = [...history]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .find((h) => h.to_status === "verifying" && h.from_status !== "verifying" && h.note !== DISMISS_NOTE);
  return entry?.created_at ?? null;
}

export function isFalseAlarm(history: TicketHistory[]) {
  return history.some(
    (h) => h.to_status === "handled" && (h.note ?? "").startsWith(FALSE_ALARM_PREFIX),
  );
}

export function minutesBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60000);
}

/** Số tin gộp vào phiếu (phản ánh SV, cảm biến) đọc từ lịch sử */
export function signalCounts(history: TicketHistory[]) {
  let report = 0;
  let sensor = 0;
  for (const h of history) {
    const a = h.action.toLowerCase();
    const n = (h.note ?? "").toLowerCase();
    if (a.includes("sensor")) sensor++;
    else if (a.includes("report") || n.startsWith("tạo phiếu từ phản ánh")) report++;
  }
  return { report, sensor };
}
