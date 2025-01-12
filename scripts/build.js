const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

// Ensure build directories exist
fs.ensureDirSync('public');
fs.ensureDirSync('public/blog');
fs.ensureDirSync('public/css');
fs.ensureDirSync('public/js');

// Read and process templates
const pageTemplate = fs.readFileSync('src/templates/page.html', 'utf-8');
const blogTemplate = fs.readFileSync('src/templates/blog.html', 'utf-8');

// Build pages
function buildPages() {
    const pages = fs.readdirSync('src/pages');
    pages.forEach(page => {
        const markdown = fs.readFileSync(`src/pages/${page}`, 'utf-8');
        const html = marked(markdown);
        const finalHtml = pageTemplate.replace('{{content}}', html);
        
        const outputPath = `public/${page.replace('.md', '.html')}`;
        fs.writeFileSync(outputPath, finalHtml);
    });
}

// Build blog posts
function buildBlog() {
    const posts = fs.readdirSync('src/blog');
    posts.forEach(post => {
        const markdown = fs.readFileSync(`src/blog/${post}`, 'utf-8');
        const html = marked(markdown);
        const finalHtml = blogTemplate.replace('{{content}}', html);
        
        const outputPath = `public/blog/${post.replace('.md', '.html')}`;
        fs.writeFileSync(outputPath, finalHtml);
    });
}

// Copy static assets
fs.copySync('src/styles', 'public/css');

// Run build
buildPages();
buildBlog(); 