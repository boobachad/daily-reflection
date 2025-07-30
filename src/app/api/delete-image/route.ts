import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ warning: 'No image URL provided' }, { status: 200 });
        }

        const filename = imageUrl.split('/').pop();
        if (!filename) {
            return NextResponse.json({ warning: 'Invalid image URL' }, { status: 200 });
        }

        const filePath = path.join(process.cwd(), 'public', 'uploads', 'schedules', filename);

        try {
            await fs.unlink(filePath);
            return NextResponse.json({ success: true });
        } catch (_err) {
            // File likely doesn't exist - still return success
            return NextResponse.json({ warning: 'File not found' }, { status: 200 });
        }
    } catch (error) {
        // Don't fail the entire process if deletion fails
        return NextResponse.json({ warning: error instanceof Error ? error.message : String(error) }, { status: 200 });
    }
}