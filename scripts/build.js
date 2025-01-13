const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
require('dotenv').config();

// Configure marked to respect line breaks
marked.setOptions({
    breaks: true
});

// GitHub Pages configuration
const BASE_URL = '/BYOA-Static-Site';

// Function to add base URL to absolute paths
function addBaseUrl(content) {
    return content
        .replace(/href="\//g, `href="${BASE_URL}/`)
        .replace(/src="\//g, `src="${BASE_URL}/`)
        .replace(/href='\/'/g, `href='${BASE_URL}/'`)
        .replace(/href="\/css\//g, `href="${BASE_URL}/css/`)
        .replace(/href="\/js\//g, `href="${BASE_URL}/js/`)
        .replace(/href="\/images\//g, `href="${BASE_URL}/images/`)
        .replace(/src="\/images\//g, `src="${BASE_URL}/images/`)
        .replace(/src="\/js\//g, `src="${BASE_URL}/js/`);
}

// Ensure build directories exist
fs.ensureDirSync('public');
fs.ensureDirSync('public/blog');
fs.ensureDirSync('public/css');
fs.ensureDirSync('public/js');

// Read templates
const pageTemplate = fs.readFileSync('src/templates/page.html', 'utf-8');
const blogTemplate = fs.readFileSync('src/templates/blog.html', 'utf-8');
const blogIndexTemplate = fs.readFileSync('src/templates/blog-index.html', 'utf-8');
const indexTemplate = fs.readFileSync('src/templates/index.html', 'utf-8');

// Write index.html
fs.writeFileSync('public/index.html', addBaseUrl(indexTemplate));

// Parse frontmatter
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        console.log('No frontmatter found in content');
        return {
            metadata: {},
            content: content
        };
    }

    const metadata = {};
    const frontmatterLines = match[1].split('\n');
    
    frontmatterLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex !== -1) {
                const key = trimmedLine.slice(0, colonIndex).trim();
                const value = trimmedLine.slice(colonIndex + 1).trim();
                metadata[key] = value;
            }
        }
    });

    return {
        metadata,
        content: match[2]
    };
}

// Build pages
function buildPages() {
    const pages = fs.readdirSync('src/pages');
    console.log('Found pages:', pages);
    pages.forEach(page => {
        if (page === 'index.md') return;
        
        console.log('Building page:', page);
        const markdown = fs.readFileSync(`src/pages/${page}`, 'utf-8');
        console.log('Read markdown content:', markdown.substring(0, 100) + '...');
        
        const { metadata, content } = parseFrontmatter(markdown);
        console.log('Parsed content length:', content.length);
        
        const html = marked(content);
        console.log('Generated HTML length:', html.length);
        
        let finalHtml = pageTemplate
            .replace('{{content}}', html)
            .replace('{{title}}', metadata.title || page.replace('.md', '').charAt(0).toUpperCase() + page.replace('.md', '').slice(1));
        
        finalHtml = addBaseUrl(finalHtml);
        
        const outputPath = `public/${page.replace('.md', '.html')}`;
        fs.writeFileSync(outputPath, finalHtml);
        console.log('Page built successfully:', outputPath);
        
        // Verify the file was written
        const written = fs.readFileSync(outputPath, 'utf-8');
        console.log('Written file size:', written.length, 'bytes');
    });
}

// Build blog posts
function buildBlog() {
    const posts = fs.readdirSync('src/blog');
    const allPosts = [];

    posts.forEach(post => {
        const markdown = fs.readFileSync(`src/blog/${post}`, 'utf-8');
        const { metadata, content } = parseFrontmatter(markdown);
        const html = marked(content);
        
        // Add slug to metadata
        metadata.slug = post.replace('.md', '');
        
        // Store post data for the index
        allPosts.push({
            ...metadata,
            description: metadata.description || '',
            date: metadata.date || 'No date',
            author: metadata.author || 'Anonymous',
            slug: metadata.slug
        });

        // Remove the h1 title since we're displaying it from metadata
        const contentWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>/, '');

        // Replace template variables
        let finalHtml = blogTemplate;
        // Replace each metadata field
        Object.entries(metadata).forEach(([key, value]) => {
            finalHtml = finalHtml.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        });
        // Replace content last
        finalHtml = finalHtml.replace('{{content}}', contentWithoutTitle);
        
        // Add base URL to paths
        finalHtml = addBaseUrl(finalHtml);
        
        const outputPath = `public/blog/${metadata.slug}.html`;
        fs.writeFileSync(outputPath, finalHtml);
    });

    // Generate blog index page
    const postsHtml = allPosts.map(post => `
        <article class="blog-preview">
            <h1><a href="${post.slug}.html">${post.title || 'Untitled Post'}</a></h1>
            <div class="post-meta">
                <span>${post.date}</span> • <span>${post.author}</span>
            </div>
            <p>${post.description}</p>
            <a href="${post.slug}.html" class="read-more">Read more →</a>
        </article>
    `).join('\n');

    let blogIndexHtml = blogIndexTemplate.replace('{{posts}}', postsHtml);
    blogIndexHtml = addBaseUrl(blogIndexHtml);
    fs.writeFileSync('public/blog/index.html', blogIndexHtml);
}

// Copy static assets
console.log('Copying static assets...');
fs.copySync('src/styles', 'public/css', { overwrite: true });
fs.copySync('src/images', 'public/images', { overwrite: true });
console.log('Static assets copied successfully');

// Run build
buildPages();
buildBlog(); 