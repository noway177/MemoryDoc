import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const reqType = searchParams.get('type');

        const db = await getDb();
        const document = await db.get(`SELECT * FROM documents WHERE id = ?`, id);

        if (!document) {
            return new NextResponse('Document not found', { status: 404 });
        }

        let targetFile = document.pdf_file;
        if (reqType === 'summary' && document.summary_pdf_file) {
            targetFile = document.summary_pdf_file;
        }

        if (!targetFile) {
            return new NextResponse('PDF not found', { status: 404 });
        }

        const filePath = path.join(process.cwd(), 'public', 'uploads', targetFile);

        try {
            const fileBuffer = await fs.readFile(filePath);

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="${targetFile}"`,
                },
            });
        } catch (e) {
            console.error(`Error reading PDF file from filesystem: ${filePath}`, e);
            return new NextResponse('PDF file not found on server', { status: 404 });
        }

    } catch (error) {
        console.error(`Error fetching PDF for document: ${params?.id}`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
