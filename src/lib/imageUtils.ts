import { v4 as uuidv4 } from "uuid";
import { SyntheticEvent } from "react";

/**
 * Compresses an image file into a highly-optimized, small JPEG Base64 string.
 * This ensures that if standard storage uploads timeout or fail offline,
 * we can save a super-compact visual directly into Firestore (<50KB),
 * which persists permanently and loads beautifully!
 */
export const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Define clean standard preview bounds
        const MAX_WIDTH = 480;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress at 0.65 JPEG quality for excellent compression ratio (~15KB to 30KB)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve("");
      };
    };
    reader.onerror = () => {
      resolve("");
    };
  });
};

/**
 * Generates beautiful, campus-themed Unsplash fallbacks with perfect resolution
 * matching the user's listing properties if their image url fails or is broken dynamic blob.
 */
export function getCategoryFallbackImage(category?: string, title?: string): string {
  const t = (title || "").toLowerCase();
  
  if (t.includes("lamp") || t.includes("light") || t.includes("led")) {
    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600"; // Black adjustable desk lamp
  }
  if (t.includes("hoodie") || t.includes("clothing") || t.includes("shirt") || t.includes("jacket") || t.includes("sweater")) {
    return "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600"; // University Hoodie
  }
  if (t.includes("backpack") || t.includes("bag") || t.includes("canvas") || t.includes("ergonomic")) {
    return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600"; // Backpack
  }
  if (t.includes("coffee") || t.includes("machine") || t.includes("espresso") || t.includes("appliances")) {
    return "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600"; // Compact coffee machine
  }
  if (t.includes("desk") || t.includes("table") || t.includes("chair") || t.includes("furniture") || t.includes("dorm")) {
    return "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?q=80&w=600"; // Campus Dorm desk
  }
  if (t.includes("headphone") || t.includes("audio") || t.includes("speaker") || t.includes("anc")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600"; // Headphones
  }

  const cat = (category || "").toLowerCase();
  switch (cat) {
    case "electronics":
      return "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600"; // Tablet / device
    case "textbooks":
    case "books":
      return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600"; // books
    case "lab gear":
    case "science":
      return "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600"; // lab microscope / tube
    case "furniture":
      return "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600"; // stylish furniture
    case "appliances":
      return "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600"; // blender/kettle
    default:
      return "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600"; // generic workspace
  }
}

/**
 * Gracefully replace a broken image src with a clean Unsplash visual fallback.
 */
export const handleImageErrorEvent = (e: SyntheticEvent<HTMLImageElement, Event>, category?: string, title?: string) => {
  const imgElement = e.currentTarget;
  const fallback = getCategoryFallbackImage(category, title);
  if (imgElement.src !== fallback) {
    imgElement.src = fallback;
  }
};
