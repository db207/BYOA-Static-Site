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
    // Don't modify paths that already have the base URL
    return content
        .replace(new RegExp(`href="(?!${BASE_URL}|https?:)\/`, 'g'), `href="${BASE_URL}/`)
        .replace(new RegExp(`src="(?!${BASE_URL}|https?:)\/`, 'g'), `src="${BASE_URL}/`);
}

// Ensure build directories exist
fs.ensureDirSync('public');
fs.ensureDirSync('public/blog');
fs.ensureDirSync('public/css');
fs.ensureDirSync('public/js');
fs.ensureDirSync('public/images');
fs.ensureDirSync('public/BYOA-Static-Site');
fs.ensureDirSync('public/BYOA-Static-Site/css');
fs.ensureDirSync('public/BYOA-Static-Site/images');

// Copy static assets first
console.log('Copying static assets...');
fs.copySync('src/styles', 'public/css', { overwrite: true });
fs.copySync('src/images', 'public/images', { overwrite: true });
// Copy for GitHub Pages path
fs.copySync('src/styles', 'public/BYOA-Static-Site/css', { overwrite: true });
fs.copySync('src/images', 'public/BYOA-Static-Site/images', { overwrite: true });
console.log('Static assets copied successfully');

// Read templates
const pageTemplate = fs.readFileSync('src/templates/page.html', 'utf-8');
const blogTemplate = fs.readFileSync('src/templates/blog.html', 'utf-8');
const blogIndexTemplate = fs.readFileSync('src/templates/blog-index.html', 'utf-8');
const indexTemplate = fs.readFileSync('src/templates/index.html', 'utf-8');

// Write index.html
const processedIndex = addBaseUrl(indexTemplate);
fs.writeFileSync('public/index.html', processedIndex);

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
            <h1><a href="${BASE_URL}/blog/${post.slug}.html">${post.title || 'Untitled Post'}</a></h1>
            <div class="post-meta">
                <span>${post.date}</span> • <span>${post.author}</span>
            </div>
            <p>${post.description}</p>
            <a href="${BASE_URL}/blog/${post.slug}.html" class="read-more">Read more →</a>
        </article>
    `).join('\n');

    let blogIndexHtml = blogIndexTemplate.replace('{{posts}}', postsHtml);
    blogIndexHtml = addBaseUrl(blogIndexHtml);
    
    // Write blog index to both /blog and /blog/ paths
    fs.writeFileSync('public/blog/index.html', blogIndexHtml);
    fs.writeFileSync('public/blog.html', blogIndexHtml);
}

// Run build
buildPages();
buildBlog(); 