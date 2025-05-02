# 📚 WikiComic

**WikiComic** is an innovative web application that transforms Wikipedia articles into engaging, illustrated comic book stories. By integrating AI-powered language and image generation, WikiComic offers a fun, educational, and interactive way to explore knowledge.

---

## 🚀 Features

* 🔍 **Wikipedia Integration**
  Search and retrieve Wikipedia content seamlessly.

* 🧠 **AI-Powered Story Generation**
  Automatically convert factual content into comic-style narratives using Groq's LLMs.

* 🖼️ **Dynamic Image Generation**
  Generate comic book-style images using Google Gemini.

* 🎨 **Multiple Comic Styles**
  Choose from various comic art styles — Manga, Superhero, Cartoon, Noir, and more.

* 🎛️ **Customizable Content**
  Adjust story length, tone, and complexity for different age groups and educational levels.

* 🖥️ **Interactive UI**
  A modern, user-friendly frontend built with React.js to easily search, generate, and view comics.

---

## 🧱 Tech Stack

| Component          | Technology                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Frontend**       | React.js                                                                                        |
| **Backend**        | Django (Python)                                                                                 |
| **Database**       | SQLite (dev) / MongoDB (prod)                                                                   |
| **AI Services**    | Google Gemini (image generation) <br> Groq API (story generation) <br> Hugging Face (NLP tools) |
| **Env Management** | Python-dotenv                                                                                   |

---

## ⚙️ Prerequisites

* Python 3.8+
* Node.js and npm
* API Keys for:

  * Google Gemini
  * Groq
  * Hugging Face

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shubhamrajapurkar/WikiComic.git
cd WikiComic
```

### 2. Set Up the Backend

```bash
cd wikicomic
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Add Environment Variables

Create a `.env` file inside the `wikicomic/comic/` directory and add:

```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Start the Development Server

```bash
python manage.py runserver
```

---

## 📒 Project Structure

```
WikiComic/
├── wikicomic/              # Django backend
│   ├── comic/              # Main application logic
│   │   ├── utils.py        # Core utility functions
│   │   ├── views.py        # API views
│   │   └── models.py       # Django models
│   ├── templates/          # Optional HTML templates
│   └── media/              # AI-generated images
├── wikicomic1/             # Additional components or modules
└── .env                    # Environment variables (API keys)
```

---

## 📖 Usage Guide

1. Enter a search term for a Wikipedia article.
2. Choose a comic art style and adjust complexity settings.
3. Generate the storyline using AI.
4. View, edit, and regenerate comic panels.
5. Save or share your personalized comic.

---

## 📱 API Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| POST   | `/api/search/`          | Search Wikipedia articles     |
| POST   | `/api/generate/story/`  | Generate AI-based comic story |
| POST   | `/api/generate/images/` | Generate comic panel images   |
| GET    | `/api/comics/`          | Retrieve saved comics         |
| GET    | `/api/comics/<id>/`     | View specific comic details   |

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a new feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:

   ```bash
   git commit -m "Add: Your meaningful message"
   ```
4. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request 🚀

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---

## 🙏 Acknowledgments

* [Wikipedia](https://www.wikipedia.org/) for open content
* [Google Gemini](https://deepmind.google/technologies/gemini/) for image generation
* [Groq](https://groq.com/) for LLM story generation
* [Hugging Face](https://huggingface.co/) for NLP tools and models

---

## 📨 Contact

For issues, suggestions, or support, please open an [Issue](https://github.com/shubhamrajapurkar/WikiComic/issues) on GitHub.
