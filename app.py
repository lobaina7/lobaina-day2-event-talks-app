import re
import requests
import feedparser
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_links(html):
    """
    Ensures all anchor tags have target="_blank" and rel="noopener noreferrer"
    so they open in a new tab.
    """
    if not html:
        return ""
    
    def replacer(match):
        tag = match.group(0)
        if 'target=' not in tag:
            tag = tag.replace('<a', '<a target="_blank" rel="noopener noreferrer"')
        else:
            tag = re.sub(r'target="[^"]*"', 'target="_blank" rel="noopener noreferrer"', tag)
        return tag
    
    return re.sub(r'<a\b[^>]*>', replacer, html)

def parse_release_notes(feed_content):
    feed = feedparser.parse(feed_content)
    parsed_entries = []
    
    for entry in feed.entries:
        title = entry.get('title', 'Unknown Date')
        updated = entry.get('updated', '')
        link = entry.get('link', '')
        entry_id = entry.get('id', '')
        summary = entry.get('summary', '')
        
        # Parse sections based on <h3> tags
        sections = []
        # Pattern to match <h3>Category</h3> followed by content up to next <h3> or end of string
        pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
        matches = pattern.findall(summary)
        
        for category, content in matches:
            category = category.strip()
            content = content.strip()
            cleaned_content = clean_html_links(content)
            sections.append({
                'category': category,
                'content': cleaned_content
            })
            
        if not sections:
            sections.append({
                'category': 'General',
                'content': clean_html_links(summary.strip())
            })
            
        parsed_entries.append({
            'title': title,
            'updated': updated,
            'link': link,
            'id': entry_id,
            'sections': sections
        })
        
    return {
        'title': feed.feed.get('title', 'BigQuery Release Notes'),
        'link': feed.feed.get('link', ''),
        'entries': parsed_entries
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        data = parse_release_notes(response.text)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
