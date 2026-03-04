import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const ratingMin = searchParams.get('ratingMin') || 0;
        const ratingMax = searchParams.get('ratingMax') || 5;
        const sortBy = searchParams.get('sortBy') || 'newest';
        const keyword = searchParams.get('keyword') || '';

        const db = await getDb();

        let query = `SELECT * FROM documents WHERE rating >= ? AND rating <= ?`;
        let params = [ratingMin, ratingMax];

        if (search) {
            query += ` AND (title LIKE ? OR mini_summary LIKE ? OR keywords LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        if (keyword) {
            query += ` AND keywords LIKE ?`;
            params.push(`%${keyword}%`);
        }

        if (sortBy === 'rating') {
            query += ` ORDER BY rating DESC`;
        } else if (sortBy === 'title') {
            query += ` ORDER BY title ASC`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const documents = await db.all(query, ...params);

        // Parse keywords back to array for the frontend
        const formattedDocs = documents.map(doc => ({
            ...doc,
            keywords: JSON.parse(doc.keywords)
        }));

        return NextResponse.json(formattedDocs);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();

        const title = formData.get('title');
        const type = formData.get('type');
        const rating = formData.get('rating');
        const mini_summary = formData.get('mini_summary');
        const summary = formData.get('summary') || '';
        const keywords = formData.get('keywords'); // Expecting JSON string array
        const pdfFile = formData.get('pdf_file');
        const summaryPdfFile = formData.get('summary_pdf_file'); // Optional

        if (!title || !type || !rating || !mini_summary || !keywords || !pdfFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let parsedKeywords = [];
        try {
            parsedKeywords = JSON.parse(keywords);
            if (!Array.isArray(parsedKeywords) || parsedKeywords.length === 0) {
                return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 });
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid keywords format' }, { status: 400 });
        }

        const id = uuidv4();

        // Process PDF file
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure unique filename
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${id}_${sanitizedTitle}.pdf`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);

        // Process Summary PDF file (Optional)
        let summaryFileName = null;
        if (summaryPdfFile && summaryPdfFile.size > 0 && type === 'article') {
            const summaryBytes = await summaryPdfFile.arrayBuffer();
            const summaryBuffer = Buffer.from(summaryBytes);
            summaryFileName = `${id}_summary_${sanitizedTitle}.pdf`;
            const summaryFilePath = path.join(uploadDir, summaryFileName);
            await fs.writeFile(summaryFilePath, summaryBuffer);
        }

        const db = await getDb();

        await db.run(
            `INSERT INTO documents (id, title, type, pdf_file, rating, mini_summary, summary, keywords, summary_pdf_file) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, type, fileName, parseInt(rating, 10), mini_summary, summary, JSON.stringify(parsedKeywords), summaryFileName]
        );

        const newDocument = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
        if (newDocument) {
            newDocument.keywords = JSON.parse(newDocument.keywords)
        }

        return NextResponse.json(newDocument, { status: 201 });
    } catch (error) {
        console.error('Error creating document:', error);
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }
}
