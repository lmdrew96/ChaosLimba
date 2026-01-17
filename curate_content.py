#!/usr/bin/env python3
"""
ChaosLimbă Content Curator v2 - YouTube ToS Compliant
Stores YouTube metadata and embed links WITHOUT downloading videos
"""

import sqlite3
import hashlib
import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from dataclasses import dataclass
from enum import Enum

# Check dependencies
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from bs4 import BeautifulSoup
    from newspaper import Article
    import requests
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("\n📦 Install required packages:")
    print("pip install youtube-transcript-api beautifulsoup4 newspaper3k requests lxml")
    sys.exit(1)


# ============================================================================
# Data Models
# ============================================================================

class ContentType(Enum):
    VIDEO_LINK = "video_link"  # YouTube embed link, no download
    TEXT = "text"

class CEFRLevel(Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"

@dataclass
class Content:
    id: str
    type: str
    title: str
    source_url: str
    embed_url: Optional[str]  # YouTube embed URL
    level: str
    duration: Optional[int]
    transcript: Optional[str]
    tags: str
    channel: Optional[str]
    created_at: str


# ============================================================================
# Database Manager
# ============================================================================

class ContentDatabase:
    """SQLite database for content management"""
    
    def __init__(self, db_path: str = "chaoslimba_content.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.create_tables()
    
    def create_tables(self):
        """Initialize database schema"""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS content (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                source_url TEXT NOT NULL,
                embed_url TEXT,
                level TEXT NOT NULL,
                duration INTEGER,
                transcript TEXT,
                tags TEXT,
                channel TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_level ON content(level)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_type ON content(type)
        """)
        
        self.conn.commit()
        print(f"✅ Database initialized: {self.db_path}")
    
    def add_content(self, content: Content) -> bool:
        """Add content to database"""
        try:
            self.conn.execute("""
                INSERT INTO content VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                content.id,
                content.type,
                content.title,
                content.source_url,
                content.embed_url,
                content.level,
                content.duration,
                content.transcript,
                content.tags,
                content.channel,
                content.created_at
            ))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            print(f"⚠️  Content with ID {content.id} already exists")
            return False
    
    def get_all_content(self) -> List[dict]:
        """Get all content"""
        cursor = self.conn.execute("SELECT * FROM content ORDER BY created_at DESC")
        return [dict(row) for row in cursor.fetchall()]
    
    def get_content_by_level(self, level: str) -> List[dict]:
        """Get content filtered by CEFR level"""
        cursor = self.conn.execute(
            "SELECT * FROM content WHERE level = ? ORDER BY created_at DESC",
            (level,)
        )
        return [dict(row) for row in cursor.fetchall()]
    
    def get_content_by_type(self, content_type: str) -> List[dict]:
        """Get content filtered by type"""
        cursor = self.conn.execute(
            "SELECT * FROM content WHERE type = ? ORDER BY created_at DESC",
            (content_type,)
        )
        return [dict(row) for row in cursor.fetchall()]
    
    def search_content(self, query: str) -> List[dict]:
        """Search content by title or tags"""
        cursor = self.conn.execute("""
            SELECT * FROM content 
            WHERE title LIKE ? OR tags LIKE ?
            ORDER BY created_at DESC
        """, (f"%{query}%", f"%{query}%"))
        return [dict(row) for row in cursor.fetchall()]
    
    def get_stats(self) -> dict:
        """Get database statistics"""
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'video_link' THEN 1 ELSE 0 END) as videos,
                SUM(CASE WHEN type = 'text' THEN 1 ELSE 0 END) as text,
                SUM(duration) as total_duration
            FROM content
        """)
        return dict(cursor.fetchone())


# ============================================================================
# YouTube Curator (Metadata Only)
# ============================================================================

class YouTubeCurator:
    """Fetch YouTube metadata WITHOUT downloading videos (ToS compliant)"""
    
    def get_video_info(self, url: str) -> Optional[dict]:
        """
        Extract video metadata from YouTube URL
        Uses YouTube oEmbed API (official, ToS-compliant)
        """
        print(f"📹 Fetching YouTube metadata...")
        
        # Extract video ID from URL
        video_id = self._extract_video_id(url)
        if not video_id:
            print("❌ Invalid YouTube URL")
            return None
        
        try:
            # Use YouTube oEmbed API (official and allowed)
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            response = requests.get(oembed_url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch video info: {response.status_code}")
                return None
            
            data = response.json()
            
            # Get additional info by scraping the page (basic metadata only)
            page_url = f"https://www.youtube.com/watch?v={video_id}"
            page_response = requests.get(page_url, timeout=10)
            
            # Extract duration from page (rough estimate)
            duration = None
            if 'duration' in page_response.text:
                # This is a simplified extraction - in production you'd parse properly
                duration = None  # We'll leave this as None for now
            
            return {
                'video_id': video_id,
                'title': data.get('title', 'Unknown Title'),
                'channel': data.get('author_name', 'Unknown Channel'),
                'thumbnail': data.get('thumbnail_url'),
                'embed_url': f"https://www.youtube.com/embed/{video_id}",
                'source_url': f"https://www.youtube.com/watch?v={video_id}",
                'duration': duration
            }
            
        except Exception as e:
            print(f"❌ Error fetching video info: {e}")
            return None
    
    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from various YouTube URL formats"""
        import re
        
        patterns = [
            r'(?:v=|/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed/)([0-9A-Za-z_-]{11})',
            r'^([0-9A-Za-z_-]{11})$'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def get_transcript(self, video_id: str) -> Optional[str]:
        """Get Romanian transcript/subtitles (allowed by YouTube)"""
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try Romanian variants
            for lang in ['ro', 'ro-RO', 'ro-MD']:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    full_text = ' '.join([entry['text'] for entry in transcript.fetch()])
                    print(f"✅ Found transcript in {lang}")
                    return full_text
                except:
                    continue
            
            print("⚠️  No Romanian transcript available")
            return None
            
        except Exception as e:
            print(f"⚠️  Could not get transcript: {e}")
            return None
    
    def curate(self, url: str, level: str, tags: List[str]) -> Optional[Content]:
        """
        Full pipeline: Get metadata + transcript
        NO VIDEO DOWNLOAD (ToS compliant)
        """
        # Get video info
        video_info = self.get_video_info(url)
        if not video_info:
            return None
        
        # Get transcript
        transcript = self.get_transcript(video_info['video_id'])
        
        # Create Content object
        content = Content(
            id=video_info['video_id'],
            type='video_link',
            title=video_info['title'],
            source_url=video_info['source_url'],
            embed_url=video_info['embed_url'],
            level=level,
            duration=video_info['duration'],
            transcript=transcript,
            tags=','.join(tags),
            channel=video_info['channel'],
            created_at=datetime.now().isoformat()
        )
        
        return content


# ============================================================================
# Text/Article Curator (unchanged)
# ============================================================================

class TextCurator:
    """Scrape and process Romanian text content"""
    
    def __init__(self, download_dir: str = "./content/text"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
    
    def scrape_article(self, url: str) -> Optional[dict]:
        """Extract clean article text using newspaper3k"""
        print(f"📄 Scraping article...")
        
        try:
            article = Article(url, language='ro')
            article.download()
            article.parse()
            
            return {
                'title': article.title,
                'text': article.text,
                'publish_date': article.publish_date,
                'authors': article.authors,
            }
        except Exception as e:
            print(f"❌ Scraping failed: {e}")
            return None
    
    def curate(self, url: str, level: str, tags: List[str]) -> Optional[Content]:
        """Full pipeline: scrape + save + create Content object"""
        article_data = self.scrape_article(url)
        if not article_data:
            return None
        
        # Generate unique ID from URL
        content_id = hashlib.md5(url.encode()).hexdigest()[:12]
        
        # Save text to file
        text_path = self.download_dir / f"{content_id}.txt"
        text_path.write_text(article_data['text'], encoding='utf-8')
        
        content = Content(
            id=content_id,
            type='text',
            title=article_data['title'],
            source_url=url,
            embed_url=None,
            level=level,
            duration=None,
            transcript=article_data['text'],
            tags=','.join(tags),
            channel=None,
            created_at=datetime.now().isoformat()
        )
        
        return content


# ============================================================================
# CLI Interface
# ============================================================================

def cmd_add_youtube(args):
    """Add YouTube content (metadata only, no download)"""
    db = ContentDatabase(args.db)
    yt = YouTubeCurator()
    
    print(f"\n🎬 Adding YouTube content (metadata only, ToS compliant):")
    print(f"   URL: {args.url}")
    print(f"   Level: {args.level}")
    print(f"   Tags: {', '.join(args.tags)}")
    
    content = yt.curate(
        url=args.url,
        level=args.level,
        tags=args.tags
    )
    
    if content:
        if db.add_content(content):
            print(f"\n✅ Added: {content.title}")
            print(f"   ID: {content.id}")
            print(f"   Channel: {content.channel}")
            print(f"   Embed URL: {content.embed_url}")
            if content.transcript:
                print(f"   Transcript: Available ({len(content.transcript)} chars)")
        else:
            print(f"\n⚠️  Content already exists in database")
    else:
        print(f"\n❌ Failed to curate content")


def cmd_add_article(args):
    """Add article/text content"""
    db = ContentDatabase(args.db)
    text = TextCurator()
    
    print(f"\n📰 Adding article:")
    print(f"   URL: {args.url}")
    print(f"   Level: {args.level}")
    print(f"   Tags: {', '.join(args.tags)}")
    
    content = text.curate(
        url=args.url,
        level=args.level,
        tags=args.tags
    )
    
    if content:
        if db.add_content(content):
            print(f"\n✅ Added: {content.title}")
            print(f"   ID: {content.id}")
            print(f"   Words: ~{len(content.transcript.split())}")
        else:
            print(f"\n⚠️  Content already exists in database")
    else:
        print(f"\n❌ Failed to curate content")


def cmd_list(args):
    """List all content"""
    db = ContentDatabase(args.db)
    
    if args.level:
        items = db.get_content_by_level(args.level)
        print(f"\n📚 Content at {args.level} level:")
    elif args.type:
        items = db.get_content_by_type(args.type)
        print(f"\n📚 {args.type.title()} content:")
    else:
        items = db.get_all_content()
        print(f"\n📚 All content:")
    
    if not items:
        print("   (empty)")
        return
    
    for item in items:
        duration_str = f"{item['duration']}s" if item['duration'] else "N/A"
        print(f"\n   [{item['level']}] {item['title']}")
        print(f"      ID: {item['id']}")
        print(f"      Type: {item['type']}")
        if item['type'] == 'video_link':
            print(f"      Channel: {item['channel']}")
            print(f"      Embed: {item['embed_url']}")
        print(f"      Tags: {item['tags']}")
        print(f"      URL: {item['source_url']}")


def cmd_stats(args):
    """Show database statistics"""
    db = ContentDatabase(args.db)
    stats = db.get_stats()
    
    print(f"\n📊 Content Library Statistics:")
    print(f"   Total items: {stats['total']}")
    print(f"   YouTube videos: {stats['videos']}")
    print(f"   Text articles: {stats['text']}")
    
    if stats['total_duration']:
        hours = stats['total_duration'] / 3600
        print(f"   Total duration: {hours:.1f} hours")


def cmd_search(args):
    """Search content"""
    db = ContentDatabase(args.db)
    results = db.search_content(args.query)
    
    print(f"\n🔍 Search results for '{args.query}':")
    
    if not results:
        print("   No matches found")
        return
    
    for item in results:
        print(f"\n   {item['title']}")
        print(f"      Level: {item['level']} | Type: {item['type']}")
        print(f"      Tags: {item['tags']}")


def main():
    parser = argparse.ArgumentParser(
        description="ChaosLimbă Content Curator v2 - YouTube ToS Compliant",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Add YouTube video (metadata only, no download - ToS compliant!)
  python curate_content_v2.py add-youtube https://youtube.com/watch?v=... --level A2 --tags cooking,food
  
  # Add article
  python curate_content_v2.py add-article https://digi24.ro/article --level B2 --tags news,politics
  
  # List all content
  python curate_content_v2.py list
  
  # Show stats
  python curate_content_v2.py stats
        """
    )
    
    parser.add_argument('--db', default='chaoslimba_content.db', help='Database file path')
    
    subparsers = parser.add_subparsers(dest='command', required=True)
    
    # Add YouTube command
    youtube_parser = subparsers.add_parser('add-youtube', help='Add YouTube content (metadata only)')
    youtube_parser.add_argument('url', help='YouTube URL')
    youtube_parser.add_argument('--level', required=True, choices=['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    youtube_parser.add_argument('--tags', required=True, help='Comma-separated tags')
    youtube_parser.set_defaults(func=cmd_add_youtube)
    
    # Add article command
    article_parser = subparsers.add_parser('add-article', help='Add article/text content')
    article_parser.add_argument('url', help='Article URL')
    article_parser.add_argument('--level', required=True, choices=['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    article_parser.add_argument('--tags', required=True, help='Comma-separated tags')
    article_parser.set_defaults(func=cmd_add_article)
    
    # List command
    list_parser = subparsers.add_parser('list', help='List content')
    list_parser.add_argument('--level', choices=['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], help='Filter by level')
    list_parser.add_argument('--type', choices=['video_link', 'text'], help='Filter by type')
    list_parser.set_defaults(func=cmd_list)
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show statistics')
    stats_parser.set_defaults(func=cmd_stats)
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search content')
    search_parser.add_argument('query', help='Search query')
    search_parser.set_defaults(func=cmd_search)
    
    args = parser.parse_args()
    
    # Parse tags if present
    if hasattr(args, 'tags') and args.tags:
        args.tags = [tag.strip() for tag in args.tags.split(',')]
    
    # Execute command
    args.func(args)


if __name__ == '__main__':
    main()