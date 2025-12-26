import cv2
import numpy as np
from PIL import Image
import os

class ImageProcessing:
    @staticmethod
    def enhance_image(image_path, output_path):
        try:
            # Read image using OpenCV
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced_img = clahe.apply(img)

            # Apply Heatmap Colorization (COLORMAP_TURBO is vivid and accurate)
            # We will blend the heatmap with the original enhanced image for better detail preservation
            heatmap = cv2.applyColorMap(enhanced_img, cv2.COLORMAP_TURBO)
            
            # Convert enhanced grayscale to 3-channel for blending
            enhanced_3ch = cv2.cvtColor(enhanced_img, cv2.COLOR_GRAY2BGR)
            
            # Blend: 70% Original Detail + 30% Heatmap Color
            final_img = cv2.addWeighted(enhanced_3ch, 0.7, heatmap, 0.3, 0)
            
            # Save the enhanced image
            cv2.imwrite(output_path, final_img)
            
            return output_path
        except Exception as e:
            print(f"Error in image enhancement: {e}")
            return image_path
