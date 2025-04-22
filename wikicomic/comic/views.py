from django.shortcuts import render, redirect
from django.contrib import messages
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os
import json
from datetime import datetime
from .models import ComicStore
from .utils import WikipediaExtractor, StoryGenerator, ComicImageGenerator
import logging
import threading
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Dictionary to store generation status
generation_status = {}

def update_status(request_id, status_data):
    cache.set(f'comic_status_{request_id}', status_data, timeout=3600)  # 1 hour timeout

def get_status(request_id):
    return cache.get(f'comic_status_{request_id}')

def generate_comic_async(request_id, title, hf_token, options=None):
    """
    Asynchronously generate a comic from a Wikipedia article.
    
    Args:
        request_id: Unique ID for this request
        title: Wikipedia article title
        hf_token: Hugging Face API token for image generation
        options: Dictionary of optional parameters (comic_style, target_length, num_scenes)
    """
    if options is None:
        options = {}
    
    comic_style = options.get('comic_style', 'comic book')
    target_length = options.get('target_length', 'medium')
    num_scenes = options.get('num_scenes', 8)
    age_group = options.get('age_group', 'general')
    education_level = options.get('education_level', 'standard')
    
    try:
        update_status(request_id, {
            'status': 'STARTED',
            'message': 'Starting comic generation...',
            'progress': 0
        })
        
        logger.info(f"Starting comic generation for title: {title}")
        
        # Get Wikipedia content
        wiki = WikipediaExtractor()
        page_info = wiki.get_page_info(title)
        if not page_info or 'error' in page_info:
            error_msg = page_info.get('message', 'Failed to fetch Wikipedia content') if page_info else 'Failed to fetch Wikipedia content'
            logger.error(f"Wikipedia error: {error_msg}")
            update_status(request_id, {
                'status': 'ERROR',
                'message': error_msg,
                'progress': 0
            })
            return False

        # Create comic entry in memory
        comic_id = ComicStore.create_comic(
            title=page_info['title'],
            wikipedia_url=page_info['url'],
            storyline=''  # Will be updated later
        )
        
        update_status(request_id, {
            'status': 'IN_PROGRESS',
            'message': 'Generating storyline...',
            'progress': 10
        })

        # Sanitize title for file paths
        sanitized_title = "".join(c for c in page_info['title'] if c.isalnum() or c in (' ', '-', '_'))
        
        # Create media directories
        media_root = settings.MEDIA_ROOT
        comic_scenes_dir = os.path.join(media_root, 'comic_scenes', sanitized_title)
        os.makedirs(comic_scenes_dir, exist_ok=True)
        
        # Generate storyline
        story_generator = StoryGenerator(settings.GROQ_API_KEY)
        storyline = story_generator.generate_comic_storyline(
            title=page_info['title'],
            content=page_info['content'],
            target_length=target_length
        )
        
        # Update comic with storyline
        ComicStore.update_comic(comic_id, {'storyline': storyline})
        
        update_status(request_id, {
            'status': 'IN_PROGRESS',
            'message': 'Creating scene prompts...',
            'progress': 30
        })
        
        # Generate scene prompts
        scene_prompts = story_generator.generate_scene_prompts(
            title=page_info['title'],
            storyline=storyline,
            comic_style=comic_style,
            num_scenes=num_scenes,
            age_group=age_group,
            education_level=education_level
        )
        
        # Store scene prompts
        ComicStore.update_comic(comic_id, {'scene_prompts': scene_prompts})
        
        update_status(request_id, {
            'status': 'IN_PROGRESS',
            'message': 'Generating comic images...',
            'progress': 40
        })
        
        # Initialize image generator
        image_generator = ComicImageGenerator()  # Using default API key
        
        total_scenes = len(scene_prompts)
        for i, prompt in enumerate(scene_prompts, 1):
            update_status(request_id, {
                'status': 'IN_PROGRESS',
                'message': f'Generating scene {i} of {total_scenes}...',
                'progress': 40 + (i * 60 // total_scenes)
            })
            
            scene_filename = f"scene_{i}.png"
            scene_path = os.path.join(comic_scenes_dir, scene_filename)
            relative_path = os.path.join('comic_scenes', sanitized_title, scene_filename)
            
            # Generate the image
            success = image_generator.generate_comic_image(
                prompt=prompt,
                output_path=scene_path,
                scene_number=i
            )
            
            if success:
                # Save scene to memory
                ComicStore.add_scene(
                    comic_id=comic_id,
                    scene_number=i,
                    prompt=prompt,
                    image_path=relative_path
                )
                logger.info(f"Successfully saved scene {i}")
            else:
                logger.error(f"Failed to generate scene {i}")
        
        # Update comic status
        ComicStore.update_status(comic_id, 'completed')
        
        logger.info(f"Comic generation completed for {title}")
        update_status(request_id, {
            'status': 'COMPLETED',
            'message': 'Comic generation completed!',
            'progress': 100,
            'comic_id': comic_id
        })
        return True
        
    except Exception as e:
        logger.error(f"Error in generate_comic_async: {str(e)}", exc_info=True)
        if 'comic_id' in locals():
            ComicStore.update_status(comic_id, 'failed', str(e))
        update_status(request_id, {
            'status': 'ERROR',
            'message': str(e),
            'progress': 0
        })
        return False

def home(request):
    """Home page with search form"""
    # Get comics that have already been generated
    comics = ComicStore.get_all_comics()
    
    # Pass the 6 most recent completed comics to the template
    recent_comics = [comic for comic in comics if comic.get('status') == 'completed']
    recent_comics = sorted(recent_comics, key=lambda x: x.get('created_at', ''), reverse=True)[:6]
    
    return render(request, 'comic/home.html', {
        'recent_comics': recent_comics
    })

def search_wikipedia(request):
    """Search Wikipedia for articles"""
    if request.method == 'POST':
        query = request.POST.get('query')
        if not query:
            messages.error(request, 'Please enter a search term.')
            return redirect('home')
        
        wiki_extractor = WikipediaExtractor()
        search_results = wiki_extractor.search_wikipedia(query)
        
        if isinstance(search_results, str):
            messages.error(request, search_results)
            return redirect('home')
            
        return render(request, 'comic/search_results.html', {
            'results': search_results,
            'query': query
        })
    return redirect('home')

def comic_options(request):
    """Shows options for comic generation after selecting a Wikipedia article"""
    title = request.GET.get('title')
    if not title:
        messages.error(request, 'No title specified.')
        return redirect('home')
    
    # Fetch page info to display summary
    wiki_extractor = WikipediaExtractor()
    page_info = wiki_extractor.get_page_info(title)
    
    if 'error' in page_info:
        messages.error(request, page_info['message'])
        return redirect('home')
    
    # Store page info in session for later use
    request.session['page_info'] = {
        'title': page_info['title'],
        'url': page_info['url'],
        'summary': page_info['summary']
    }
    
    return render(request, 'comic/options.html', {
        'page_info': page_info,
        'comic_styles': [
            'manga', 'superhero', 'cartoon', 'noir', 'european', 
            'indie', 'retro', 'comic book', 'graphic novel'
        ],
        'target_lengths': ['short', 'medium', 'long'],
        'age_groups': ['kids', 'teens', 'general', 'adult'],
        'education_levels': ['basic', 'standard', 'advanced']
    })

def generate_comic(request):
    """Handles comic generation request"""
    if request.method == 'POST':
        # Get page info from session or redirect if not available
        page_info = request.session.get('page_info')
        if not page_info:
            messages.error(request, 'No article selected. Please search again.')
            return redirect('home')
        
        title = page_info.get('title')
        
        # Get generation options
        comic_style = request.POST.get('comic_style', 'comic book')
        target_length = request.POST.get('target_length', 'medium')
        num_scenes = int(request.POST.get('num_scenes', 8))
        age_group = request.POST.get('age_group', 'general')
        education_level = request.POST.get('education_level', 'standard')
        
        # Generate a unique request ID
        request_id = f"{title.replace(' ', '_').lower()}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Start async generation
        options = {
            'comic_style': comic_style,
            'target_length': target_length,
            'num_scenes': num_scenes,
            'age_group': age_group,
            'education_level': education_level
        }
        
        thread = threading.Thread(
            target=generate_comic_async,
            args=(request_id, title, settings.HF_TOKEN, options)
        )
        thread.daemon = True
        thread.start()
        
        # Redirect to status page
        return redirect('check_status', request_id=request_id)
            
    return redirect('home')

def check_status(request, request_id):
    """Page to check comic generation status"""
    return render(request, 'comic/status.html', {
        'request_id': request_id
    })

def view_comic(request, comic_id):
    """View a generated comic"""
    try:
        # Get comic from in-memory store
        comic = ComicStore.get_comic(comic_id)
        if not comic:
            messages.error(request, 'Comic not found.')
            return redirect('home')
            
        # Get scenes
        scenes = ComicStore.get_scenes(comic_id)
        
        # Parse storyline to extract key information
        storyline_sections = {}
        if comic.get('storyline'):
            lines = comic['storyline'].split('\n')
            current_section = None
            for line in lines:
                if line.startswith('# '):
                    current_section = 'title'
                    storyline_sections[current_section] = line[2:]
                elif line.startswith('## '):
                    current_section = line[3:]
                    storyline_sections[current_section] = ''
                elif current_section and line.strip():
                    storyline_sections[current_section] += line + '\n'
        
        return render(request, 'comic/view_comic.html', {
            'comic': comic,
            'scenes': scenes,
            'storyline_sections': storyline_sections,
            'MEDIA_URL': settings.MEDIA_URL
        })
    except Exception as e:
        logger.error(f"Error in view_comic: {str(e)}", exc_info=True)
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('home')

def download_comic(request, comic_id, format='pdf'):
    """Download a comic in the specified format"""
    try:
        # Get comic from in-memory store
        comic = ComicStore.get_comic(comic_id)
        if not comic:
            messages.error(request, 'Comic not found.')
            return redirect('home')
        
        # This would be implemented to generate PDF or other formats
        messages.info(request, 'Download functionality coming soon!')
        return redirect('view_comic', comic_id=comic_id)
        
    except Exception as e:
        logger.error(f"Error in download_comic: {str(e)}", exc_info=True)
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect('home')

@api_view(['POST'])
@csrf_exempt
def api_generate_comic(request):
    """API endpoint to generate a comic"""
    title = request.data.get('title')
    if not title:
        return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get options
    options = {
        'comic_style': request.data.get('comic_style', 'comic book'),
        'target_length': request.data.get('target_length', 'medium'),
        'num_scenes': int(request.data.get('num_scenes', 8)),
        'age_group': request.data.get('age_group', 'general'),
        'education_level': request.data.get('education_level', 'standard')
    }
    
    # Generate a unique request ID
    request_id = f"{title.replace(' ', '_').lower()}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Start async generation
    thread = threading.Thread(
        target=generate_comic_async,
        args=(request_id, title, settings.HF_TOKEN, options)
    )
    thread.daemon = True
    thread.start()
    
    return Response({
        'request_id': request_id,
        'message': 'Comic generation started'
    })

@api_view(['GET'])
def api_check_status(request, request_id):
    """API endpoint to check comic generation status"""
    status_data = get_status(request_id)
    if not status_data:
        return Response({'error': 'Status not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status_data)

@api_view(['GET'])
def api_get_comic(request, comic_id):
    """API endpoint to get comic data"""
    try:
        # Get comic from in-memory store
        comic = ComicStore.get_comic(comic_id)
        if not comic:
            return Response({'error': 'Comic not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get scenes
        scenes = ComicStore.get_scenes(comic_id)
        
        # Format scene data
        scene_data = []
        for scene in scenes:
            scene_data.append({
                'scene_number': scene['scene_number'],
                'prompt': scene['prompt'],
                'image_url': request.build_absolute_uri(settings.MEDIA_URL + str(scene['image']))
            })
        
        # Format comic data
        comic_data = {
            'id': comic['_id'],
            'title': comic['title'],
            'storyline': comic['storyline'],
            'status': comic['status'],
            'scenes': scene_data,
            'created_at': comic['created_at'],
            'updated_at': comic['updated_at']
        }
        
        return Response(comic_data)
        
    except Exception as e:
        logger.error(f"Error in api_get_comic: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def api_search_wikipedia(request):
    """API endpoint to search Wikipedia"""
    query = request.data.get('query')
    if not query:
        return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    wiki_extractor = WikipediaExtractor()
    search_results = wiki_extractor.search_wikipedia(query)
    
    if isinstance(search_results, str):  # Error message
        return Response({'error': search_results}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(search_results)

@api_view(['GET'])
def api_get_options(request):
    """API endpoint to get comic generation options"""
    options = {
        'comic_styles': [
            'manga', 'superhero', 'cartoon', 'noir', 'european', 
            'indie', 'retro', 'comic book', 'graphic novel'
        ],
        'target_lengths': ['short', 'medium', 'long'],
        'age_groups': ['kids', 'teens', 'general', 'adult'],
        'education_levels': ['basic', 'standard', 'advanced'],
        'num_scenes_range': {'min': 3, 'max': 15, 'default': 8}
    }
    
    return Response(options)
