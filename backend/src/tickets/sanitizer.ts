/**
 * Bộ quy tắc che thông tin định danh (PII Masking / Anonymization)
 * Che số điện thoại, mã sinh viên, email và các thông tin nhạy cảm
 * ngay khi nhận phản ánh, trước khi lưu CSDL hoặc gửi qua LLM/AI.
 */

export function sanitizeNote(rawNote: string): string {
  if (!rawNote) return "";

  let cleaned = rawNote;

  // 1. Che số điện thoại Việt Nam (09x, 03x, 07x, 08x, +84...)
  cleaned = cleaned.replace(
    /(?:\+84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}\b/g,
    "[SĐT_ĐÃ_CHE]"
  );
  cleaned = cleaned.replace(/\b\d{10,11}\b/g, "[SĐT_ĐÃ_CHE]");

  // 2. Che mã sinh viên ĐHQGHN (dạng 8 chữ số, ví dụ 21020000, 22000000...)
  cleaned = cleaned.replace(/\b(1[89]|2[0-6])\d{6}\b/g, "[MÃ_SV_ĐÃ_CHE]");

  // 3. Che địa chỉ email
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL_ĐÃ_CHE]"
  );

  return cleaned.trim();
}

/**
 * Sinh mã tra cứu phản ánh ngẫu nhiên gồm 8 ký tự viết hoa chia làm 2 cụm (VD: K7Q2-9XMA)
 * Đảm bảo sinh ngẫu nhiên, không theo số thứ tự để người ngoài không đoán được phiếu của người khác.
 */
export function generateTrackingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // loại bỏ ký tự dễ nhầm 0, 1, I, O
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

/**
 * Sinh mã phiếu nội bộ theo ngày: SF-YYMMDD-XXX (VD: SF-261016-042)
 */
export function generateTicketCode(sequenceNumber: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(sequenceNumber).padStart(3, "0");
  return `SF-${yy}${mm}${dd}-${seq}`;
}
