# AI Image Generator - Refined Style Prompts Documentation (All Batches)

This document contains the refined server-side prompts for all implemented styles following Nano Banana prompting guidelines. These prompts should be used to generate the appropriate backend code for each style.

## Styles Requiring User Input

### 1. Character Capsules
**Style Name:** `character_capsules`
**User Input Required:** character_name, pose_description, setting_type, capsule_color, label_text
**Server Prompt:**
```
Using the provided image, create a detailed miniature collectible gashapon capsule diorama held between two fingers. Transform the character from the image into a figurine featuring {character_name} in a {pose_description} pose. Inside the transparent spherical capsule, include background elements such as {setting_type}. The capsule should have dramatic cinematic lighting matching the character's theme. Use a transparent top with a {capsule_color} colored base, decorated with motifs related to the character. Label the base with "{label_text}" in a matching font style. Render as a photorealistic miniature collectible with soft bokeh background focus.
```

### 2. iPhone Selfie
**Style Name:** `iphone_selfie`
**User Input Required:** subject_names, location_description, lighting_condition, mood
**Server Prompt:**
```
Transform the provided image into a casual iPhone selfie featuring {subject_names}. Recreate the scene as if taken with an iPhone front camera at {location_description} during {lighting_condition}. Apply natural smartphone photography characteristics including slight motion blur, uneven lighting, and {mood} composition. The result should feel authentic and candid, like a genuine social media selfie with the typical iPhone camera quality and perspective.
```

### 3. Edit Text in Image
**Style Name:** `edit_text`
**User Input Required:** new_text_content, text_style_preference
**Server Prompt:**
```
Using the provided image, replace all visible text with "{new_text_content}". Preserve the original font style, size, color, and positioning to maintain visual consistency with the design. Apply {text_style_preference} styling if specified. Ensure the new text integrates seamlessly with the existing design elements, maintaining the same visual hierarchy and readability as the original text.
```

### 4. Time Travel
**Style Name:** `time_based`
**User Input Required:** time_period, time_change_description, environmental_elements
**Server Prompt:**
```
Using the provided image as a reference, recreate the same scene but show how it would appear {time_change_description} during {time_period}. Maintain the core environment and composition while naturally adapting elements that would change over time such as {environmental_elements}. Preserve the original camera angle and framing while updating lighting conditions, weather effects, and temporal elements to match the specified time period. Ensure photorealistic continuity between the original scene and the time-shifted version.
```

### 5. Ingredients to Dish
**Style Name:** `ingredients_to_dish`
**User Input Required:** dish_type, cooking_style, presentation_style, dietary_preferences
**Server Prompt:**
```
Using the provided image of raw ingredients, create a beautifully plated {dish_type} prepared in {cooking_style} style that can be logically made from these visible ingredients. Present it as a professional food photography shot with {presentation_style} plating and proper studio lighting. Consider {dietary_preferences} requirements if specified. The final dish should showcase how the raw ingredients have been transformed while maintaining visual connection to the original components. Use appetizing colors, proper food styling, and restaurant-quality presentation.
```

### 6. Style Fusion
**Style Name:** `style_fusion`
**User Input Required:** reference_style_description, style_intensity, preserved_elements
**Server Prompt:**
```
Transform the provided image into the artistic style described as: {reference_style_description}. Apply the style transformation at {style_intensity} intensity while preserving {preserved_elements}. Keep the main subject, composition, and details from the original image recognizable, but apply the colors, textures, brushwork, and overall aesthetic characteristics of the reference style. Maintain high-quality detail rendering and ensure the style transfer feels natural and cohesive.
```

### 7. Anatomy Illustration
**Style Name:** `anatomy_illustration`
**User Input Required:** subject_description, detail_level, annotation_style
**Server Prompt:**
```
Using the provided image, create a bilaterally symmetrical frontal anatomical illustration of {subject_description}, styled as a scientific infographic with {detail_level} level of detail. Show the subject's external features on both sides with internal anatomy partially exposed. Include {annotation_style} text annotations flanking the image, explaining biology, abilities, behavior, habitat, and specific anatomical functions. Design should be clear, informative, and professionally rendered in the style of medical or scientific illustration textbooks.
```

## MainTools Styles (Refined)

### 8. Remove Objects
**Style Name:** `remove_object`
**User Input Required:** object_description, removal_area
**Server Prompt:**
```
Using the provided image, seamlessly remove the {object_description} from the {removal_area} while maintaining perfect background continuity. Fill the removed areas naturally using context-aware inpainting techniques to ensure realistic lighting and composition. The final result should appear as if the object was never present in the original image.
```

### 9. Glam Studio
**Style Name:** `glam_studio`
**User Input Required:** makeup_style, intensity_level, color_preferences
**Server Prompt:**
```
Using the provided portrait image, apply professional makeup transformation with {makeup_style} style at {intensity_level} intensity using {color_preferences} color scheme. Enhance facial features while maintaining natural skin texture and preserving the subject's identity and expression. The result should look professionally applied and camera-ready.
```

