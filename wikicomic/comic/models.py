import datetime
import json
import os
from django.conf import settings

# In-memory storage for comics
class ComicStore:
    _comics = {}
    _next_id = 1

    @classmethod
    def save_comic(cls, data):
        """Save comic data to in-memory storage"""
        if '_id' not in data:
            data['_id'] = str(cls._next_id)
            cls._next_id += 1
        
        cls._comics[data['_id']] = data
        return data['_id']

    @classmethod
    def get_comic(cls, comic_id):
        """Get comic data from in-memory storage"""
        return cls._comics.get(comic_id)

    @classmethod
    def update_comic(cls, comic_id, data):
        """Update comic data in in-memory storage"""
        if comic_id in cls._comics:
            cls._comics[comic_id].update(data)
            return True
        return False

    @classmethod
    def get_all_comics(cls):
        """Get all comics from in-memory storage"""
        return list(cls._comics.values())
    
    @classmethod
    def create_comic(cls, title, wikipedia_url, storyline):
        """Create a new comic in in-memory storage"""
        now = datetime.datetime.now().isoformat()
        comic_data = {
            '_id': str(cls._next_id),
            'title': title,
            'wikipedia_url': wikipedia_url,
            'storyline': storyline,
            'created_at': now,
            'updated_at': now,
            'status': 'pending',
            'error_message': None,
            'scenes': []
        }
        cls._next_id += 1
        cls._comics[comic_data['_id']] = comic_data
        return comic_data['_id']
    
    @classmethod
    def add_scene(cls, comic_id, scene_number, prompt, image_path):
        """Add a scene to a comic in in-memory storage"""
        if comic_id in cls._comics:
            scene_data = {
                'scene_number': scene_number,
                'prompt': prompt,
                'image': image_path,
                'created_at': datetime.datetime.now().isoformat()
            }
            if 'scenes' not in cls._comics[comic_id]:
                cls._comics[comic_id]['scenes'] = []
            cls._comics[comic_id]['scenes'].append(scene_data)
            return True
        return False

    @classmethod
    def get_scenes(cls, comic_id):
        """Get scenes for a comic from in-memory storage"""
        if comic_id in cls._comics and 'scenes' in cls._comics[comic_id]:
            return cls._comics[comic_id]['scenes']
        return []

    @classmethod
    def update_status(cls, comic_id, status, error_message=None):
        """Update comic status in in-memory storage"""
        if comic_id in cls._comics:
            update_data = {
                'status': status,
                'updated_at': datetime.datetime.now().isoformat()
            }
            if error_message is not None:
                update_data['error_message'] = error_message
            cls._comics[comic_id].update(update_data)
            return True
        return False
