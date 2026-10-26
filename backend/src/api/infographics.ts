import { Router } from "express";
import { prisma } from "../server";
import { requireAuth } from "./auth";

export const infographicsRouter = Router();

/**
 * Hàm loại bỏ siêu dữ liệu EXIF (APP1 marker 0xFF 0xE1) trong ảnh JPEG
 * Đảm bảo bảo vệ quyền riêng tư theo cam kết trong kế hoạch MVP
 */
export function stripExifFromJpeg(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    // Không phải ảnh JPEG hoặc quá ngắn, giữ nguyên
    return buffer;
  }

  const pieces: Buffer[] = [buffer.subarray(0, 2)]; // Giữ SOI marker 0xFF 0xD8
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      pieces.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];
    // Nếu là SOS (Start of Scan - 0xDA), phần còn lại là dữ liệu ảnh
    if (marker === 0xda) {
      pieces.push(buffer.subarray(offset));
      break;
    }

    if (offset + 4 > buffer.length) {
      pieces.push(buffer.subarray(offset));
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    // 0xE1 là APP1 marker (chứa siêu dữ liệu EXIF)
    if (marker === 0xe1) {
      // Bỏ qua đoạn EXIF này
      offset += 2 + length;
    } else {
      pieces.push(buffer.subarray(offset, offset + 2 + length));
      offset += 2 + length;
    }
  }

  return Buffer.concat(pieces);
}

/**
 * GET /api/infographics
 * Lấy danh sách infographic tuyên truyền đang kích hoạt (công khai cho dashboard và ứng dụng sinh viên)
 */
infographicsRouter.get("/", async (req, res) => {
  try {
    const items = await prisma.infographic.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
      // API công khai: chỉ trả vai trò người đăng, không trả tên cán bộ
      include: {
        created_by: {
          select: { role: true },
        },
      },
    });
    return res.json({ items });
  } catch (error) {
    console.error("[Get Infographics Error]", error);
    return res.status(500).json({ error: "Lỗi lấy danh sách infographic" });
  }
});

/**
 * POST /api/infographics
 * Ban Quản lý đăng tải infographic tuyên truyền
 * Ràng buộc:
 * 1. Chỉ tài khoản BQL (manager) mới được đăng
 * 2. Dung lượng <= 2 MB
 * 3. Tự động xoá siêu dữ liệu EXIF bảo vệ riêng tư
 */
infographicsRouter.post("/", requireAuth(["manager"]), async (req, res) => {
  try {
    const { title, image_data, image_url, building, zone_code } = req.body;

    if (!title || (!image_data && !image_url)) {
      return res.status(400).json({ error: "Tiêu đề và hình ảnh không được để trống" });
    }

    let finalImageUrl = image_url || "";

    if (image_data) {
      // Kiểm tra dung lượng (image_data là base64)
      const base64Content = image_data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Content, "base64");

      const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
      if (buffer.length > MAX_SIZE_BYTES) {
        return res.status(400).json({ error: "Dung lượng ảnh vượt quá giới hạn 2 MB cho phép" });
      }

      // Xoá EXIF
      const cleanedBuffer = stripExifFromJpeg(buffer);
      finalImageUrl = `data:image/jpeg;base64,${cleanedBuffer.toString("base64")}`;
    }

    const user = (req as any).user;
    const item = await prisma.infographic.create({
      data: {
        title,
        image_url: finalImageUrl,
        building: building || null,
        zone_code: zone_code || null,
        created_by_id: user.id,
        is_active: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Đăng tải infographic tuyên truyền thành công (đã xoá siêu dữ liệu EXIF bảo mật)!",
      item,
    });
  } catch (error) {
    console.error("[Create Infographic Error]", error);
    return res.status(500).json({ error: "Lỗi khi đăng infographic" });
  }
});
