import os
import shutil

# Source and destination paths
source_paths = [
    r"C:\Users\Dell\Downloads\mangabg.jpg",
    r"C:\Users\Dell\Downloads\retrobg.jpg",
    r"C:\Users\Dell\Downloads\sleek.jpeg"
]

# Destination directory
dest_dir = r"client\src\assets\images"

# Create the destination directory if it doesn't exist
os.makedirs(dest_dir, exist_ok=True)

# Copy each file to the destination
for src_path in source_paths:
    # Get the filename from the path
    filename = os.path.basename(src_path)
    # Construct the destination path
    dest_path = os.path.join(dest_dir, filename)
    
    try:
        # Copy the file
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_path} to {dest_path}")
    except FileNotFoundError:
        print(f"Error: File not found - {src_path}")
    except Exception as e:
        print(f"Error copying {src_path}: {e}")

print("\nImage files have been copied to the assets folder.")
print("You can now run the React application to use the local images.") 