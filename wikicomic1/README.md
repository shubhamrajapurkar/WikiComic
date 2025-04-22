# WikiComic Generator

A full-stack web application that generates educational comics based on user-selected topics and preferences.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express

## Features

- Interactive landing page to input topic and preferences
- Dynamic comic viewer with navigation controls
- Key concepts sidebar for educational content
- Responsive design for mobile and desktop

## Project Structure

```
wikicomic/
├── client/            # React frontend
│   ├── public/        # Static files
│   └── src/           # React source code
│       ├── components/ # React components
│       └── ...
└── server/            # Express backend
    ├── index.js       # Server entry point
    └── ...
```

## Running the Application

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (v6 or higher)

### Starting the Backend

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will run on http://localhost:5000

### Starting the Frontend

1. Open a new terminal and navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter a topic and select complexity level and comic style
3. Click "Generate Comic" to see the educational comic
4. Navigate through pages using the Previous/Next buttons
5. View key takeaways in the sidebar

## Current Limitations

This is a prototype with mock data. In a production version:
- The backend would integrate with external APIs or AI models to generate actual comic content
- Authentication and user accounts could be added
- Comics could be saved/shared 