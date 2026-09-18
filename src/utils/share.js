export const formatNoteText = (note) => {
  const priceVal = note.conclusion?.price || note.price || 'N/A';
  const regionVal = [note.region, note.country].filter(Boolean).join(', ') || 'N/A';

  return `🍷 WINITIS SOMMELIER NOTE: ${note.wineName || 'Red Wine Evaluation'}
---------------------------------------
Vintage: ${note.vintage || 'N/A'} | Grape: ${note.grape || 'Red Blend'}
Origin: ${regionVal} | Price: ${priceVal} | Alc: ${note.alcohol || 'N/A'}

🎨 APPEARANCE:
Color: ${note.color?.name || 'N/A'} (${note.color?.intensity || 'Medium'} intensity)
Rim: ${note.color?.rimVariation || 'Standard'}

👃 NOSE:
Intensity: ${note.nose?.intensity || 'Medium'} | Dev: ${note.nose?.development || 'Youthful'}
Key Aromas: ${note.nose?.aromas?.join(', ') || 'N/A'}

👅 PALATE:
Sweetness: ${note.palate?.sweetness || 'Dry'}
Acidity: ${note.palate?.acidity || 'Medium'}
Tannins: ${note.palate?.tannin || 'Medium'}
Body: ${note.palate?.body || 'Medium'}
Finish: ${note.palate?.finish || 'Medium'}

⭐ RATING: ${note.conclusion?.score ? `${note.conclusion.score}/100` : 'Evaluated'}
Price: ${priceVal}
Quality: ${note.conclusion?.quality || 'N/A'}
Drinking Window: ${note.conclusion?.drinkWindow || 'N/A'}
Notes: "${note.conclusion?.notes || 'No custom notes'}"

Evaluated via Winitis Red Wine Tasting PWA.`;
};

export const shareWineNote = async (note) => {
  const text = formatNoteText(note);
  const title = `Wine Note: ${note.wineName || 'Red Wine'}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: window.location.href
      });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, falling back to clipboard', err);
      }
    }
  }

  // Fallback to Clipboard
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  } catch (err) {
    console.error('Clipboard copy failed', err);
    return { success: false, error: err };
  }
};
