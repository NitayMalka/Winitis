const identity = (s) => s;

// Builds the plain-text share card. `tr` translates canonical values/labels (identity in English);
// user free text (name, grape, origin, price, notes, custom aromas) is never translated.
export const formatNoteText = (note, tr = identity, lang = 'en') => {
  const v = (val, fallback) => tr(val || fallback);
  const priceVal = note.conclusion?.price || note.price || tr('N/A');
  const regionVal = [note.region, note.country].filter(Boolean).join(', ') || tr('N/A');
  const aromas = note.nose?.aromas?.length ? note.nose.aromas.map(a => tr(a)).join(', ') : tr('N/A');
  const score = typeof note.conclusion?.score === 'number' ? `${note.conclusion.score}/100` : null;

  if (lang === 'he') {
    return `🍷 הערת טעימה מ-WINITIS: ${note.wineName || tr('Red Wine Evaluation')}
---------------------------------------
בציר: ${note.vintage || tr('N/A')} | זן: ${note.grape || tr('Red Blend')}
מקור: ${regionVal} | מחיר: ${priceVal} | אלכוהול: ${note.alcohol || tr('N/A')}

🎨 מראה:
צבע: ${v(note.color?.name, 'N/A')} (עוצמה: ${v(note.color?.intensity, 'Medium')})
שוליים: ${v(note.color?.rimVariation, 'Standard')}

👃 ארומה:
עוצמה: ${v(note.nose?.intensity, 'Medium')} | התפתחות: ${v(note.nose?.development, 'Youthful')}
ארומות עיקריות: ${aromas}

👅 חך:
מתיקות: ${v(note.palate?.sweetness, 'Dry')}
חומציות: ${v(note.palate?.acidity, 'Medium')}
טאנינים: ${v(note.palate?.tannin, 'Medium')}
גוף: ${v(note.palate?.body, 'Medium')}
סיומת: ${v(note.palate?.finish, 'Medium')}

⭐ ציון: ${score || 'הוערך'}
מחיר: ${priceVal}
איכות: ${v(note.conclusion?.quality, 'N/A')}
חלון שתייה: ${v(note.conclusion?.drinkWindow, 'N/A')}
הערות: "${note.conclusion?.notes || 'אין הערות'}"

הוערך באמצעות Winitis – אפליקציית טעימות יין אדום.`;
  }

  return `🍷 WINITIS SOMMELIER NOTE: ${note.wineName || 'Red Wine Evaluation'}
---------------------------------------
Vintage: ${note.vintage || 'N/A'} | Grape: ${note.grape || 'Red Blend'}
Origin: ${regionVal} | Price: ${priceVal} | Alcohol: ${note.alcohol || 'N/A'}

🎨 APPEARANCE:
Color: ${note.color?.name || 'N/A'} (${note.color?.intensity || 'Medium'} intensity)
Rim: ${note.color?.rimVariation || 'Standard'}

👃 NOSE:
Intensity: ${note.nose?.intensity || 'Medium'} | Development: ${note.nose?.development || 'Youthful'}
Key Aromas: ${aromas}

👅 PALATE:
Sweetness: ${note.palate?.sweetness || 'Dry'}
Acidity: ${note.palate?.acidity || 'Medium'}
Tannins: ${note.palate?.tannin || 'Medium'}
Body: ${note.palate?.body || 'Medium'}
Finish: ${note.palate?.finish || 'Medium'}

⭐ RATING: ${score || 'Evaluated'}
Price: ${priceVal}
Quality: ${note.conclusion?.quality || 'N/A'}
Drinking Window: ${note.conclusion?.drinkWindow || 'N/A'}
Notes: "${note.conclusion?.notes || 'No custom notes'}"

Evaluated via Winitis Red Wine Tasting PWA.`;
};

export const shareWineNote = async (note, tr = identity, lang = 'en') => {
  const text = formatNoteText(note, tr, lang);
  const title = lang === 'he' ? `הערת טעימה: ${note.wineName || tr('Red Wine Evaluation')}` : `Wine Note: ${note.wineName || 'Red Wine'}`;

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