### 10. Change Background
**Style Name:** `change_background`
**User Input Required:** new_background_description, lighting_match, mood
**Server Prompt:**
```
Using the provided image, replace the current background with {new_background_description} while preserving the main subject perfectly. Ensure the new background integrates seamlessly with {lighting_match} lighting and {mood} atmosphere, matching shadows and perspective for a natural, professional result that enhances the overall composition.
```

### 11. Hair Styler
**Style Name:** `hair_styler`
**User Input Required:** hairstyle_description, hair_color, hair_length
**Server Prompt:**
```
Using the provided portrait image, change the hairstyle to {hairstyle_description} with {hair_color} color and {hair_length} length. Maintain realistic hair texture and natural integration with the subject's facial features and head shape. The new hairstyle should complement the subject's face shape and look naturally styled.
```

### 12. Smile Fix
**Style Name:** `smile_fix`
**User Input Required:** whitening_level, smile_enhancement, tooth_alignment
**Server Prompt:**
```
Using the provided portrait image, enhance the smile with {whitening_level} teeth whitening and {smile_enhancement} smile improvement. Apply {tooth_alignment} alignment corrections while preserving natural tooth shape and proportions. Remove stains and improve overall dental aesthetics while maintaining a natural, authentic appearance.
```

### 13. Beard Style
**Style Name:** `beard_style`
**User Input Required:** beard_style, beard_length, beard_density, beard_color
**Server Prompt:**
```
Using the provided portrait image, modify the beard to {beard_style} style with {beard_length} length, {beard_density} density, and {beard_color} color. Ensure natural hair growth patterns and realistic integration with facial features and skin tone. The beard should complement the subject's face shape and look well-groomed.
```

### 14. Car Modify
**Style Name:** `car_modify`
**User Input Required:** modification_type, color_scheme, style_theme, accessories
**Server Prompt:**
```
Using the provided car image, apply {modification_type} modifications with {color_scheme} color scheme and {style_theme} styling theme. Add {accessories} accessories while maintaining realistic automotive proportions and design principles. Ensure modifications integrate naturally with the vehicle's existing design and lighting conditions.
```

### 15. Skin Fix
**Style Name:** `skin_fix`
**User Input Required:** skin_smoothing_level, blemish_removal, tone_evening
**Server Prompt:**
```
Using the provided portrait image, enhance skin appearance with {skin_smoothing_level} smoothing, {blemish_removal} blemish removal, and {tone_evening} skin tone evening. Preserve natural skin characteristics and texture while avoiding an artificial or over-processed appearance. Maintain the subject's authentic skin quality and natural features.
```

### 16. Age Changer
**Style Name:** `age_changer`
**User Input Required:** target_age, age_direction, natural_aging_features
**Server Prompt:**
```
Using the provided portrait image, adjust the apparent age to {target_age} years old, applying {age_direction} aging effects with {natural_aging_features} features. Preserve the subject's core identity, facial structure, and recognizable characteristics while applying age-appropriate changes naturally and realistically.
```

### 17. Expand Image
**Style Name:** `expand_image`
**User Input Required:** expansion_direction, content_type, style_consistency
**Server Prompt:**
```
Using the provided image, expand the canvas in {expansion_direction} direction by generating {content_type} content around the original boundaries. Preserve the existing subject and composition exactly while naturally extending the background with {style_consistency} consistency in lighting, perspective, and visual style.
```

### 18. Upscale Image
**Style Name:** `upscale_image`
**User Input Required:** upscale_factor, detail_enhancement, quality_preference
**Server Prompt:**
```
Using the provided image, intelligently enhance and upscale it by {upscale_factor}x factor with {detail_enhancement} detail enhancement and {quality_preference} quality settings. Apply advanced AI upscaling techniques to ensure crisp, high-definition results without artifacts while maintaining all original details and textures.
```

### 19. Shape Tune
**Style Name:** `shape_tune`
**User Input Required:** body_area, adjustment_type, intensity_level, realism_preference
**Server Prompt:**
```
Using the provided image, subtly adjust the {body_area} area with {adjustment_type} modifications at {intensity_level} intensity while maintaining {realism_preference} realism. Ensure the modifications blend seamlessly and appear natural, preserving realistic proportions and anatomy.
```

### 20. Remove Background
**Style Name:** `remove_background`
**User Input Required:** cutout_precision, edge_refinement, transparency_type
**Server Prompt:**
```
Using the provided image, precisely isolate the main subject and completely remove the existing background with {cutout_precision} precision and {edge_refinement} edge refinement. Create a {transparency_type} transparent background while preserving all intricate details, fine edges, and subtle textures of the subject with professional cutout quality.
```

## Creative Transform Styles (Without User Input)

### 21. 3D Action Figure
**Style Name:** `nano_3d_figure`
**User Input Required:** figure_scale, display_setting, packaging_style
**Server Prompt:**
```
Using the provided image, create a detailed {figure_scale} scale commercialized action figure of the character rendered in photorealistic 3D. Place the figure in a {display_setting} environment with professional studio lighting, using a circular transparent acrylic base. Include {packaging_style} style packaging elements to create an authentic collectible presentation. Maintain the character's distinctive features and styling while adapting to the action figure format.
```

