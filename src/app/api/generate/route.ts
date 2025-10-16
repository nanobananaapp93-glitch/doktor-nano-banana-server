import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../lib/mongodb';
import { fal } from "@fal-ai/client";

const PHOTO_GENERATION_COST = 1;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Prompt generation function based on style
function generateImagePrompt(userPrompt: string, style: string): string {
  switch (style) {
    // ============ STYLES REQUIRING USER INPUT ============
    case "character_capsules":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a detailed miniature collectible gashapon capsule diorama held between two fingers. Transform the character from the image into a figurine featuring ${parsed.character_name || 'the character'} in a ${parsed.pose_description || 'dynamic'} pose. Inside the transparent spherical capsule, include background elements such as ${parsed.setting_type || 'thematic environment'}. The capsule should have dramatic cinematic lighting matching the character's theme. Use a transparent top with a ${parsed.capsule_color || 'blue'} colored base, decorated with motifs related to the character. Label the base with "${parsed.label_text || 'Collectible'}" in a matching font style. Render as a photorealistic miniature collectible with soft bokeh background focus.`;
      } catch (e) {
        return `Using the provided image, create a detailed miniature collectible gashapon capsule diorama held between two fingers. Transform the character from the image into a figurine in a dynamic pose inside a transparent spherical capsule with blue colored base.`;
      }

    case "iphone_selfie":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Transform the provided image into a casual iPhone selfie featuring ${parsed.subject_names || 'the subjects'}. Recreate the scene as if taken with an iPhone front camera at ${parsed.location_description || 'an indoor location'} during ${parsed.lighting_condition || 'natural lighting'}. Apply natural smartphone photography characteristics including slight motion blur, uneven lighting, and ${parsed.mood || 'casual'} composition. The result should feel authentic and candid, like a genuine social media selfie with the typical iPhone camera quality and perspective.`;
      } catch (e) {
        return `Transform the provided image into a casual iPhone selfie with natural smartphone photography characteristics including slight motion blur and authentic candid composition.`;
      }

    case "edit_text":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, replace all visible text with "${parsed.new_text_content || userPrompt}". Preserve the original font style, size, color, and positioning to maintain visual consistency with the design. Apply ${parsed.text_style_preference || 'original'} styling if specified. Ensure the new text integrates seamlessly with the existing design elements, maintaining the same visual hierarchy and readability as the original text.`;
      } catch (e) {
        return `Using the provided image, replace all visible text with "${userPrompt}". Preserve the original font style, size, color, and positioning to maintain visual consistency.`;
      }

    case "time_based":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image as a reference, recreate the same scene but show how it would appear ${parsed.time_change_description || 'at a different time'} during ${parsed.time_period || 'the same era'}. Maintain the core environment and composition while naturally adapting elements that would change over time such as ${parsed.environmental_elements || 'lighting and atmosphere'}. Preserve the original camera angle and framing while updating lighting conditions, weather effects, and temporal elements to match the specified time period. Ensure photorealistic continuity between the original scene and the time-shifted version.`;
      } catch (e) {
        return `Using the provided image as a reference, recreate the same scene at a different time while maintaining the core environment and composition with natural temporal adaptations.`;
      }

    case "ingredients_to_dish":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image of raw ingredients, create a beautifully plated ${parsed.dish_type || 'main dish'} prepared in ${parsed.cooking_style || 'modern'} style that can be logically made from these visible ingredients. Present it as a professional food photography shot with ${parsed.presentation_style || 'elegant'} plating and proper studio lighting. Consider ${parsed.dietary_preferences || 'standard'} requirements if specified. The final dish should showcase how the raw ingredients have been transformed while maintaining visual connection to the original components. Use appetizing colors, proper food styling, and restaurant-quality presentation.`;
      } catch (e) {
        return `Using the provided image of raw ingredients, create a beautifully plated dish that can be logically made from these visible ingredients with professional food photography presentation.`;
      }

    case "style_fusion":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Transform the provided image into the artistic style described as: ${parsed.reference_style_description || userPrompt}. Apply the style transformation at ${parsed.style_intensity || 'medium'} intensity while preserving ${parsed.preserved_elements || 'main subject and composition'}. Keep the main subject, composition, and details from the original image recognizable, but apply the colors, textures, brushwork, and overall aesthetic characteristics of the reference style. Maintain high-quality detail rendering and ensure the style transfer feels natural and cohesive.`;
      } catch (e) {
        return `Transform the provided image into the artistic style: ${userPrompt}. Apply style transformation while preserving the main subject and composition with natural cohesive rendering.`;
      }

    case "anatomy_illustration":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a bilaterally symmetrical frontal anatomical illustration of ${parsed.subject_description || 'the subject'}, styled as a scientific infographic with ${parsed.detail_level || 'moderate'} level of detail. Show the subject's external features on both sides with internal anatomy partially exposed. Include ${parsed.annotation_style || 'technical'} text annotations flanking the image, explaining biology, abilities, behavior, habitat, and specific anatomical functions. Design should be clear, informative, and professionally rendered in the style of medical or scientific illustration textbooks.`;
      } catch (e) {
        return `Using the provided image, create a bilaterally symmetrical frontal anatomical illustration styled as a scientific infographic with technical annotations explaining biological functions.`;
      }

    // ============ MAINTOOLS STYLES (REFINED) ============
    case "remove_object":
      return `Using the provided image, seamlessly remove the "${userPrompt.trim()}" while maintaining perfect background continuity. Fill the removed areas naturally using context-aware inpainting techniques to ensure realistic lighting and composition. The final result should appear as if the object was never present in the original image.`;

    case "remove_background":
      const bgType = userPrompt.toLowerCase().includes("transparent") ? "transparent" : "white";
      return `Using the provided image, precisely isolate the main subject and completely remove the existing background with high precision and refined edge refinement. Create a ${bgType} transparent background while preserving all intricate details, fine edges, and subtle textures of the subject with professional cutout quality.`;

    case "change_background":
      return `Using the provided image, replace the current background with ${userPrompt.trim()} while preserving the main subject perfectly. Ensure the new background integrates seamlessly with matching lighting and complementary atmosphere, matching shadows and perspective for a natural, professional result that enhances the overall composition.`;

    case "upscale_image":
      return `Using the provided image, intelligently enhance and upscale it by 4x factor with advanced detail enhancement and premium quality settings. Apply advanced AI upscaling techniques to ensure crisp, high-definition results without artifacts while maintaining all original details and textures.`;

    case "expand_image":
      const zoomMatch = userPrompt.match(/(\d+\.?\d*)/);
      const zoomFactor = zoomMatch ? parseFloat(zoomMatch[1]) : 1.50;
      const clampedZoom = Math.min(Math.max(zoomFactor, 0.5), 10.0);
      return `Using the provided image, expand the canvas outward by ${clampedZoom}x factor by generating natural content around the original boundaries. Preserve the existing subject and composition exactly while naturally extending the background with consistent lighting, perspective, and visual style.`;

    case "glam_studio":
        try {
          const parsed = JSON.parse(userPrompt);
          const presets = ["natural_glow", "soft_glam", "bold_glam", "evening_look", "artistic_fantasy"];
          const requestedPreset = typeof parsed?.preset === 'string' ? parsed.preset : '';
          const normalizedRequested = requestedPreset.replace("_", " ").toLowerCase();
          const matchedPreset = presets.find(p => p === requestedPreset || p.replace("_", " ").toLowerCase() === normalizedRequested) || 'natural_glow';
          const details = typeof parsed?.details === 'string' ? parsed.details.trim() : '';
          const detailsPart = details ? ` Focus on: ${details}.` : '';
          return `Using the provided portrait image, apply professional makeup transformation with ${matchedPreset} style at moderate intensity. Enhance facial features while maintaining natural skin texture and preserving the subject's identity.${detailsPart}`;
        } catch (e) {
          const presets = ["natural_glow", "soft_glam", "bold_glam", "evening_look", "artistic_fantasy"];
          const foundPreset = presets.find(preset => userPrompt.toLowerCase().includes(preset.replace("_", " ")));
          return `Using the provided portrait image, apply professional makeup transformation with ${foundPreset || 'natural_glow'} style at moderate intensity. Enhance facial features while maintaining natural skin texture and preserving the subject's identity.`;
        }

    case "hair_styler":
      try {
        const parsed = JSON.parse(userPrompt);
        const hairstyle = typeof parsed?.hairstyle === 'string' && parsed.hairstyle.trim() ? parsed.hairstyle.trim() : 'modern style';
        const length = typeof parsed?.length === 'string' && parsed.length.trim() ? parsed.length.trim() : 'medium';
        const color = typeof parsed?.color === 'string' && parsed.color.trim() ? parsed.color.trim() : 'natural';
        return `Using the provided portrait image, change the hairstyle to ${hairstyle} with ${color} color and ${length} length. Maintain realistic hair texture and natural integration with the subject's facial features and head shape. The new hairstyle should complement the subject's face shape and look naturally styled.`;
      } catch (e) {
        // Fallback: try parsing semicolon-delimited format "hairstyle; length; color"
        const parts = userPrompt.split(';').map(p => p.trim()).filter(Boolean);
        const hairstyle = parts[0] || 'modern style';
        const length = parts[1] || 'medium';
        const color = parts[2] || 'natural';
        return `Using the provided portrait image, change the hairstyle to ${hairstyle} with ${color} color and ${length} length. Maintain realistic hair texture and natural integration with the subject's facial features and head shape. The new hairstyle should complement the subject's face shape and look naturally styled.`;
      }

    case "smile_fix":
      try {
        const parsed = JSON.parse(userPrompt);
        const degreeToLabel: Record<number, string> = {
          0: 'None',
          1: 'Very subtle',
          2: 'Subtle',
          3: 'Moderate',
          4: 'Big',
          5: 'Brightest',
        };
        const numericDegree = typeof parsed?.degree === 'number' ? parsed.degree : (typeof parsed?.smile_degree === 'number' ? parsed.smile_degree : undefined);
        const providedLabel = typeof parsed?.label === 'string' ? parsed.label : undefined;
        const label = providedLabel?.trim() || (numericDegree != null ? degreeToLabel[Math.max(0, Math.min(5, Math.round(numericDegree)))] : undefined) || 'Moderate';
        const promptByLabel: Record<string, string> = {
          'Very subtle': 'Using the provided image, gently soften the expressions for all visible subjects to convey a relaxed, approachable look. Make micro-adjustments at the lip corners while preserving natural skin texture and facial anatomy. Maintain true-to-life tooth tone without obvious whitening and keep the effect nearly imperceptible in casual viewing.',
          'Subtle': 'Using the provided image, refine the expressions for all visible subjects to create a natural, friendly smile. Slightly lift the lip corners, reveal minimal teeth where appropriate, and even out lip symmetry. Apply mild whitening limited to surface stain cleanup while preserving authentic enamel texture and color variation.',
          'Moderate': 'Using the provided image, enhance the expressions for all visible subjects to a confident, photogenic smile. Gently increase lip curvature, reveal upper teeth naturally, and even minor asymmetries. Apply controlled whitening and light alignment refinement while preserving realistic gum lines, tooth shape, and natural sheen.',
          'Big': 'Using the provided image, elevate the expressions for all visible subjects to a joyful, energetic smile. Increase lip curvature and openness while maintaining realistic facial folds and cheek volume. Reveal teeth naturally with balanced whitening and careful alignment cleanup, preserving authentic anatomy and individuality.',
          'Brightest': 'Using the provided image, transform the expressions for all visible subjects into a radiant, camera-ready smile. Maximize lip curvature and brightness while keeping skin texture, dimples, and nasolabial folds natural. Reveal teeth with high clarity, apply premium whitening without overexposure, and ensure proportions remain true to each person.',
          'None': 'Using the provided image, preserve each subject’s current expression exactly as captured without introducing additional smiling. Perform only minimal cleanup for natural appearance while keeping all features unchanged.',
        };
        return promptByLabel[label] || promptByLabel['Moderate'];
      } catch (e) {
        const degreeToLabel: Record<number, string> = { 0: 'None', 1: 'Very subtle', 2: 'Subtle', 3: 'Moderate', 4: 'Big', 5: 'Brightest' };
        const text = (userPrompt || '').trim();
        const numericMatch = text.match(/^\s*(\d+)\s*$/);
        let label = '';
        if (numericMatch) {
          const n = Math.max(0, Math.min(5, parseInt(numericMatch[1], 10)));
          label = degreeToLabel[n];
        } else {
          const lower = text.toLowerCase();
          const map: Record<string, string> = { 'none': 'None', 'very subtle': 'Very subtle', 'subtle': 'Subtle', 'moderate': 'Moderate', 'big': 'Big', 'brightest': 'Brightest' };
          for (const [k, v] of Object.entries(map)) {
            if (lower.includes(k)) { label = v; break; }
          }
        }
        const resolved = label || 'Moderate';
        const promptByLabel: Record<string, string> = {
          'Very subtle': 'Using the provided image, gently soften the expressions for all visible subjects to convey a relaxed, approachable look. Make micro-adjustments at the lip corners while preserving natural skin texture and facial anatomy. Maintain true-to-life tooth tone without obvious whitening and keep the effect nearly imperceptible in casual viewing.',
          'Subtle': 'Using the provided image, refine the expressions for all visible subjects to create a natural, friendly smile. Slightly lift the lip corners, reveal minimal teeth where appropriate, and even out lip symmetry. Apply mild whitening limited to surface stain cleanup while preserving authentic enamel texture and color variation.',
          'Moderate': 'Using the provided image, enhance the expressions for all visible subjects to a confident, photogenic smile. Gently increase lip curvature, reveal upper teeth naturally, and even minor asymmetries. Apply controlled whitening and light alignment refinement while preserving realistic gum lines, tooth shape, and natural sheen.',
          'Big': 'Using the provided image, elevate the expressions for all visible subjects to a joyful, energetic smile. Increase lip curvature and openness while maintaining realistic facial folds and cheek volume. Reveal teeth naturally with balanced whitening and careful alignment cleanup, preserving authentic anatomy and individuality.',
          'Brightest': 'Using the provided image, transform the expressions for all visible subjects into a radiant, camera-ready smile. Maximize lip curvature and brightness while keeping skin texture, dimples, and nasolabial folds natural. Reveal teeth with high clarity, apply premium whitening without overexposure, and ensure proportions remain true to each person.',
          'None': 'Using the provided image, preserve each subject’s current expression exactly as captured without introducing additional smiling. Perform only minimal cleanup for natural appearance while keeping all features unchanged.',
        };
        return promptByLabel[resolved] || promptByLabel['Moderate'];
      }

    case "beard_style":
      try {
        const parsed = JSON.parse(userPrompt);
        const preset = typeof parsed?.preset === 'string' ? parsed.preset : (typeof parsed?.beard_style === 'string' ? parsed.beard_style : 'stubble');
        const color = typeof parsed?.color === 'string' ? parsed.color.trim() : (typeof parsed?.beard_color === 'string' ? parsed.beard_color.trim() : 'natural');
        const rawLength = typeof parsed?.length === 'number' ? parsed.length : (typeof parsed?.beard_length === 'number' ? parsed.beard_length : undefined);
        const rawDensity = typeof parsed?.density === 'string' ? parsed.density : (typeof parsed?.beard_density === 'string' ? parsed.beard_density : undefined);

        const lengthVal = typeof rawLength === 'number' && isFinite(rawLength) ? rawLength : undefined;
        const densityVal = rawDensity != null ? parseFloat(String(rawDensity)) : undefined;

        // Map numeric length (in mm assumption or abstract scale) to descriptive phrase
        // Thresholds chosen to be robust regardless of unit: 0=clean, 1-3=stubble, 4-10=short, 11-20=medium, >20=long
        let lengthPhrase = 'medium length';
        if (lengthVal != null) {
          if (lengthVal <= 0) lengthPhrase = 'clean-shaven length';
          else if (lengthVal <= 3) lengthPhrase = 'light stubble length (1–3 mm)';
          else if (lengthVal <= 10) lengthPhrase = 'short groomed length (4–10 mm)';
          else if (lengthVal <= 20) lengthPhrase = 'medium length (11–20 mm)';
          else lengthPhrase = 'long, fuller length (>20 mm)';
        }

        // Map density [0.0–1.0] to descriptive phrase
        let densityPhrase = 'normal density';
        if (densityVal != null && isFinite(densityVal)) {
          const d = Math.max(0, Math.min(1, densityVal));
          if (d <= 0.15) densityPhrase = 'very sparse density with visible skin';
          else if (d <= 0.35) densityPhrase = 'light density with some transparency';
          else if (d <= 0.6) densityPhrase = 'medium balanced density';
          else if (d <= 0.85) densityPhrase = 'full dense coverage';
          else densityPhrase = 'very full, high-density coverage';
        }

        return `Using the provided portrait image, modify the beard to ${preset} style with ${lengthPhrase}, ${densityPhrase}, and ${color || 'natural'} color. Ensure natural hair growth patterns and realistic integration with facial features and skin tone. Maintain crisp edges, even coverage, and a well-groomed finish that complements the subject's face shape.`;
      } catch (e) {
        // Text fallback: try to extract preset, length, density, color from a semicolon- or comma-delimited string
        const text = userPrompt.trim();
        const presets = ["stubble", "short_boxed", "full_beard", "goatee", "van_dyke", "beard_fade"];
        const foundPreset = presets.find(p => text.toLowerCase().includes(p.replace("_", " ")) ) || 'stubble';

        // Extract simple key-value pairs like "length: 12" or "density: 0.65" or "color: brown"
        const lengthMatch = text.match(/length\s*[:=]\s*(\d+(?:\.\d+)?)/i);
        const densityMatch = text.match(/density\s*[:=]\s*(\d+(?:\.\d+)?)/i);
        const colorMatch = text.match(/color\s*[:=]\s*([\w\s-]+)/i);
        const lengthVal = lengthMatch ? parseFloat(lengthMatch[1]) : undefined;
        const dVal = densityMatch ? parseFloat(densityMatch[1]) : undefined;
        const color = colorMatch ? colorMatch[1].trim() : 'natural';

        let lengthPhrase = 'medium length';
        if (lengthVal != null && isFinite(lengthVal)) {
          if (lengthVal <= 0) lengthPhrase = 'clean-shaven length';
          else if (lengthVal <= 3) lengthPhrase = 'light stubble length (1–3 mm)';
          else if (lengthVal <= 10) lengthPhrase = 'short groomed length (4–10 mm)';
          else if (lengthVal <= 20) lengthPhrase = 'medium length (11–20 mm)';
          else lengthPhrase = 'long, fuller length (>20 mm)';
        }

        let densityPhrase = 'normal density';
        if (dVal != null && isFinite(dVal)) {
          const d = Math.max(0, Math.min(1, dVal));
          if (d <= 0.15) densityPhrase = 'very sparse density with visible skin';
          else if (d <= 0.35) densityPhrase = 'light density with some transparency';
          else if (d <= 0.6) densityPhrase = 'medium balanced density';
          else if (d <= 0.85) densityPhrase = 'full dense coverage';
          else densityPhrase = 'very full, high-density coverage';
        }

        return `Using the provided portrait image, modify the beard to ${foundPreset} style with ${lengthPhrase}, ${densityPhrase}, and ${color} color. Ensure natural hair growth patterns and realistic integration with facial features and skin tone. Maintain crisp edges, even coverage, and a well-groomed finish that complements the subject's face shape.`;
      }

    case "car_modify":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided car image, apply ${parsed.modification_type || 'performance'} modifications with ${parsed.color_scheme || 'original'} color scheme and ${parsed.style_theme || 'modern'} styling theme. Add ${parsed.accessories || 'standard'} accessories while maintaining realistic automotive proportions and design principles. Ensure modifications integrate naturally with the vehicle's existing design and lighting conditions.`;
      } catch (e) {
        const modTypes = ["body_kit", "performance", "stance", "racing", "luxury", "off_road"];
        const foundType = modTypes.find(type => userPrompt.toLowerCase().includes(type.replace("_", " ")));
        return `Using the provided car image, apply ${foundType || 'performance'} modifications while maintaining realistic automotive proportions and natural integration with existing design.`;
      }

    case "skin_fix":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided portrait image, enhance skin appearance with ${parsed.skin_smoothing_level || 'moderate'} smoothing, ${parsed.blemish_removal || 'natural'} blemish removal, and ${parsed.tone_evening || 'subtle'} skin tone evening. Preserve natural skin characteristics and texture while avoiding an artificial or over-processed appearance. Maintain the subject's authentic skin quality and natural features.`;
      } catch (e) {
        return `Using the provided portrait image, enhance skin appearance with moderate smoothing and natural blemish removal while preserving authentic skin characteristics and texture.`;
      }

    case "age_changer":
      try {
        const parsed = JSON.parse(userPrompt);
        const targetAge = parsed.target_age || 25;
        return `Using the provided portrait image, adjust the apparent age to ${targetAge} years old, applying ${parsed.age_direction || 'natural'} aging effects with ${parsed.natural_aging_features || 'realistic'} features. Preserve the subject's core identity, facial structure, and recognizable characteristics while applying age-appropriate changes naturally and realistically.`;
      } catch (e) {
        const ageMatch = userPrompt.match(/(\d+)/);
        const age = ageMatch ? parseInt(ageMatch[1]) : 25;
        const clampedAge = Math.min(Math.max(age, 5), 90);
        return `Using the provided portrait image, adjust the apparent age to ${clampedAge} years old while preserving core identity and facial structure with natural age-appropriate changes.`;
      }

    case "shape_tune":
      try {
        const parsed = JSON.parse(userPrompt);
        const allowedAreas = ["waist", "arms", "legs", "chest", "shoulders", "hips", "back", "neck"] as const;
        const allowedLooks = ["slimmer", "more muscular", "curvier", "elongated", "toned", "broader"] as const;
        const areaInput = (parsed?.area || parsed?.body_area || '').toString().toLowerCase().trim();
        const lookInput = (parsed?.look || parsed?.adjustment_type || '').toString().toLowerCase().trim();
        const area = allowedAreas.includes(areaInput as any) ? areaInput : 'waist';
        const look = allowedLooks.includes(lookInput as any) ? lookInput : 'slimmer';

        const promptByLook: Record<string, string> = {
          'slimmer': `Using the provided image, visibly refine the ${area} to appear slimmer with a noticeable reduction while preserving natural anatomy and clothing physics. Keep lighting, shading, and perspective consistent, and avoid warping adjacent areas or creating artifacts.`,
          'more muscular': `Using the provided image, enhance the ${area} with clear muscular definition and added volume. Accentuate natural muscle groups, keep proportions believable, and preserve skin texture, highlights, and shadow flow while maintaining anatomical accuracy.`,
          'curvier': `Using the provided image, visibly accentuate curves around the ${area} with pronounced yet realistic contour changes. Preserve overall proportions, maintain clothing and skin continuity, and keep lighting and shadows consistent without visible warping.`,
          'elongated': `Using the provided image, visibly elongate the ${area} for a taller, more elegant appearance while preserving realistic proportions and joint alignment. Maintain perspective, fabric drape, and shadow continuity, avoiding distortions in neighboring regions.`,
          'toned': `Using the provided image, visibly tone the ${area} by reducing softness and introducing clear, natural definition. Keep skin texture realistic, preserve anatomical landmarks and proportion, and avoid harsh edges or plastic smoothing.`,
          'broader': `Using the provided image, visibly broaden the ${area} to convey a stronger presence while preserving shoulder/hip alignment and overall proportion. Maintain fabric tension, seam placement, and consistent lighting and shading without artifacts.`,
        };

        return promptByLook[look] || promptByLook['slimmer'];
      } catch (e) {
        const areas = ["waist", "arms", "legs", "chest", "shoulders", "hips", "back", "neck"];
        const looks = ["slimmer", "more muscular", "curvier", "elongated", "toned", "broader"];

        // Fallback: try semicolon format "area;look"
        const parts = userPrompt.split(';').map(p => p.trim().toLowerCase()).filter(Boolean);
        const areaFromParts = parts[0] && areas.includes(parts[0]) ? parts[0] : undefined;
        const lookFromParts = parts[1] && looks.includes(parts[1]) ? parts[1] : undefined;

        const lower = userPrompt.toLowerCase();
        const foundArea = areaFromParts || areas.find(a => lower.includes(a)) || 'waist';
        const foundLook = lookFromParts || looks.find(l => lower.includes(l)) || 'slimmer';

        const promptByLook: Record<string, string> = {
          'slimmer': `Using the provided image, visibly refine the ${foundArea} to appear slimmer with a noticeable reduction while preserving natural anatomy and clothing physics. Keep lighting, shading, and perspective consistent, and avoid warping adjacent areas or creating artifacts.`,
          'more muscular': `Using the provided image, enhance the ${foundArea} with clear muscular definition and added volume. Accentuate natural muscle groups, keep proportions believable, and preserve skin texture, highlights, and shadow flow while maintaining anatomical accuracy.`,
          'curvier': `Using the provided image, visibly accentuate curves around the ${foundArea} with pronounced yet realistic contour changes. Preserve overall proportions, maintain clothing and skin continuity, and keep lighting and shadows consistent without visible warping.`,
          'elongated': `Using the provided image, visibly elongate the ${foundArea} for a taller, more elegant appearance while preserving realistic proportions and joint alignment. Maintain perspective, fabric drape, and shadow continuity, avoiding distortions in neighboring regions.`,
          'toned': `Using the provided image, visibly tone the ${foundArea} by reducing softness and introducing clear, natural definition. Keep skin texture realistic, preserve anatomical landmarks and proportion, and avoid harsh edges or plastic smoothing.`,
          'broader': `Using the provided image, visibly broaden the ${foundArea} to convey a stronger presence while preserving shoulder/hip alignment and overall proportion. Maintain fabric tension, seam placement, and consistent lighting and shading without artifacts.`,
        };

        return promptByLook[foundLook] || promptByLook['slimmer'];
      }

    // ============ CREATIVE TRANSFORM STYLES ============
    case "nano_3d_figure":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a detailed ${parsed.figure_scale || '6-inch'} scale commercialized action figure of the character rendered in photorealistic 3D. Place the figure in a ${parsed.display_setting || 'studio'} environment with professional studio lighting, using a circular transparent acrylic base. Include ${parsed.packaging_style || 'premium'} style packaging elements to create an authentic collectible presentation. Maintain the character's distinctive features and styling while adapting to the action figure format.`;
      } catch (e) {
        return `Using the provided image, create a detailed 6-inch scale commercialized action figure of the character rendered in photorealistic 3D with professional studio lighting and premium packaging elements.`;
      }

    case "chibi_knitted_doll":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, transform the character into a hand-crocheted chibi-style yarn doll held gently between two hands. Create a close-up photograph with professional composition showing rich ${parsed.knitting_style || 'cable-knit'} textures and ${parsed.color_scheme || 'warm'} colors. Set against a ${parsed.background_setting || 'cozy indoor'} background with natural lighting to convey warmth and craftsmanship. The doll should maintain the character's recognizable features while adopting cute chibi proportions.`;
      } catch (e) {
        return `Using the provided image, transform the character into a hand-crocheted chibi-style yarn doll with rich textures and warm colors, photographed with natural lighting to convey craftsmanship.`;
      }

    case "character_plush":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a soft, high-quality plush toy version of the character with ${parsed.plush_size || 'chibi'} proportions and oversized head. Made of ${parsed.fabric_type || 'soft velvet'} fabric with visible stitching and embroidered facial features. Show the plush toy in a ${parsed.pose_style || 'sitting'} pose against a neutral background with professional product photography lighting. The design should be cute and collectible while maintaining character recognition.`;
      } catch (e) {
        return `Using the provided image, create a soft, high-quality plush toy version of the character with chibi proportions, soft velvet fabric, and professional product photography lighting.`;
      }

    case "funko_pop_figure":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a detailed 3D render of the character as a Funko Pop collectible figure wearing ${parsed.character_outfit || 'signature outfit'} and including ${parsed.accessories || 'characteristic accessories'}. Maintain the distinctive Funko Pop aesthetic with oversized head, small body, and simplified features while preserving the character's recognizable traits. Use ${parsed.base_color || 'standard black'} for the base and render with studio lighting against a pure white background.`;
      } catch (e) {
        return `Using the provided image, create a detailed 3D render of the character as a Funko Pop collectible figure with distinctive oversized head, small body, and simplified features rendered with studio lighting.`;
      }

    case "ghibli_style":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Transform the provided image into the distinctive Studio Ghibli animation style with a ${parsed.scene_mood || 'whimsical'} atmosphere. Preserve the original composition while applying hand-drawn animation aesthetics, soft watercolor-like textures using a ${parsed.color_palette || 'warm earth-toned'} color scheme, and the characteristic whimsical atmosphere of Ghibli films. Include ${parsed.animation_elements || 'floating particles and soft lighting'} typical of Studio Ghibli's artistic approach.`;
      } catch (e) {
        return `Transform the provided image into the distinctive Studio Ghibli animation style with whimsical atmosphere, hand-drawn aesthetics, and soft watercolor-like textures with warm earth-toned colors.`;
      }

    case "game_ui":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, create a vibrant ${parsed.game_type || 'RPG'} game screenshot featuring the character as a 3D animated game avatar. Include immersive game interface elements with ${parsed.ui_theme || 'fantasy'} styling, ${parsed.lighting_effects || 'dynamic particle'} lighting effects, and dynamic UI components typical of modern arcade games. The character should maintain their distinctive features while fitting into the game environment.`;
      } catch (e) {
        return `Using the provided image, create a vibrant RPG game screenshot featuring the character as a 3D animated game avatar with immersive interface elements and dynamic lighting effects.`;
      }

    case "line_to_image":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided line art or sketch, convert it into a fully colored and detailed image with ${parsed.color_style || 'realistic'} coloring approach. Preserve all original outlines and composition while adding realistic colors, ${parsed.lighting_type || 'natural'} lighting, shadows, and textures to create a ${parsed.rendering_quality || 'high'} quality rendering. The final image should feel natural and professionally finished.`;
      } catch (e) {
        return `Using the provided line art or sketch, convert it into a fully colored and detailed image with realistic coloring, natural lighting, and high quality professional rendering.`;
      }

    case "photo_grid_pose":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided portrait image, create a 3x3 grid of photo strips showing the subject in ${parsed.pose_variety || 'varied'} poses and ${parsed.expression_types || 'different'} expressions. Maintain ${parsed.background_consistency || 'consistent'} background and lighting consistency while varying the poses naturally for a dynamic photo booth effect. Each frame should feel authentic and naturally connected.`;
      } catch (e) {
        return `Using the provided portrait image, create a 3x3 grid of photo strips showing the subject in varied poses and different expressions with consistent background and lighting.`;
      }

    case "retro_16bit_character":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided image, transform the character into a 16-bit retro video game sprite and place them in a ${parsed.game_environment || 'platformer'} level. Apply ${parsed.pixel_style || 'classic'} pixel art aesthetics with ${parsed.color_limitation || '16-color'} color palette restrictions to achieve authentic retro gaming visual style reminiscent of classic console games.`;
      } catch (e) {
        return `Using the provided image, transform the character into a 16-bit retro video game sprite with classic pixel art aesthetics and 16-color palette restrictions for authentic retro gaming style.`;
      }

    case "ai_saree":
      try {
        const parsed = JSON.parse(userPrompt);
        return `Using the provided portrait image, transform the subject into wearing an elegant ${parsed.saree_style || 'traditional silk'} saree with ${parsed.color_pattern || 'rich jewel-toned'} colors and ${parsed.draping_style || 'classic'} draping style, appropriate for ${parsed.occasion_type || 'formal'} occasions. Ensure natural fabric flow, cultural authenticity, and appropriate pose while maintaining the subject's facial features and identity.`;
      } catch (e) {
        return `Using the provided portrait image, transform the subject into wearing an elegant traditional silk saree with rich jewel-toned colors and classic draping style with natural fabric flow and cultural authenticity.`;
      }

    // ============ TWO-IMAGE EDITING STYLES ============
    case "virtual_try_on":
      if (!userPrompt.trim()) {
        return "Make the person in the first image wear the clothing or accessory from the second image with realistic fit, lighting, and natural appearance";
      }
      return userPrompt.trim();

    case "artistic_style_transfer":
      if (!userPrompt.trim()) {
        return "Apply the artistic style, colors, textures, and visual characteristics from the second image to the object or scene in the first image while preserving the original structure and composition";
      }
      return userPrompt.trim();

    case "virtual_hairstyle":
      if (!userPrompt.trim()) {
        return "Give the person in the first image the hairstyle from the second image with realistic hair texture, color matching, and natural blending that suits their face shape and features";
      }
      return userPrompt.trim();

    case "combine_objects":
      if (!userPrompt.trim()) {
        return "Seamlessly combine and merge the objects from both images into a single cohesive composition with realistic lighting, shadows, and natural positioning";
      }
      const predefinedSuggestions = [
        "Place the subject from image 1 next to the object from image 2 on a city street at sunset",
        "Put the product from image 2 into the person's hands from image 1 with consistent shadows",
        "Blend the dog from image 1 sitting on the sofa from image 2 in a cozy living room",
        "Combine the portrait from image 1 with the background from image 2, keep skin tones natural",
        "Make the character from image 1 riding the bicycle from image 2 on a park path",
        "Add the logo from image 2 onto the shirt in image 1 with realistic fabric texture and folds",
        "Place the object from image 2 on a table near the subject in image 1 under soft studio lighting",
        "Compose both objects on a clean white background with soft shadow under each"
      ];

      const matchedSuggestion = predefinedSuggestions.find(suggestion =>
        userPrompt.toLowerCase().includes(suggestion.toLowerCase().substring(0, 20))
      );

      return matchedSuggestion || userPrompt.trim();

    default:
      // If style is not recognized, return the original prompt
      return userPrompt.trim();
  }
}

