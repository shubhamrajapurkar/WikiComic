# WikiComic

WikiComic is an innovative web application that transforms Wikipedia articles into engaging comic book stories. It uses AI to generate storylines and images, creating an interactive and educational experience.

## Features

- **Wikipedia Integration**: Search and extract content from Wikipedia articles
- **AI-Powered Story Generation**: Convert Wikipedia content into engaging comic book storylines
- **Dynamic Image Generation**: Create comic panels using AI image generation
- **Multiple Comic Styles**: Support for various comic art styles (manga, superhero, cartoon, noir, etc.)
- **Customizable Content**: Adjust story length and complexity for different age groups
- **Interactive UI**: User-friendly interface for creating and viewing comics

## Tech Stack

- **Backend**: Django (Python)
- **Frontend**: React.js
- **AI Services**:
  - Google Gemini API for image generation
  - Groq API for story generation
  - Hugging Face for additional AI capabilities
- **Database**: SQLite (development) / MongoDB (production)
- **Environment Management**: Python-dotenv

## Prerequisites

- Python 3.8+
- Node.js and npm
- API keys for:
  - Google Gemini
  - Groq
  - Hugging Face

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shubhamrajapurkar/WikiComic.git
cd WikiComic
```

2. Set up the backend:
```bash
cd wikicomic
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env` file in the `wikicomic/comic` directory with your API keys:
```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
```

4. Run database migrations:
```bash
python manage.py migrate
```

5. Start the Django development server:
```bash
python manage.py runserver
```

## Project Structure

```
WikiComic/
├── wikicomic/              # Django backend
│   ├── comic/             # Main app directory
│   │   ├── utils.py       # Core functionality
│   │   ├── views.py       # API endpoints
│   │   └── models.py      # Database models
│   ├── templates/         # HTML templates
│   └── media/            # Generated images
├── wikicomic1/            # Additional components
└── .env                   # Environment variables
```

## Usage

1. Search for a Wikipedia article
2. Select your preferred comic style and settings
3. Generate the comic storyline
4. Review and customize the generated panels
5. Save or share your comic

## API Endpoints

- `POST /api/search/`: Search Wikipedia articles
- `POST /api/generate/story/`: Generate comic storyline
- `POST /api/generate/images/`: Generate comic panels
- `GET /api/comics/`: List saved comics
- `GET /api/comics/<id>/`: Get specific comic details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Wikipedia for content
- Google Gemini for image generation
- Groq for story generation
- Hugging Face for AI capabilities

## Contact

For questions or support, please open an issue in the GitHub repository. 