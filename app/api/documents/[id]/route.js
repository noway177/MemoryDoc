import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const db = await getDb();
        const document = await db.get(`SELECT * FROM documents WHERE id = ?`, id);

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        document.keywords = JSON.parse(document.keywords);

        return NextResponse.json(document);
    } catch (error) {
        console.error(`Error fetching document: ${params?.id}`, error);
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const db = await getDb();

        // Check if document exists
        const existingDoc = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
        if (!existingDoc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const formData = await request.formData();

        // Extract updateable fields
        const title = formData.get('title');
        const type = formData.get('type');
        const rating = formData.get('rating');
        const mini_summary = formData.get('mini_summary');
        const summary = formData.get('summary') || '';
        const keywords = formData.get('keywords');
        const pdfFile = formData.get('pdf_file'); // Can be null if not updated
        const summaryPdfFile = formData.get('summary_pdf_file'); // Optional

        let updateFields = {};
        let queryParams = [];
        let setClauses = [];

        if (title) { setClauses.push('title = ?'); queryParams.push(title); updateFields.title = title; }
        if (type) { setClauses.push('type = ?'); queryParams.push(type); updateFields.type = type; }
        if (rating) { setClauses.push('rating = ?'); queryParams.push(parseInt(rating, 10)); updateFields.rating = parseInt(rating, 10); }
        if (mini_summary) { setClauses.push('mini_summary = ?'); queryParams.push(mini_summary); updateFields.mini_summary = mini_summary; }
        if (summary !== undefined) { setClauses.push('summary = ?'); queryParams.push(summary); updateFields.summary = summary; }

        if (keywords) {
            try {
                const parsedKeywords = JSON.parse(keywords);
                if (!Array.isArray(parsedKeywords) || parsedKeywords.length === 0) {
                    return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 });
                }
                setClauses.push('keywords = ?');
                queryParams.push(JSON.stringify(parsedKeywords));
                updateFields.keywords = parsedKeywords;
            } catch (e) {
                return NextResponse.json({ error: 'Invalid keywords format' }, { status: 400 });
            }
        }

        if (pdfFile && pdfFile.size > 0) {
            // Process new PDF file
            const bytes = await pdfFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const newTitle = updateFields.title || existingDoc.title;
            const sanitizedTitle = newTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${id}_${sanitizedTitle}.pdf`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const filePath = path.join(uploadDir, fileName);

            await fs.writeFile(filePath, buffer);

            setClauses.push('pdf_file = ?');
            queryParams.push(fileName);
            updateFields.pdf_file = fileName;

            // Delete old file if name is different
            if (existingDoc.pdf_file && existingDoc.pdf_file !== fileName) {
                try {
                    const oldFilePath = path.join(uploadDir, existingDoc.pdf_file);
                    await fs.unlink(oldFilePath);
                } catch (e) {
                    console.log("Could not delete old file:", e);
                }
            }
        }

        if (summaryPdfFile && summaryPdfFile.size > 0 && updateFields.type !== 'summary') {
            // Process new Summary PDF file
            const bytes = await summaryPdfFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const newTitle = updateFields.title || existingDoc.title;
            const sanitizedTitle = newTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${id}_summary_${sanitizedTitle}.pdf`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const filePath = path.join(uploadDir, fileName);

            await fs.writeFile(filePath, buffer);

            setClauses.push('summary_pdf_file = ?');
            queryParams.push(fileName);
            updateFields.summary_pdf_file = fileName;

            // Delete old summary file if name is different
            if (existingDoc.summary_pdf_file && existingDoc.summary_pdf_file !== fileName) {
                try {
                    const oldFilePath = path.join(uploadDir, existingDoc.summary_pdf_file);
                    await fs.unlink(oldFilePath);
                } catch (e) {
                    console.log("Could not delete old summary file:", e);
                }
            }
        }

        if (setClauses.length === 0) {
            return NextResponse.json(existingDoc);
        }

        queryParams.push(id);
        const query = `UPDATE documents SET ${setClauses.join(', ')} WHERE id = ?`;

        await db.run(query, ...queryParams);

        const updatedDocument = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
        updatedDocument.keywords = JSON.parse(updatedDocument.keywords);

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error(`Error updating document: ${params?.id}`, error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const db = await getDb();

        // 1. Get the document first to identify the PDF file to delete
        const document = await db.get(`SELECT * FROM documents WHERE id = ?`, id);

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // 2. Delete from database
        await db.run(`DELETE FROM documents WHERE id = ?`, id);

        // 3. Delete the actual files
        if (document.pdf_file) {
            const filePath = path.join(process.cwd(), 'public', 'uploads', document.pdf_file);
            try {
                // Check if file exists before deleting
                await fs.access(filePath);
                await fs.unlink(filePath);
            } catch (e) {
                console.log(`Could not delete file ${filePath} from filesystem, it might already be gone.`, e);
            }
        }

        if (document.summary_pdf_file) {
            const filePath = path.join(process.cwd(), 'public', 'uploads', document.summary_pdf_file);
            try {
                // Check if file exists before deleting
                await fs.access(filePath);
                await fs.unlink(filePath);
            } catch (e) {
                console.log(`Could not delete summary file ${filePath} from filesystem, it might already be gone.`, e);
            }
        }

        return NextResponse.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error(`Error deleting document: ${params?.id}`, error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
