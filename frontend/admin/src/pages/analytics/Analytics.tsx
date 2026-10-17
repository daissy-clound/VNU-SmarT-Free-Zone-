import { Alert, Card, Empty } from "antd";

export function Analytics() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">HIỂU DỮ LIỆU · CHỦ ĐỘNG PHÒNG NGỪA</div>
          <h1>Phân tích</h1>
          <p>Theo dõi xu hướng và tham khảo gợi ý phòng ngừa theo khu vực.</p>
        </div>
      </div>
      <Alert
        showIcon
        type="info"
        title="Chưa có dữ liệu phân tích. Các báo cáo sẽ xuất hiện tại đây khi được cập nhật."
      />
      <div className="analytics-grid">
        {[
          [
            "Bản đồ nhiệt khu vực",
            "Hai lớp riêng: nghi vấn / đã xác nhận. Bộ lọc toà và thời gian.",
          ],
          [
            "Dự báo & tuần tra",
            "Những khung giờ, khu vực cần chú ý và lịch tuần tra gợi ý.",
          ],
          [
            "Minh bạch thuật toán",
            "Khả năng phát hiện, tỷ lệ báo nhầm và giới hạn của kết quả phân tích.",
          ],
          [
            "Báo cáo tuần",
            "Tổng hợp số liệu đã kiểm chứng; ghi nguồn và thời gian cập nhật.",
          ],
        ].map(([title, text]) => (
          <Card title={title} key={title}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chờ kết nối dữ liệu"
            />
            <p className="muted">{text}</p>
          </Card>
        ))}
      </div>
      <p className="muted">
        Số đo trên dữ liệu mô phỏng phải được ghi rõ. Cảm biến hiện diện có thể
        bỏ sót người đứng yên hoặc ghi nhận người đi ngang.
      </p>
    </>
  );
}
