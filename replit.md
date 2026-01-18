# ChaosLimba

## Overview
ChaosLimba is an AI-native language learning application focused on Romanian language acquisition through "productive confusion" methodology. The prototype demonstrates the core concepts of structured chaos learning.

## Project Structure
- `chaoslimba-prototype.html` - Main interactive React prototype (single-file React app using CDN)
- `curate_content.py` - Python utility for curating YouTube content and text for the learning platform
- `server.py` - Simple Python HTTP server for local development
- `Guiding Documentation/` - Project philosophy and development guides
- `ML Resources/` - Machine learning datasets and system architecture documentation

## Running the Application
The application runs on port 5000 using a Python HTTP server that serves the HTML prototype.

## Key Features (Prototype)
- Error Garden - Tracks and visualizes learning errors
- Adaptive System - Adjusts to learner proficiency
- Deep Fog - Immersive learning mode
- Chaos Window - Time-limited learning challenges
- Mystery Shelf - Collection of unexplored vocabulary

## Development Notes
- The prototype uses React 18, React DOM, and Tailwind CSS via CDN
- Babel in-browser transformation is used for JSX
- The Python curate_content.py script requires additional packages (youtube-transcript-api, beautifulsoup4, newspaper3k, requests, lxml)

## Deployment
Configured for static file deployment serving the current directory.