async function verifyUserCredits(deviceId: string) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');
  
  const user = await usersCollection.findOne({ deviceId: deviceId });
  
  if (!user) {
    throw new Error(`User not found for deviceId: ${deviceId}`);
  }

  const subscriptionCredits = user.credits || 0;
  const extraCredits = user.extraCredits || 0;
  const totalAvailableCredits = subscriptionCredits + extraCredits;

  if (totalAvailableCredits < PHOTO_GENERATION_COST) {
    throw new Error('Insufficient credits');
  }

  return {
    subscriptionCredits,
    extraCredits,
    totalCreditsSpent: user.totalCreditsSpent || 0,
  };
}

async function deductUserCredit(deviceId: string) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({ deviceId: deviceId });

  if (!user) {
    throw new Error(`User not found for deviceId: ${deviceId}`);
  }

  const subscriptionCredits = user.credits || 0;
  const extraCredits = user.extraCredits || 0;

  let creditsToDeduct = PHOTO_GENERATION_COST;
  
  const deductFromSubscription = Math.min(subscriptionCredits, creditsToDeduct);
  creditsToDeduct -= deductFromSubscription;
  
  const deductFromExtra = Math.min(extraCredits, creditsToDeduct);
  creditsToDeduct -= deductFromExtra;

  if (creditsToDeduct > 0) {
    throw new Error('Insufficient credits for deduction.');
  }

  const result = await usersCollection.updateOne(
    { 
      deviceId: deviceId,
      credits: user.credits,
      extraCredits: user.extraCredits,
    },
    {
      $inc: {
        credits: -deductFromSubscription,
        extraCredits: -deductFromExtra,
        totalCreditsSpent: PHOTO_GENERATION_COST,
      },
      $set: {
        updatedAt: new Date(),
      }
    }
  );

  if (result.matchedCount === 0) {
    throw new Error('Credit deduction failed due to a concurrent request. Please try again.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceIdFromQuery = searchParams.get('deviceId') || undefined;

    const body = await req.json().catch(() => ({}));

    const deviceId: string | undefined = body.deviceId ?? deviceIdFromQuery;
    const prompt: string | undefined = body.prompt;
    const num_images: number | undefined = body.num_images;
    const output_format: string | undefined = body.output_format;
    const sync_mode: boolean | undefined = body.sync_mode;
    const image_urls: string[] | undefined = body.image_urls;
    const style: string | undefined = body.style;

    if (!prompt || !deviceId || !Array.isArray(image_urls) || image_urls.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Prompt, device identifier, and image_urls are required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    await verifyUserCredits(deviceId);

    // Generate the appropriate prompt based on style
    const generatedPrompt = style ? generateImagePrompt(prompt, style) : prompt;

    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: generatedPrompt,
        image_urls,
        num_images: num_images ?? 1,
        output_format: output_format ?? 'jpeg',
        sync_mode: sync_mode ?? false,
      },
      logs: true,
    });

    const generation = result.data as any;

    await deductUserCredit(deviceId);

    const db = await (await clientPromise).db();
    const photosCollection = db.collection('photos');
    
    const newPhotoRecord = {
      deviceId,
      prompt,
      generatedPrompt,
      images: generation?.images,
      description: generation?.description,
      style: style ?? null,
      falRequestId: result.requestId,
      model: "fal-ai/nano-banana/edit",
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await photosCollection.insertOne(newPhotoRecord);

    return new NextResponse(JSON.stringify({
      images: generation?.images,
      description: generation?.description,
      style: style ?? null,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    const message = error?.message || 'Internal server error';

    if (message === 'Insufficient credits') {
      return new NextResponse(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (message.includes('User not found')) {
      return new NextResponse(JSON.stringify({ error: message }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (message.includes('too long') || message.includes('Invalid') || message.includes('validation')) {
      return new NextResponse(JSON.stringify({ error: message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/*
 * Comprehensive Prompt Generation System (30+ Styles):
 * This endpoint automatically generates appropriate prompts based on the 'style' parameter.
 * All prompts follow Nano Banana best practices with "Using the provided image" context preservation.
 *
 * ============ STYLES REQUIRING USER INPUT (7 styles) ============
 * character_capsules, iphone_selfie, edit_text, time_based, ingredients_to_dish,
 * style_fusion, anatomy_illustration
 *
 * ============ MAINTOOLS STYLES - REFINED (13 styles) ============
 * remove_object, remove_background, change_background, upscale_image, expand_image,
 * glam_studio, hair_styler, smile_fix, beard_style, car_modify, skin_fix, age_changer, shape_tune
 *
 * ============ CREATIVE TRANSFORM STYLES (10 styles) ============
 * nano_3d_figure, chibi_knitted_doll, character_plush, funko_pop_figure, ghibli_style,
 * game_ui, line_to_image, photo_grid_pose, retro_16bit_character, ai_saree
 *
 * ============ TWO-IMAGE EDITING STYLES (4 styles) ============
 * virtual_try_on, artistic_style_transfer, virtual_hairstyle, combine_objects
 *
 * Features:
 * - JSON parameter parsing for complex styles with fallback to text parsing
 * - Professional quality requirements with context preservation
 * - Hyper-specific descriptions optimized for AI model performance
 * - Default prompts for two-image styles when user input is empty
 */