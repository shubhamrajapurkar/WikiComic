# WikiComic - AI-Generated Comics from Wikipedia

WikiComic is a web application that transforms Wikipedia articles into engaging comic strips using AI.

## Architecture

This application uses a database-free architecture, relying solely on:

1. **In-Memory Storage**: Comic data is stored in memory using the `ComicStore` class.
2. **RESTful API**: All data access is handled through API calls.
3. **File System**: Comic images are stored in the file system.

### Key Components:

- **ComicStore**: Provides in-memory storage for comic data
- **WikipediaExtractor**: Fetches and processes Wikipedia articles
- **StoryGenerator**: Generates comic storylines from Wikipedia content (using Groq AI)
- **ComicImageGenerator**: Creates comic images (using Hugging Face)

## API Endpoints

- `POST /api/generate/`: Generate a new comic from a Wikipedia article
- `GET /api/status/<request_id>/`: Check the status of comic generation
- `GET /api/comic/<comic_id>/`: Get comic data by ID
- `POST /api/search/`: Search Wikipedia for articles

## Web Views

- `/`: Home page with search form
- `/search/`: Display Wikipedia search results
- `/generate/`: Process comic generation
- `/comic/<comic_id>/`: View a generated comic

## Setup and Run

1. Ensure you have Python 3.8+ installed
2. Install dependencies: `pip install -r requirements.txt`
3. Start the development server: `python manage.py runserver`

The application requires:
- Groq API key (for story generation)
- Hugging Face token (for image generation)

These are configured in `settings.py`. 