### 22. Chibi Knitted Doll
**Style Name:** `chibi_knitted_doll`
**User Input Required:** knitting_style, color_scheme, background_setting
**Server Prompt:**
```
Using the provided image, transform the character into a hand-crocheted chibi-style yarn doll held gently between two hands. Create a close-up photograph with professional composition showing rich {knitting_style} textures and {color_scheme} colors. Set against a {background_setting} background with natural lighting to convey warmth and craftsmanship. The doll should maintain the character's recognizable features while adopting cute chibi proportions.
```

### 23. Character Plush Toys
**Style Name:** `character_plush`
**User Input Required:** plush_size, fabric_type, pose_style
**Server Prompt:**
```
Using the provided image, create a soft, high-quality plush toy version of the character with {plush_size} proportions and oversized head. Made of {fabric_type} fabric with visible stitching and embroidered facial features. Show the plush toy in a {pose_style} pose against a neutral background with professional product photography lighting. The design should be cute and collectible while maintaining character recognition.
```

### 24. Funko Pop Figure
**Style Name:** `funko_pop_figure`
**User Input Required:** character_outfit, accessories, base_color
**Server Prompt:**
```
Using the provided image, create a detailed 3D render of the character as a Funko Pop collectible figure wearing {character_outfit} and including {accessories}. Maintain the distinctive Funko Pop aesthetic with oversized head, small body, and simplified features while preserving the character's recognizable traits. Use {base_color} for the base and render with studio lighting against a pure white background.
```

### 25. Ghibli Style
**Style Name:** `ghibli_style`
**User Input Required:** scene_mood, color_palette, animation_elements
**Server Prompt:**
```
Transform the provided image into the distinctive Studio Ghibli animation style with a {scene_mood} atmosphere. Preserve the original composition while applying hand-drawn animation aesthetics, soft watercolor-like textures using a {color_palette} color scheme, and the characteristic whimsical atmosphere of Ghibli films. Include {animation_elements} typical of Studio Ghibli's artistic approach.
```

### 26. Game UI
**Style Name:** `game_ui`
**User Input Required:** game_type, ui_theme, lighting_effects
**Server Prompt:**
```
Using the provided image, create a vibrant {game_type} game screenshot featuring the character as a 3D animated game avatar. Include immersive game interface elements with {ui_theme} styling, {lighting_effects} lighting effects, and dynamic UI components typical of modern arcade games. The character should maintain their distinctive features while fitting into the game environment.
```

### 27. Line to Image
**Style Name:** `line_to_image`
**User Input Required:** color_style, rendering_quality, lighting_type
**Server Prompt:**
```
Using the provided line art or sketch, convert it into a fully colored and detailed image with {color_style} coloring approach. Preserve all original outlines and composition while adding realistic colors, {lighting_type} lighting, shadows, and textures to create a {rendering_quality} quality rendering. The final image should feel natural and professionally finished.
```

### 28. 3x3 Photo Grid
**Style Name:** `photo_grid_pose`
**User Input Required:** pose_variety, expression_types, background_consistency
**Server Prompt:**
```
Using the provided portrait image, create a 3x3 grid of photo strips showing the subject in {pose_variety} poses and {expression_types} expressions. Maintain {background_consistency} background and lighting consistency while varying the poses naturally for a dynamic photo booth effect. Each frame should feel authentic and naturally connected.
```

### 29. 16-Bit Game Character
**Style Name:** `retro_16bit_character`
**User Input Required:** game_environment, pixel_style, color_limitation
**Server Prompt:**
```
Using the provided image, transform the character into a 16-bit retro video game sprite and place them in a {game_environment} level. Apply {pixel_style} pixel art aesthetics with {color_limitation} color palette restrictions to achieve authentic retro gaming visual style reminiscent of classic console games.
```

### 30. AI Saree
**Style Name:** `ai_saree`
**User Input Required:** saree_style, color_pattern, draping_style, occasion_type
**Server Prompt:**
```
Using the provided portrait image, transform the subject into wearing an elegant {saree_style} saree with {color_pattern} colors and {draping_style} draping style, appropriate for {occasion_type} occasions. Ensure natural fabric flow, cultural authenticity, and appropriate pose while maintaining the subject's facial features and identity.
```

## Implementation Notes

1. **User Input Styles**: All styles now have detailed user input parameters for better customization and UX
2. **Nano Banana Compliance**: All prompts start with "Using the provided image" for proper context
3. **Server-Side Processing**: Replace placeholder values (e.g., `{style_type}`, `{intensity}`) with actual user inputs
4. **Quality Control**: Each prompt includes specific quality and realism requirements
5. **Preservation Clauses**: Critical elements (identity, composition) are explicitly preserved
6. **Professional Standards**: All prompts specify professional-quality output requirements

### Total Refined Styles: 30+ styles across all categories
- **MainTools**: 13 styles with user input refinements
- **Creative Transforms**: 10 styles with enhanced parameters
- **User Input Required**: 7 styles with detailed customization options

The refined prompts follow Nano Banana's best practices for hyper-specific descriptions, context preservation, and professional quality output.