import wikipedia
import os
import json
import time
import re
import logging
import requests
from datetime import datetime
from typing import Dict, List, Union, Optional, Any
import groq
from django.conf import settings
# import google.generativeai as genai
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
import base64
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file in the comic directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Monkey patch groq client initialization to prevent proxies issues
original_init = groq.Client.__init__

def patched_init(self, *args, **kwargs):
    # Remove 'proxies' from kwargs if present
    if 'proxies' in kwargs:
        del kwargs['proxies']
    # Call the original __init__ without proxies
    return original_init(self, *args, **kwargs)

# Apply the monkey patch
groq.Client.__init__ = patched_init

class WikipediaExtractor:
    def __init__(self, data_dir: str = "data", language: str = "en"):
        """
        Initialize the Wikipedia extractor
        
        Args:
            data_dir: Directory to store extracted data
            language: Wikipedia language code
        """
        self.data_dir = data_dir
        self.create_project_structure()
        wikipedia.set_lang(language)
        logger.info(f"WikipediaExtractor initialized with data directory: {data_dir}, language: {language}")

    def create_project_structure(self) -> None:
        """Create necessary directories for the project"""
        try:
            if not os.path.exists(self.data_dir):
                os.makedirs(self.data_dir)
                logger.info(f"Created data directory: {self.data_dir}")
            
            images_dir = os.path.join(self.data_dir, "images")
            if not os.path.exists(images_dir):
                os.makedirs(images_dir)
                logger.info(f"Created images directory: {images_dir}")
        except Exception as e:
            logger.error(f"Failed to create project structure: {str(e)}")
            raise RuntimeError(f"Failed to create project structure: {str(e)}")

    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize a string to be used as a filename
        
        Args:
            filename: Original filename string
            
        Returns:
            Sanitized filename safe for all operating systems
        """
        sanitized = re.sub(r'[\\/*?:"<>|]', '_', filename)
        return sanitized[:200]

    def search_wikipedia(self, query: str, results_limit: int = 15, retries: int = 3) -> Union[List[str], str]:
        """
        Search Wikipedia for a given query and return search results
        
        Args:
            query: Search query
            results_limit: Maximum number of results to return
            retries: Number of retries on network failure
            
        Returns:
            List of search results or error message string
        """
        if not query or not query.strip():
            return "Please enter a valid search term."
        
        query = query.strip()
        logger.info(f"Searching Wikipedia for: {query}")
        
        attempt = 0
        while attempt < retries:
            try:
                search_results = wikipedia.search(query, results=results_limit)
                
                if not search_results:
                    suggestions = wikipedia.suggest(query)
                    if suggestions:
                        logger.info(f"No results found. Suggesting: {suggestions}")
                        return f"No exact results found. Did you mean: {suggestions}?"
                    logger.info("No results found and no suggestions available")
                    return "No results found for your search."
                
                logger.info(f"Found {len(search_results)} results for query: {query}")
                return search_results
                
            except ConnectionError as e:
                attempt += 1
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"Connection error (attempt {attempt}/{retries}): {str(e)}. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            except Exception as e:
                logger.error(f"Search error: {str(e)}")
                return f"An error occurred while searching: {str(e)}"
        
        return "Failed to connect to Wikipedia after multiple attempts. Please check your internet connection."

    def get_page_info(self, title: str, retries: int = 3) -> Dict[str, Any]:
        """
        Get detailed information about a specific Wikipedia page
        
        Args:
            title: Page title to retrieve
            retries: Number of retries on network failure
            
        Returns:
            Dictionary containing page information or error details
        """
        logger.info(f"Getting page info for: {title}")
        
        attempt = 0
        while attempt < retries:
            try:
                try:
                    page = wikipedia.page(title, auto_suggest=False)
                except wikipedia.DisambiguationError as e:
                    logger.info(f"Disambiguation error for '{title}'. Returning options.")
                    return {
                        "error": "Disambiguation Error",
                        "options": e.options[:15],
                        "message": "Multiple matches found. Please be more specific."
                    }
                except wikipedia.PageError:
                    try:
                        logger.info(f"Exact page '{title}' not found. Trying with auto-suggest.")
                        page = wikipedia.page(title)
                    except Exception as inner_e:
                        logger.error(f"Page retrieval error: {str(inner_e)}")
                        return {
                            "error": "Page Error",
                            "message": f"Page '{title}' does not exist."
                        }
                
                page_info = {
                    "title": page.title,
                    "url": page.url,
                    "content": page.content,
                    "summary": page.summary,
                    "references": page.references,
                    "categories": page.categories,
                    "links": page.links,
                    "images": page.images,
                    "timestamp": datetime.now().isoformat()
                }
                
                # Save the extracted data
                self._save_extracted_data(page_info)
                
                logger.info(f"Successfully retrieved page info for: {title}")
                return page_info
                
            except ConnectionError as e:
                attempt += 1
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"Connection error (attempt {attempt}/{retries}): {str(e)}. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            except Exception as e:
                logger.error(f"Unexpected error getting page info: {str(e)}")
                return {
                    "error": "General Error",
                    "message": f"An error occurred: {str(e)}"
                }
        
        return {
            "error": "Connection Error",
            "message": "Failed to connect to Wikipedia after multiple attempts. Please check your internet connection."
        }
        
    def _save_extracted_data(self, page_info: Dict[str, Any]) -> None:
        """
        Save extracted data to a JSON file
        
        Args:
            page_info: Dictionary containing page information
        """
        try:
            safe_title = self.sanitize_filename(page_info["title"])
            filename = f"{self.data_dir}/{safe_title}_data.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(page_info, f, ensure_ascii=False, indent=2)
                
            logger.info(f"Saved extracted data to: {filename}")
        except Exception as e:
            logger.error(f"Failed to save extracted data: {str(e)}")

class StoryGenerator:
    def __init__(self, api_key: str = None):
        """
        Initialize the Groq story generator
        
        Args:
            api_key: Groq API key (optional, will use environment variable if not provided)
        """
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
            
        # Initialize client with the patched init method (no proxy handling needed)
        self.client = groq.Client(api_key=self.api_key)
        logger.info("StoryGenerator initialized with Groq client")

    def generate_comic_storyline(self, title: str, content: str, target_length: str = "medium") -> str:
        """
        Generate a comic storyline from Wikipedia content
        
        Args:
            title: Title of the Wikipedia article
            content: Content of the Wikipedia article
            target_length: Desired length of the story (short, medium, long)
            
        Returns:
            Generated comic storyline
        """
        logger.info(f"Generating comic storyline for: {title} with target length: {target_length}")
        
        # Map target length to approximate word count
        length_map = {
            "short": 500,
            "medium": 1000,
            "long": 2000
        }
        
        word_count = length_map.get(target_length, 1000)
        
        # Check content length and truncate if necessary to avoid token limits
        max_chars = 15000
        if len(content) > max_chars:
            logger.info(f"Content too long ({len(content)} chars), truncating to {max_chars} chars")
            content = content[:max_chars] + "..."
        
        # Create prompt for the LLM
        prompt = f"""
        Create an engaging and detailed comic book storyline based on the following Wikipedia article about "{title}".
        
        The storyline should:
        1. Be approximately {word_count} words
        2. Capture the most important facts and details from the article
        3. Have a clear beginning, middle, and end
        4. Include vivid descriptions of key scenes suitable for comic panels
        5. Feature compelling characters based on real figures from the topic
        6. Include dialogue suggestions for major moments
        7. Be organized into distinct scenes or chapters
        8. Balance educational content with entertainment value
        
        Here is the Wikipedia content to base your storyline on:
        
        {content}
        
        FORMAT YOUR RESPONSE AS:
        # {title}: Comic Storyline
        
        ## Overview
        [Brief overview of the storyline]
        
        ## Main Characters
        [List of main characters with short descriptions]
        
        ## Act 1: [Title]
        [Detailed storyline for Act 1 with scene descriptions and key dialogue]
        
        ## Act 2: [Title]
        [Detailed storyline for Act 2 with scene descriptions and key dialogue]
        
        ## Act 3: [Title]
        [Detailed storyline for Act 3 with scene descriptions and key dialogue]
        
        ## Key Visuals
        [Suggestions for important visual elements to include in the comic]
        """
        
        try:
            # Generate storyline using Groq
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert comic book writer and historian who creates engaging, accurate, and visually compelling storylines based on real information."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",  # Using Llama 3 model
                temperature=0.7,
                max_tokens=4000,
                top_p=0.9
            )
            
            storyline = response.choices[0].message.content
            logger.info(f"Successfully generated comic storyline for: {title}")
            
            return storyline
            
        except Exception as e:
            logger.error(f"Failed to generate storyline: {str(e)}")
            return f"Error generating storyline: {str(e)}"

    def generate_scene_prompts(self, title: str, storyline: str, comic_style: str, num_scenes: int = 10, 
                              age_group: str = "general", education_level: str = "standard") -> List[str]:
        """
        Generate detailed scene prompts for comic panels based on the storyline
        
        Args:
            title: Title of the article
            storyline: Generated comic storyline
            comic_style: Selected comic art style
            num_scenes: Number of scene prompts to generate (default 10)
            age_group: Target age group (kids, teens, general, adult)
            education_level: Education level for content complexity (basic, standard, advanced)
            
        Returns:
            List of scene prompts for image generation
        """
        logger.info(f"Generating {num_scenes} scene prompts for comic in {comic_style} style, targeting {age_group} with {education_level} education level")
        
        # Prepare style-specific guidance based on comic style
        style_guidance = {
            "manga": "Use manga-specific visual elements like speed lines, expressive emotions, and distinctive panel layouts. Character eyes should be larger, with detailed hair and simplified facial features. Use black and white with screen tones for shading.",
            "superhero": "Use bold colors, dynamic poses with exaggerated anatomy, dramatic lighting, and action-oriented compositions. Include detailed musculature and costumes with strong outlines and saturated colors.",
            "cartoon": "Use simplified, exaggerated character features with bold outlines. Employ bright colors, expressive faces, and playful physics. Include visual effects like motion lines and impact stars.",
            "noir": "Use high-contrast black and white or muted colors with dramatic shadows. Feature low-key lighting, rain effects, and urban settings. Characters should have realistic proportions with hardboiled expressions.",
            "european": "Use detailed backgrounds with architectural precision and clear line work. Character designs should be semi-realistic with consistent proportions. Panel layouts should be regular and methodical.",
            "indie": "Use unconventional art styles with personal flair. Panel layouts can be experimental and fluid. Line work may be sketchy or deliberately unpolished. Colors can be watercolor-like or limited palette.",
            "retro": "Use halftone dots for shading, slightly faded colors, and classic panel compositions. Character designs should reflect the comics of the 50s-70s with simplified but distinctive features.",
        }.get(comic_style.lower(), f"Incorporate distinctive visual elements of {comic_style} style consistently in all panels.")
        
        # Prepare age-appropriate guidance
        age_guidance = {
            "kids": "Use simple, clear vocabulary and straightforward concepts. Avoid complex themes, frightening imagery, or adult situations. Characters should be expressive and appealing. Educational content should be presented in an engaging, accessible way.",
            "teens": "Use relatable language and themes important to adolescents. Include more nuanced emotional content and moderate complexity. Educational aspects can challenge readers while remaining accessible.",
            "general": "Balance accessibility with depth. Include some complexity in both themes and visuals while remaining broadly appropriate. Educational content should be informative without being overly technical.",
            "adult": "Include sophisticated themes, complex characterizations, and nuanced storytelling. Educational content can be presented with full complexity and technical detail where appropriate."
        }.get(age_group.lower(), "Create content appropriate for a general audience with balanced accessibility and depth.")
        
        # Prepare education level guidance
        education_guidance = {
            "basic": "Use simple vocabulary, clear explanations, and focus on foundational concepts. Break down complex ideas into easily digestible components with examples.",
            "standard": "Use moderate vocabulary and present concepts with appropriate depth for general understanding. Balance educational content with narrative engagement.",
            "advanced": "Use field-specific terminology where appropriate and explore concepts in depth. Present nuanced details and sophisticated analysis of the subject matter."
        }.get(education_level.lower(), "Present educational content with balanced complexity suitable for interested general readers.")
        
        # Create prompt for the LLM
        prompt = f"""
        Based on the following comic storyline about "{title}", create exactly {num_scenes} sequential scene prompts for generating comic panels.

        Each scene prompt MUST:
        1. Follow a logical narrative sequence from beginning to end
        2. Include DETAILED visual descriptions of the scene, setting, characters, and actions
        3. Include SPECIFIC dialogue text between characters (this is crucial as dialogue text will be directly included in speech bubbles)
        4. Ensure all dialogue is grammatically correct and appropriate for the target audience
        5. Maintain character consistency throughout all scenes
        6. Be self-contained but connect logically to the previous and next scenes
        7. Incorporate specific visual elements from the {comic_style} comic art style

        IMPORTANT PARAMETERS TO FOLLOW:
        - Comic Style: {comic_style} — {style_guidance}
        - Age Group: {age_group} — {age_guidance}
        - Education Level: {education_level} — {education_guidance}

        Here is the comic storyline to convert into scene prompts:
        
        {storyline}
        
        FORMAT EACH SCENE PROMPT AS:
        Scene [number]: [Brief scene title]
        Visual: [Extremely detailed visual description of the scene including setting, characters, positions, expressions, actions, and any specific visual elements]
        Dialog: [Character 1 name]: "[Exact dialogue text for speech bubble]"
        Dialog: [Character 2 name]: "[Exact dialogue text for speech bubble]"
        Style: {comic_style} style with [specific stylistic elements to emphasize].
        
        PROVIDE EXACTLY {num_scenes} SCENES IN SEQUENTIAL ORDER.
        MAKE SURE EACH SCENE HAS AT LEAST ONE DIALOG LINE, as these will be directly included in speech bubbles.
        ENSURE ALL DIALOG TEXT IS GRAMMATICALLY CORRECT and appropriate for the target audience.
        SCENE DESCRIPTIONS MUST BE EXTREMELY DETAILED to ensure the image generator can create accurate images.
        """
        
        try:
            # Generate scene prompts using Groq
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert comic book artist and writer who creates detailed, engaging scene descriptions for comic panels with consistent characters and storylines. You always ensure dialog is grammatically correct and include specific dialog text for each scene."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",  # Using Llama 3 model
                temperature=0.7,
                max_tokens=4000,
                top_p=0.9
            )
            
            scenes_text = response.choices[0].message.content
            
            # Process the text to extract individual scene prompts
            scene_prompts = []
            scene_pattern = re.compile(r'Scene \d+:.*?(?=Scene \d+:|$)', re.DOTALL)
            matches = scene_pattern.findall(scenes_text)
            
            for match in matches:
                scene_prompts.append(match.strip())
            
            # If we didn't get enough scenes, pad with generic ones that include dialog
            while len(scene_prompts) < num_scenes:
                scene_num = len(scene_prompts) + 1
                scene_prompts.append(f"""Scene {scene_num}: Additional scene from {title}
                Visual: A character from the story stands in a relevant setting from {title}, looking thoughtful.
                Dialog: Character: "This is an important moment in the story of {title}."
                Style: {comic_style} style with appropriate elements for {age_group} audience.""")
            
            # If we got too many scenes, truncate
            scene_prompts = scene_prompts[:num_scenes]
            
            # Validate each scene prompt to ensure it has dialog
            validated_prompts = []
            for i, prompt in enumerate(scene_prompts):
                scene_num = i + 1
                
                # Check if dialog is present
                if "Dialog:" not in prompt:
                    # Add default dialog if missing
                    prompt += f"\nDialog: Character: \"This is scene {scene_num} of our story about {title}.\""
                    logger.warning(f"Added missing dialog to scene {scene_num}")
                
                validated_prompts.append(prompt)
            
            logger.info(f"Successfully generated {len(validated_prompts)} scene prompts")
            return validated_prompts
            
        except Exception as e:
            logger.error(f"Failed to generate scene prompts: {str(e)}")
            return [f"Error generating scene prompt: {str(e)}"]

class ComicImageGenerator:
    def __init__(self, api_key: str = None):
        """
        Initialize the Comic Image Generator
        
        Args:
            api_key: Google Gemini API key (optional, will use environment variable if not provided)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
            
        client = genai.Client(api_key=self.api_key)
        self.client = client
        self.logger = logging.getLogger(__name__)
        logger.info("ComicImageGenerator initialized with Gemini API")

    def _extract_dialog_from_prompt(self, scene_prompt: str) -> list:
        """Extract dialog lines from the scene prompt for adding to the image"""
        dialog_lines = []
        
        # Match lines starting with "Dialog:" followed by character name and dialog
        dialog_pattern = re.compile(r'Dialog:\s*([^:]+?):\s*"([^"]+)"', re.IGNORECASE)
        matches = dialog_pattern.findall(scene_prompt)
        
        for character, line in matches:
            dialog_lines.append((character.strip(), line.strip()))
        
        # If no dialog found with the structured format, try to extract any quoted text
        if not dialog_lines:
            # Look for quoted text with character attribution
            alt_pattern = re.compile(r'([^:]+?):\s*"([^"]+)"')
            matches = alt_pattern.findall(scene_prompt)
            for character, line in matches:
                if "style" not in character.lower() and "visual" not in character.lower():
                    dialog_lines.append((character.strip(), line.strip()))
        
        # If still no dialog, add a generic one
        if not dialog_lines:
            dialog_lines.append(("Character", "This is an important moment in our story."))
            logger.warning("No dialog found in scene prompt, using generic dialog")
        
        return dialog_lines

    def _enhance_scene_prompt(self, scene_prompt: str) -> str:
        """Enhance the scene prompt to improve image generation accuracy"""
        # Extract the main visual description
        visual_match = re.search(r'Visual:\s*(.+?)(?=\nDialog:|Style:|$)', scene_prompt, re.DOTALL)
        
        if visual_match:
            visual_description = visual_match.group(1).strip()
            
            # Extract style information
            style_match = re.search(r'Style:\s*(.+?)$', scene_prompt, re.DOTALL)
            style_info = style_match.group(1).strip() if style_match else ""
            
            # Create an enhanced prompt focused on the visual elements
            enhanced_prompt = f"""
            Generate a detailed comic panel showing:
            {visual_description}
            
            Style details: {style_info}
            
            Important:
            - Create a high-quality, detailed comic panel with clear characters and setting.
            - Accurately represent the scene exactly as described.
            - Ensure all dialogue is grammatically correct and fits the tone of the scene.
            - Leave appropriate space for dialogue bubbles as part of the composition.
            """
            
            return enhanced_prompt
        
        return scene_prompt  # Return original if we couldn't extract visual description

    def generate_comic_image(self, prompt, output_path, scene_number):
        """
        Generate a comic image based on a scene prompt
        
        Args:
            prompt: Textual description of the scene
            output_path: Path to save the generated image
            scene_number: Scene number for logging
            
        Returns:
            Boolean indicating success
        """
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            self.logger.info(f"Generating image for scene {scene_number} at {output_path}")
            
            # Extract dialog lines before enhancing the prompt
            dialog_lines = self._extract_dialog_from_prompt(prompt)
            
            # Enhance the prompt for better image generation
            enhanced_prompt = self._enhance_scene_prompt(prompt)
            
            self.logger.info(f"Using enhanced prompt: {enhanced_prompt[:100]}...")

            # Using Gemini API for image generation
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-exp-image-generation",
                contents=[enhanced_prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['TEXT', 'IMAGE']
                )
            )

            # Process the response
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    # Save the image
                    image = Image.open(BytesIO(part.inline_data.data))
                    image.save(output_path)
                    self.logger.info(f"Successfully generated and saved image for scene {scene_number}")
                    return True

            self.logger.error("No image data found in Gemini response")
            return False

        except Exception as e:
            self.logger.error(f"Error generating image for scene {scene_number}: {str(e)}", exc_info=True)
            return False