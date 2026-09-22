import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file') || 'dog-theme.css';

  const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
  if (!allowed.includes(filename)) {
    return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'app', filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ file: filename, content });
  } catch (err) {
    return NextResponse.json({ error: 'Không đọc được file' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { filename, content } = await request.json();
    const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
    if (!allowed.includes(filename)) {
      return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'app', filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return NextResponse.json({ success: true, message: `Đã lưu file ${filename} thành công!` });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi khi ghi file' }, { status: 500 });
  }
}
