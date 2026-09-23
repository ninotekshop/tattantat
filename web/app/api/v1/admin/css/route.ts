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

// In-memory runtime CSS storage for production standalone mode
const cssMemoryCache: Record<string, string> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file') || 'dog-theme.css';

  const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
  if (!allowed.includes(filename)) {
    return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
  }

  // 1. Check in-memory runtime cache
  if (cssMemoryCache[filename]) {
    return NextResponse.json({ file: filename, content: cssMemoryCache[filename] });
  }

  // 2. Try reading from filesystem
  const filePath = resolveCssPath(filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    cssMemoryCache[filename] = content;
    return NextResponse.json({ file: filename, content });
  } catch {
    // 3. Production standalone fallback
    const fallbackContent = `/* Tất Tần Tật - ${filename} Giao diện hệ thống */\n:root {\n  --brand: #00a65a;\n  --brand-hover: #008247;\n}\n`;
    cssMemoryCache[filename] = fallbackContent;
    return NextResponse.json({ file: filename, content: fallbackContent });
  }
}

export async function POST(request: Request) {
  try {
    const { filename, content } = await request.json();
    const allowed = ['dog-theme.css', 'admin.css', 'globals.css', 'marketplace.css', 'member.css'];
    if (!allowed.includes(filename)) {
      return NextResponse.json({ error: 'File không hợp lệ' }, { status: 400 });
    }

    // Update in-memory runtime cache
    cssMemoryCache[filename] = content;

    // Try writing to filesystem if possible
    try {
      const filePath = resolveCssPath(filename);
      fs.writeFileSync(filePath, content, 'utf8');
    } catch {}

    return NextResponse.json({ success: true, message: `Đã lưu file ${filename} thành công!` });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi khi lưu file CSS' }, { status: 500 });
  }
}
