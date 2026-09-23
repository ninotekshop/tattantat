import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function resolveCssPath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'app', filename),
    path.join(process.cwd(), 'web', 'app', filename),
    path.resolve(__dirname, '../../../../app', filename),
    path.resolve('C:/Projects/TatTanTat/web/app', filename)
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && !candidate.includes('intermediates')) {
        return candidate;
      }
    } catch {}
  }
  return path.join(process.cwd(), 'app', filename);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file') || 'dog-theme.css';

  const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
  if (!allowed.includes(filename)) {
    return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
  }

  const filePath = resolveCssPath(filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ file: filename, content });
  } catch (err) {
    return NextResponse.json({ error: 'Không đọc được file CSS' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { filename, content } = await request.json();
    const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
    if (!allowed.includes(filename)) {
      return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
    }

    const filePath = resolveCssPath(filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return NextResponse.json({ success: true, message: `Đã lưu file ${filename} thành công!` });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi khi ghi file CSS' }, { status: 500 });
  }
}
